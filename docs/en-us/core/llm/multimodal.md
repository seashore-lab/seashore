# Multimodal Support

`@seashore/llm` also exposes adapters for multimodal tasks:

- image generation (e.g. DALL·E, Imagen)
- video generation (e.g. Sora)
- transcription (speech-to-text)
- text-to-speech

This is described in the spec contract at `specs/001-agent-framework/contracts/llm.api.md`.

If you are building a product feature that needs multimodal, prefer keeping multimodal adapters isolated behind tools or workflow nodes so your agent prompt stays small.
