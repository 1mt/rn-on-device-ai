import ExpoModulesCore
import FoundationModels

public class OnDeviceAIModule: Module {
    private var session: LanguageModelSession?
    private var isGenerating = false
    private var currentTask: Task<Void, Never>?

    public func definition() -> ModuleDefinition {
        Name("OnDeviceAI")

        Events("onToken", "onComplete", "onError")

        // Check availability
        AsyncFunction("checkAvailability") { () -> [String: Any?] in
            let model = SystemLanguageModel.default
            switch model.availability {
            case .available:
                return ["status": "available", "reason": nil]
            case .unavailable(let reason):
                let reasonString: String
                switch reason {
                case .appleIntelligenceNotEnabled:
                    reasonString = "appleIntelligenceNotEnabled"
                case .deviceNotEligible:
                    reasonString = "deviceNotEligible"
                case .modelNotReady:
                    reasonString = "modelNotReady"
                @unknown default:
                    reasonString = "unknown"
                }
                return ["status": "unavailable", "reason": reasonString]
            }
        }

        // Download model (no-op on iOS, model is managed by system)
        AsyncFunction("downloadModel") { () -> Bool in
            return true
        }

        // Initialize session
        AsyncFunction("initSession") { (options: SessionOptions?) in
            let instructions = options?.systemPrompt ?? ""
            if instructions.isEmpty {
                self.session = LanguageModelSession()
            } else {
                self.session = LanguageModelSession(instructions: {
                    instructions
                })
            }
        }

        // Non-streaming generation
        AsyncFunction("generate") { (prompt: String, options: GenerateOptions?) -> String in
            guard let session = self.session else {
                throw OnDeviceAIError.sessionNotInitialized
            }

            let genOptions = GenerationOptions(
                temperature: options?.temperature ?? 0.7,
                maximumResponseTokens: options?.maxTokens ?? 200
            )

            let response = try await session.respond(to: prompt, options: genOptions)
            return response.content
        }

        // Streaming generation
        AsyncFunction("startStreaming") { (prompt: String, options: GenerateOptions?) in
            guard let session = self.session else {
                throw OnDeviceAIError.sessionNotInitialized
            }

            self.isGenerating = true

            self.currentTask = Task {
                do {
                    let stream = session.streamResponse(to: prompt)
                    var tokenIndex = 0

                    for try await chunk in stream {
                        guard self.isGenerating else { break }
                        self.sendEvent("onToken", ["token": chunk.content, "index": tokenIndex])
                        tokenIndex += 1
                    }

                    self.sendEvent("onComplete", [
                        "totalTokens": tokenIndex,
                        "finishReason": self.isGenerating ? "complete" : "cancelled"
                    ])
                } catch {
                    self.sendEvent("onError", [
                        "message": error.localizedDescription,
                        "code": "GENERATION_ERROR"
                    ])
                }
                self.isGenerating = false
            }
        }

        Function("stopStreaming") {
            self.isGenerating = false
            self.currentTask?.cancel()
        }

        // Summarization via prompt
        AsyncFunction("summarize") { (text: String, options: SummarizeOptions?) -> String in
            guard let session = self.session else {
                throw OnDeviceAIError.sessionNotInitialized
            }

            let style = options?.style ?? "concise"
            let prompt: String
            switch style {
            case "bullets":
                prompt = """
                Summarize the following text as 3 bullet points. Output only the bullet points:

                \(text)
                """
            case "headline":
                prompt = """
                Create a short headline (under 10 words) summarizing the following text. Output only the headline:

                \(text)
                """
            default:
                prompt = """
                Summarize the following text in a concise manner (2-3 sentences). Output only the summary:

                \(text)
                """
            }

            let response = try await session.respond(
                to: prompt,
                options: GenerationOptions(temperature: 0.3)
            )
            return response.content
        }

        // Rewrite
        AsyncFunction("rewrite") { (text: String, style: String) -> String in
            guard let session = self.session else {
                throw OnDeviceAIError.sessionNotInitialized
            }

            let styleInstruction: String
            switch style {
            case "professional":
                styleInstruction = "in a professional, formal tone"
            case "friendly":
                styleInstruction = "in a friendly, casual tone"
            case "shorter":
                styleInstruction = "to be more concise while keeping the meaning"
            case "longer":
                styleInstruction = "to be more detailed and elaborate"
            default:
                styleInstruction = "using different words while keeping the same meaning"
            }

            let prompt = """
            Rewrite the following text \(styleInstruction). Output only the rewritten text:

            \(text)
            """

            let response = try await session.respond(to: prompt)
            return response.content
        }

        // Clear session
        Function("clearSession") {
            self.session = nil
        }

        OnDestroy {
            self.currentTask?.cancel()
            self.session = nil
        }
    }
}

struct SessionOptions: Record {
    @Field var systemPrompt: String?
}

struct GenerateOptions: Record {
    @Field var temperature: Double?
    @Field var maxTokens: Int?
}

struct SummarizeOptions: Record {
    @Field var style: String?
}

final class OnDeviceAIError: GenericException<String> {
    static let sessionNotInitialized = OnDeviceAIError(
        "SESSION_NOT_INITIALIZED",
        "Session not initialized. Call initSession() first."
    )

    init(_ name: String, _ description: String) {
        super.init(name)
    }
}
