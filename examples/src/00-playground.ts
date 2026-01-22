import { openaiImage, geminiImage, generateImage } from '@seashorelab/llm';

const openaiImageAdapter = openaiImage('dall-e-3', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

const geminiImageAdapter = geminiImage('imagen-3.0-generate-002', {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_API_BASE_URL,
});

const result = await generateImage({
  adapter: openaiImageAdapter,
  prompt: 'A quick brown fox jumping over the lazy dog',
  // These 3 options are only valid for OpenAI
  size: '1024x1024',
  quality: 'standard',
  n: 1,
  // Provide extra model options if needed
  modelOptions: {},
});

const image = result.images[0];
const urlOrB64 = image.url ?? image.b64Json;
