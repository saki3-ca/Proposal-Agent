from enum import Enum
from typing import Literal, Dict, Union
from pydantic import BaseModel, Field


class AiTaskType(str, Enum):
    TOR_ANALYSIS = "tor_analysis"
    REQUIREMENT_EXTRACTION = "requirement_extraction"
    REQUIREMENT_MATRIX = "requirement_matrix"
    PROPOSAL_DRAFTING = "proposal_drafting"
    METHODOLOGY_DRAFTING = "methodology_drafting"
    DOCUMENT_COMPARISON = "document_comparison"
    PROOFREADING = "proofreading"
    COMPLIANCE_REVIEW = "compliance_review"
    DOCUMENT_SYNTHESIS = "document_synthesis"
    EVIDENCE_MATCHING = "evidence_matching"


class TaskRoute(BaseModel):
    task_type: str = Field(..., description="Application AI task type")
    primary_provider: Literal["groq", "cloudflare", "gemini"] = Field(
        ...,
        description="Primary assigned AI provider"
    )
    primary_model: str = Field(
        ...,
        description="Model ID for primary AI provider"
    )
    backup_provider: Literal["groq", "cloudflare", "gemini"] = Field(
        ...,
        description="Backup fallback AI provider"
    )
    backup_model: str = Field(
        ...,
        description="Model ID for backup AI provider"
    )


# Centralized Task Routing Configuration Matrix
TASK_ROUTING_TABLE: Dict[str, Dict[str, str]] = {
    AiTaskType.TOR_ANALYSIS.value: {
        "primary_provider": "gemini",
        "primary_model": "gemini-3.6-flash",
        "backup_provider": "cloudflare",
        "backup_model": "@cf/zai-org/glm-4.7-flash"
    },
    AiTaskType.REQUIREMENT_EXTRACTION.value: {
        "primary_provider": "gemini",
        "primary_model": "gemini-3.6-flash",
        "backup_provider": "cloudflare",
        "backup_model": "@cf/zai-org/glm-4.7-flash"
    },
    AiTaskType.REQUIREMENT_MATRIX.value: {
        "primary_provider": "groq",
        "primary_model": "openai/gpt-oss-120b",
        "backup_provider": "gemini",
        "backup_model": "gemini-3.6-flash"
    },
    AiTaskType.PROPOSAL_DRAFTING.value: {
        "primary_provider": "gemini",
        "primary_model": "gemini-3.6-flash",
        "backup_provider": "groq",
        "backup_model": "openai/gpt-oss-120b"
    },
    AiTaskType.METHODOLOGY_DRAFTING.value: {
        "primary_provider": "groq",
        "primary_model": "openai/gpt-oss-120b",
        "backup_provider": "gemini",
        "backup_model": "gemini-3.6-flash"
    },
    AiTaskType.DOCUMENT_COMPARISON.value: {
        "primary_provider": "cloudflare",
        "primary_model": "@cf/zai-org/glm-4.7-flash",
        "backup_provider": "groq",
        "backup_model": "openai/gpt-oss-120b"
    },
    AiTaskType.PROOFREADING.value: {
        "primary_provider": "groq",
        "primary_model": "openai/gpt-oss-120b",
        "backup_provider": "gemini",
        "backup_model": "gemini-3.6-flash"
    },
    AiTaskType.COMPLIANCE_REVIEW.value: {
        "primary_provider": "groq",
        "primary_model": "openai/gpt-oss-120b",
        "backup_provider": "cloudflare",
        "backup_model": "@cf/zai-org/glm-4.7-flash"
    },
    AiTaskType.DOCUMENT_SYNTHESIS.value: {
        "primary_provider": "gemini",
        "primary_model": "gemini-3.6-flash",
        "backup_provider": "cloudflare",
        "backup_model": "@cf/zai-org/glm-4.7-flash"
    },
    AiTaskType.EVIDENCE_MATCHING.value: {
        "primary_provider": "groq",
        "primary_model": "openai/gpt-oss-120b",
        "backup_provider": "gemini",
        "backup_model": "gemini-3.6-flash"
    }
}


class AiTaskRouter:
    @staticmethod
    def get_task_route(task_type: Union[AiTaskType, str]) -> TaskRoute:
        """
        Determines primary and backup AI providers and models for a given AI task.
        """
        key = task_type.value if isinstance(task_type, AiTaskType) else str(task_type).strip().lower()

        route_info = TASK_ROUTING_TABLE.get(key)
        if not route_info:
            # Default safe fallback route
            route_info = TASK_ROUTING_TABLE[AiTaskType.REQUIREMENT_EXTRACTION.value]
            key = AiTaskType.REQUIREMENT_EXTRACTION.value

        return TaskRoute(
            task_type=key,
            primary_provider=route_info["primary_provider"],  # type: ignore
            primary_model=route_info["primary_model"],
            backup_provider=route_info["backup_provider"],  # type: ignore
            backup_model=route_info["backup_model"]
        )
