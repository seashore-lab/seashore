/**
 * @seashore/llm
 *
 * LLM adapters and multimodal support for Seashore Agent Framework
 */

// Types
export type {
  Message,
  MessageRole,
  ToolCall,
  TokenUsage,
  StreamChunk,
  StreamChunkType,
  TextAdapter,
  ImageAdapter,
  VideoAdapter,
  TranscriptionAdapter,
  TTSAdapter,
  EmbeddingAdapter,
  ImageGenerationResult,
  ImageOutput,
  VideoGenerationJob,
  TranscriptionResult,
  TranscriptionSegment,
  SpeechResult,
  EmbeddingResult,
  BatchEmbeddingResult,
  ChatOptions,
  ImageGenerationOptions,
  TranscriptionOptions,
  SpeechOptions,
  EmbeddingOptions,
} from './types.js';

// Text adapters (re-exports from @tanstack/ai-*)
export {
  openaiText,
  anthropicText,
  geminiText,
  chat,
  generate,
  toStreamResponse,
  createOpenAIAdapter,
  createAnthropicAdapter,
  createGeminiAdapter,
  DEFAULT_MODELS,
} from './adapters.js';

// Embedding adapters
export {
  openaiEmbed,
  geminiEmbed,
  generateEmbedding,
  generateBatchEmbeddings,
} from './embedding.js';

// Multimodal adapters
export {
  // Image
  openaiImage,
  geminiImage,
  generateImage,
  // Video
  openaiVideo,
  generateVideo,
  checkVideoStatus,
  // Transcription
  openaiTranscription,
  generateTranscription,
  // TTS
  openaiTTS,
  geminiTTS,
  generateSpeech,
} from './multimodal.js';
