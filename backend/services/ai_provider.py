import os
import logging
from typing import List, Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai_provider")


class AiProviderService:
    @staticmethod
    def get_health() -> Dict[str, bool]:
        """Returns health status indicating presence of required backend credentials without exposing secrets."""
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        cf_account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
        cf_token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

        return {
            "groq": bool(groq_key),
            "cloudflare": bool(cf_account and cf_token),
            "gemini": bool(gemini_key)
        }

    @classmethod
    async def call_groq(
        cls,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key:
            return {
                "success": False,
                "provider": "groq",
                "model": model or "openai/gpt-oss-120b",
                "error": "GROQ_API_KEY is not configured on the backend.",
                "fallback_used": False
            }

        requested_model = model.strip() if (model and model.strip()) else "openai/gpt-oss-120b"
        unique_models = [requested_model]
        if "openai/gpt-oss-120b" not in unique_models:
            unique_models.append("openai/gpt-oss-120b")

        last_error = ""
        async with httpx.AsyncClient(timeout=60.0) as client:
            for idx, candidate in enumerate(unique_models):
                try:
                    payload = {
                        "model": candidate,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json=payload
                    )
                    if response.is_success:
                        data = response.json()
                        content = ""
                        if "choices" in data and len(data["choices"]) > 0:
                            content = data["choices"][0].get("message", {}).get("content", "")
                        return {
                            "success": True,
                            "provider": "groq",
                            "model": candidate,
                            "content": content,
                            "usage": data.get("usage", {}),
                            "fallback_used": (idx > 0)
                        }
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text}"
                        logger.warning(f"Groq candidate model {candidate} failed: {last_error}")
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning(f"Groq request exception with {candidate}: {exc}")

        return {
            "success": False,
            "provider": "groq",
            "model": requested_model,
            "error": f"All Groq models failed. Last error: {last_error}",
            "fallback_used": False
        }

    @classmethod
    async def call_cloudflare(
        cls,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
        api_token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()

        target_model = model.strip() if (model and model.strip()) else "@cf/zai-org/glm-4.7-flash"

        if not account_id or not api_token:
            return {
                "success": False,
                "provider": "cloudflare",
                "model": target_model,
                "error": "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is not configured on the backend.",
                "fallback_used": False
            }

        endpoint = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions"
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {api_token}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if response.is_success:
                    data = response.json()
                    content = ""
                    if "choices" in data and len(data["choices"]) > 0:
                        content = data["choices"][0].get("message", {}).get("content", "")
                    elif "result" in data and isinstance(data["result"], dict):
                        content = data["result"].get("response", "")
                    return {
                        "success": True,
                        "provider": "cloudflare",
                        "model": target_model,
                        "content": content,
                        "usage": data.get("usage", {}),
                        "fallback_used": False
                    }
                else:
                    return {
                        "success": False,
                        "provider": "cloudflare",
                        "model": target_model,
                        "error": f"HTTP {response.status_code}: {response.text}",
                        "fallback_used": False
                    }
            except Exception as exc:
                return {
                    "success": False,
                    "provider": "cloudflare",
                    "model": target_model,
                    "error": str(exc),
                    "fallback_used": False
                }

    @classmethod
    async def call_gemini(
        cls,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        target_model = model.strip() if (model and model.strip()) else "gemini-3.6-flash"

        if not api_key:
            return {
                "success": False,
                "provider": "gemini",
                "model": target_model,
                "error": "GEMINI_API_KEY is not configured on the backend.",
                "fallback_used": False
            }

        # Format messages for Gemini API
        system_instructions = []
        contents = []
        for m in messages:
            role = m.get("role", "user")
            content_text = m.get("content", "")
            if role == "system":
                system_instructions.append(content_text)
            else:
                gemini_role = "model" if role == "assistant" else "user"
                contents.append({
                    "role": gemini_role,
                    "parts": [{"text": content_text}]
                })

        native_url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
        native_payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        if system_instructions:
            native_payload["systemInstruction"] = {
                "parts": [{"text": "\n\n".join(system_instructions)}]
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    native_url,
                    headers={"Content-Type": "application/json"},
                    json=native_payload
                )
                if response.is_success:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    content = ""
                    if candidates and len(candidates) > 0:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and len(parts) > 0:
                            content = parts[0].get("text", "")
                    return {
                        "success": True,
                        "provider": "gemini",
                        "model": target_model,
                        "content": content,
                        "usage": data.get("usageMetadata", {}),
                        "fallback_used": False
                    }
                else:
                    return {
                        "success": False,
                        "provider": "gemini",
                        "model": target_model,
                        "error": f"HTTP {response.status_code}: {response.text}",
                        "fallback_used": False
                    }
            except Exception as exc:
                return {
                    "success": False,
                    "provider": "gemini",
                    "model": target_model,
                    "error": str(exc),
                    "fallback_used": False
                }

    @classmethod
    async def _execute_provider(
        cls,
        provider: str,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        p = (provider or "").lower().strip()
        if p == "groq":
            return await cls.call_groq(messages, model=model, temperature=temperature, max_tokens=max_tokens)
        elif p == "cloudflare":
            return await cls.call_cloudflare(messages, model=model, temperature=temperature, max_tokens=max_tokens)
        elif p == "gemini":
            return await cls.call_gemini(messages, model=model, temperature=temperature, max_tokens=max_tokens)
        else:
            return {
                "success": False,
                "provider": provider,
                "model": model or "",
                "error": f"Unsupported AI provider '{provider}'. Supported providers: 'groq', 'cloudflare', 'gemini'.",
                "fallback_used": False
            }

    @classmethod
    async def route_chat(
        cls,
        provider: str,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
        fallback: bool = True,
        fallback_provider: Optional[str] = None
    ) -> Dict[str, Any]:
        normalized_provider = (provider or "groq").lower().strip()

        # 1. Execute Primary Provider Call
        primary_result = await cls._execute_provider(
            provider=normalized_provider,
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )

        if primary_result.get("success", False) or not fallback:
            return primary_result

        # 2. If Primary Failed and Fallback is Enabled, Execute Secondary Chain
        logger.warning(
            f"Primary AI provider '{normalized_provider}' failed: {primary_result.get('error')}. Routing to secondary fallback provider..."
        )

        health = cls.get_health()
        fallback_candidates: List[str] = []

        if fallback_provider and fallback_provider.lower().strip() != normalized_provider:
            fallback_candidates.append(fallback_provider.lower().strip())

        # Standard default fallback priority order
        default_chain = ["cloudflare", "gemini", "groq"]
        for cand in default_chain:
            if cand != normalized_provider and cand not in fallback_candidates:
                fallback_candidates.append(cand)

        for candidate in fallback_candidates:
            if not health.get(candidate, False):
                continue

            logger.info(f"Attempting fallback provider '{candidate}' for request originally targeted at '{normalized_provider}'...")
            fallback_result = await cls._execute_provider(
                provider=candidate,
                messages=messages,
                model=None,  # Use candidate's default optimal model
                temperature=temperature,
                max_tokens=max_tokens
            )

            if fallback_result.get("success", False):
                fallback_result["fallback_used"] = True
                fallback_result["fallback_from"] = normalized_provider
                fallback_result["original_error"] = primary_result.get("error")
                return fallback_result
            else:
                logger.warning(f"Fallback provider '{candidate}' also failed: {fallback_result.get('error')}")

        # All providers failed
        return {
            "success": False,
            "provider": normalized_provider,
            "model": model or "",
            "error": f"Primary provider '{normalized_provider}' and all fallback candidates failed. Primary error: {primary_result.get('error')}",
            "fallback_used": True
        }
