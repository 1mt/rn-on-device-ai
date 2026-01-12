package expo.modules.ondeviceai

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.exception.CodedException
import androidx.core.os.bundleOf
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.DownloadStatus
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

        AsyncFunction("checkAvailability") Coroutine { ->
            val model = getOrCreateModel()
            val status = model.checkStatus().await()
            mapOf(
                "status" to when (status) {
                    FeatureStatus.AVAILABLE -> "available"
                    FeatureStatus.DOWNLOADING -> "downloading"
                    FeatureStatus.DOWNLOADABLE -> "downloadable"
                    else -> "unavailable"
                },
                "reason" to if (status == FeatureStatus.UNAVAILABLE)
                    "deviceNotSupported" else null
            )
        }

        AsyncFunction("downloadModel") Coroutine { ->
            val model = getOrCreateModel()
            var success = false
            model.download().collect { status ->
                when (status) {
                    DownloadStatus.DownloadCompleted -> success = true
                    is DownloadStatus.DownloadFailed -> throw status.e
                    else -> {}
                }
            }
            success
        }

        AsyncFunction("initSession") { options: SessionOptions? ->
            systemPrompt = options?.systemPrompt
            // Ensure model is initialized
            getOrCreateModel()
        }

        AsyncFunction("generate") Coroutine { prompt: String, options: GenerateOptions? ->
            val model = getOrCreateModel()
            val fullPrompt = buildPrompt(prompt)
            val request = generateContentRequest(TextPart(fullPrompt)) {
                temperature = (options?.temperature ?: 0.7).toFloat()
                maxOutputTokens = options?.maxTokens ?: 256
            }
            model.generateContent(request)
                .candidates.firstOrNull()?.text
                ?: throw GenerationException()
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

        AsyncFunction("summarize") Coroutine { text: String, options: SummarizeOptions? ->
            val context = appContext.reactContext
                ?: throw ContextException()

            val outputType = when (options?.style?.lowercase()) {
                "bullets" -> SummarizerOptions.OutputType.THREE_BULLETS
                "headline" -> SummarizerOptions.OutputType.HEADLINE
                else -> SummarizerOptions.OutputType.ONE_BULLET
            }

            val summarizerOptions = SummarizerOptions.builder(context)
                .setInputType(SummarizerOptions.InputType.ARTICLE)
                .setOutputType(outputType)
                .setLanguage(SummarizerOptions.Language.ENGLISH)
                .build()

            val summarizer = Summarization.getClient(summarizerOptions)

            // Check and download if needed
            val status = summarizer.checkStatus().await()
            if (status == FeatureStatus.DOWNLOADABLE) {
                summarizer.download().collect { downloadStatus ->
                    if (downloadStatus is DownloadStatus.DownloadFailed) {
                        throw downloadStatus.e
                    }
                }
            }

            val request = SummarizationRequest.builder(text).build()
            val result = summarizer.runInference(request).await()
            summarizer.close()
            result.summary ?: throw SummarizationException()
        }

        AsyncFunction("rewrite") Coroutine { text: String, style: String ->
            val context = appContext.reactContext
                ?: throw ContextException()

            val outputType = when (style.lowercase()) {
                "professional" -> RewriterOptions.OutputType.PROFESSIONAL
                "friendly" -> RewriterOptions.OutputType.FRIENDLY
                "shorter" -> RewriterOptions.OutputType.SHORTEN
                "longer" -> RewriterOptions.OutputType.ELABORATE
                else -> RewriterOptions.OutputType.REPHRASE
            }

            val options = RewriterOptions.builder(context)
                .setOutputType(outputType)
                .build()

            val rewriter = Rewriting.getClient(options)

            // Check and download if needed
            val status = rewriter.checkStatus().await()
            if (status == FeatureStatus.DOWNLOADABLE) {
                rewriter.download().collect { downloadStatus ->
                    if (downloadStatus is DownloadStatus.DownloadFailed) {
                        throw downloadStatus.e
                    }
                }
            }

            val request = RewritingRequest.builder(text).build()
            val result = rewriter.runInference(request).await()
            rewriter.close()
            result.rewrittenTexts.firstOrNull() ?: text
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
    code = "GENERATION_FAILED",
    message = "Failed to generate content"
)

class SummarizationException : CodedException(
    code = "SUMMARIZATION_FAILED",
    message = "Failed to summarize content"
)

class ContextException : CodedException(
    code = "CONTEXT_UNAVAILABLE",
    message = "React context is not available"
)
