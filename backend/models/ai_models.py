from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"] = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Message text content")


class AiChatRequest(BaseModel):
    provider: Literal["groq", "cloudflare", "gemini"] = Field(
        default="groq",
        description="Target AI provider: 'groq', 'cloudflare', or 'gemini'"
    )
    model: Optional[str] = Field(default=None, description="Optional custom model ID")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    temperature: float = Field(default=0.1, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(default=1024, ge=1, le=32768, description="Maximum tokens to generate")
    fallback: bool = Field(default=False, description="Enable automatic fallback to secondary provider if primary fails")
    fallback_provider: Optional[Literal["groq", "cloudflare", "gemini"]] = Field(
        default=None,
        description="Explicit secondary provider to use as fallback"
    )
