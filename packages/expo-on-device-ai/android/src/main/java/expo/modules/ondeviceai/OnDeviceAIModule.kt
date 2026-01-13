package expo.modules.ondeviceai

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.Promise
import androidx.core.os.bundleOf
import kotlinx.coroutines.*
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.DownloadCallback
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.prompt.*
import com.google.mlkit.genai.summarization.*
import com.google.mlkit.genai.rewriting.*

class OnDeviceAIModule : Module() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var generativeModel: GenerativeModel? = null
    private var streamingJob: Job? = null
    private var systemPrompt: String? = null

    override fun definition() = ModuleDefinition {
        Name("OnDeviceAI")

        Events("onToken", "onComplete", "onError")

        AsyncFunction("checkAvailability") { promise: Promise ->
            scope.launch {
                try {
                    val model = getOrCreateModel()
                    val status = model.checkStatus()
                    val result = mapOf(
                        "status" to when (status) {
                            FeatureStatus.AVAILABLE -> "available"
                            FeatureStatus.DOWNLOADING -> "downloading"
                            FeatureStatus.DOWNLOADABLE -> "downloadable"
                            else -> "unavailable"
                        },
                        "reason" to if (status == FeatureStatus.UNAVAILABLE)
                            "deviceNotSupported" else null
                    )
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject(CodedException("CHECK_AVAILABILITY_FAILED", e.message, e))
                }
            }
        }

        AsyncFunction("downloadModel") { promise: Promise ->
            scope.launch {
                try {
                    val model = getOrCreateModel()
                    var success = false
                    model.download().collect { status ->
                        when (status) {
                            DownloadStatus.DownloadCompleted -> success = true
                            is DownloadStatus.DownloadFailed -> throw status.e
                            else -> {}
                        }
                    }
                    promise.resolve(success)
                } catch (e: Exception) {
                    promise.reject(CodedException("DOWNLOAD_FAILED", e.message, e))
                }
            }
        }

        AsyncFunction("initSession") { options: SessionOptions? ->
            systemPrompt = options?.systemPrompt
            // Ensure model is initialized
            getOrCreateModel()
        }

        AsyncFunction("generate") { prompt: String, options: GenerateOptions?, promise: Promise ->
            scope.launch {
                try {
                    val model = getOrCreateModel()
                    val fullPrompt = buildPrompt(prompt)
                    val request = generateContentRequest(
                        TextPart(fullPrompt)
                    ) {
                        temperature = (options?.temperature ?: 0.7).toFloat()
                        maxOutputTokens = options?.maxTokens ?: 256
                    }
                    val response = model.generateContent(request)
                    val text = response.candidates.firstOrNull()?.text
                        ?: throw GenerationException()
                    promise.resolve(text)
                } catch (e: GenerationException) {
                    promise.reject(e)
                } catch (e: Exception) {
                    promise.reject(CodedException("GENERATION_FAILED", e.message, e))
                }
            }
        }

        AsyncFunction("startStreaming") { prompt: String, options: GenerateOptions? ->
            streamingJob = scope.launch {
                try {
                    val model = getOrCreateModel()
                    val fullPrompt = buildPrompt(prompt)
                    var tokenIndex = 0

                    model.generateContentStream(fullPrompt).collect { chunk ->
                        chunk.candidates.firstOrNull()?.text?.let { text ->
                            sendEvent("onToken", bundleOf(
                                "token" to text,
                                "index" to tokenIndex
                            ))
                            tokenIndex++
                        }
                    }

                    sendEvent("onComplete", bundleOf(
                        "totalTokens" to tokenIndex,
                        "finishReason" to "complete"
                    ))
                } catch (e: CancellationException) {
                    sendEvent("onComplete", bundleOf(
                        "totalTokens" to 0,
                        "finishReason" to "cancelled"
                    ))
                } catch (e: Exception) {
                    sendEvent("onError", bundleOf(
                        "message" to (e.message ?: "Unknown error"),
                        "code" to "GENERATION_ERROR"
                    ))
                }
            }
        }

        Function("stopStreaming") {
            streamingJob?.cancel()
        }

        AsyncFunction("summarize") { text: String, options: SummarizeOptions?, promise: Promise ->
            scope.launch {
                try {
                    val context = appContext.reactContext
                        ?: throw ContextException()

                    val outputType = when (options?.style?.lowercase()) {
                        "bullets", "three_bullets" -> SummarizerOptions.OutputType.THREE_BULLETS
                        "one_bullet" -> SummarizerOptions.OutputType.ONE_BULLET
                        else -> SummarizerOptions.OutputType.ONE_BULLET
                    }

                    val summarizerOptions = SummarizerOptions.builder(context)
                        .setInputType(SummarizerOptions.InputType.ARTICLE)
                        .setOutputType(outputType)
                        .setLanguage(SummarizerOptions.Language.ENGLISH)
                        .build()

                    val summarizer = Summarization.getClient(summarizerOptions)

                    // Check and download if needed (ListenableFuture.get() blocks, OK on IO dispatcher)
                    val status = withContext(Dispatchers.IO) {
                        summarizer.checkFeatureStatus().get()
                    }
                    if (status == FeatureStatus.DOWNLOADABLE) {
                        val downloadDeferred = CompletableDeferred<Boolean>()
                        summarizer.downloadFeature(object : DownloadCallback {
                            override fun onDownloadCompleted() {
                                downloadDeferred.complete(true)
                            }
                            override fun onDownloadFailed(e: GenAiException) {
                                downloadDeferred.completeExceptionally(e)
                            }
                            override fun onDownloadProgress(totalBytesDownloaded: Long) {}
                            override fun onDownloadStarted(bytesToDownload: Long) {}
                        })
                        downloadDeferred.await()
                    }

                    val request = SummarizationRequest.builder(text).build()
                    val result = withContext(Dispatchers.IO) {
                        summarizer.runInference(request).get()
                    }
                    summarizer.close()

                    val summary = result.getSummary() ?: throw SummarizationException()
                    promise.resolve(summary)
                } catch (e: SummarizationException) {
                    promise.reject(e)
                } catch (e: ContextException) {
                    promise.reject(e)
                } catch (e: Exception) {
                    promise.reject(CodedException("SUMMARIZATION_FAILED", e.message, e))
                }
            }
        }

        AsyncFunction("rewrite") { text: String, style: String, promise: Promise ->
            scope.launch {
                try {
                    val context = appContext.reactContext
                        ?: throw ContextException()

                    val outputType = when (style.lowercase()) {
                        "professional" -> RewriterOptions.OutputType.PROFESSIONAL
                        "friendly" -> RewriterOptions.OutputType.FRIENDLY
                        "shorter", "shorten" -> RewriterOptions.OutputType.SHORTEN
                        "longer", "elaborate" -> RewriterOptions.OutputType.ELABORATE
                        "emojify" -> RewriterOptions.OutputType.EMOJIFY
                        else -> RewriterOptions.OutputType.REPHRASE
                    }

                    val rewriterOptions = RewriterOptions.builder(context)
                        .setOutputType(outputType)
                        .setLanguage(RewriterOptions.Language.ENGLISH)
                        .build()

                    val rewriter = Rewriting.getClient(rewriterOptions)

                    // Check and download if needed (ListenableFuture.get() blocks, OK on IO dispatcher)
                    val status = withContext(Dispatchers.IO) {
                        rewriter.checkFeatureStatus().get()
                    }
                    if (status == FeatureStatus.DOWNLOADABLE) {
                        val downloadDeferred = CompletableDeferred<Boolean>()
                        rewriter.downloadFeature(object : DownloadCallback {
                            override fun onDownloadCompleted() {
                                downloadDeferred.complete(true)
                            }
                            override fun onDownloadFailed(e: GenAiException) {
                                downloadDeferred.completeExceptionally(e)
                            }
                            override fun onDownloadProgress(totalBytesDownloaded: Long) {}
                            override fun onDownloadStarted(bytesToDownload: Long) {}
                        })
                        downloadDeferred.await()
                    }

                    val request = RewritingRequest.builder(text).build()
                    val result = withContext(Dispatchers.IO) {
                        rewriter.runInference(request).get()
                    }
                    rewriter.close()

                    // Access rewritten text via getResults().firstOrNull()?.text
                    val rewrittenText = result.getResults().firstOrNull()?.text ?: text
                    promise.resolve(rewrittenText)
                } catch (e: ContextException) {
                    promise.reject(e)
                } catch (e: Exception) {
                    promise.reject(CodedException("REWRITE_FAILED", e.message, e))
                }
            }
        }

        Function("clearSession") {
            systemPrompt = null
        }

        OnDestroy {
            scope.cancel()
        }
    }

    private fun getOrCreateModel(): GenerativeModel {
        return generativeModel ?: Generation.getClient().also {
            generativeModel = it
        }
    }

    private fun buildPrompt(userPrompt: String): String {
        return systemPrompt?.let { "$it\n\n$userPrompt" } ?: userPrompt
    }
}

class SessionOptions : Record {
    @Field
    val systemPrompt: String? = null
}

class GenerateOptions : Record {
    @Field
    val temperature: Double? = null

    @Field
    val maxTokens: Int? = null
}

class SummarizeOptions : Record {
    @Field
    val style: String? = null
}

class GenerationException : CodedException(
    "GENERATION_FAILED",
    "Failed to generate content",
    null
)

class SummarizationException : CodedException(
    "SUMMARIZATION_FAILED",
    "Failed to summarize content",
    null
)

class ContextException : CodedException(
    "CONTEXT_UNAVAILABLE",
    "React context is not available",
    null
)
