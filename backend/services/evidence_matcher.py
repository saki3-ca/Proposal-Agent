import json
import logging
import re
from typing import List, Dict, Any, Optional, Tuple

from backend.models.requirement_models import ExtractedRequirement
from backend.models.evidence_models import (
    EvidenceResult,
    RequirementMatrixItem,
    BuildRequirementMatrixResponse,
    EvidenceStatus
)
from backend.services.evidence_retriever import EvidenceRetrieverService, CandidateEvidence
from backend.services.ai_provider import AiProviderService
from backend.services.ai_task_router import AiTaskRouter, AiTaskType

logger = logging.getLogger("evidence_matcher")


def build_evidence_match_system_prompt() -> str:
    return """You are an evidence-matching assistant for a professional tender/proposal preparation system.

Determine whether the supplied evidence supports the stated tender requirement.

Do not invent facts.
Do not infer missing numbers, dates, qualifications, assignments, registrations, or experience.
Do not treat previous proposals as verified evidence.
Distinguish direct evidence from supporting evidence.
If the evidence does not establish an important condition, explicitly identify what is missing.

Every conclusion must be based only on the supplied requirement and evidence.

Controlled Evidence Statuses:
- "DIRECT_EVIDENCE": The document explicitly and directly satisfies all core conditions of the requirement (e.g. valid registration certificate, CV showing >= required experience).
- "SUPPORTING_EVIDENCE": The document supports the requirement topic but does not independently establish all specified thresholds, numbers, or conditions.
- "REFERENCE_ONLY": Use when the evidence comes from a previous proposal and has not been established through an underlying primary source document.
- "INSUFFICIENT": The excerpt is related in topic but clearly fails to meet key mandatory criteria, dates, or thresholds.
- "NOT_FOUND": The excerpt does not provide relevant evidence.

Return valid JSON ONLY matching this schema:
{
  "evidence_status": "DIRECT_EVIDENCE" | "SUPPORTING_EVIDENCE" | "REFERENCE_ONLY" | "INSUFFICIENT" | "NOT_FOUND",
  "reason": "Detailed factual justification explaining why this evidence satisfies or fails the requirement...",
  "missing_information": ["List of missing items or unverified conditions if any"]
}"""


def build_evidence_match_user_prompt(
    requirement: str,
    category: str,
    doc_name: str,
    source_type: str,
    source_loc: str,
    excerpt: str
) -> str:
    return f"""TENDER REQUIREMENT:
Category: {category}
Clause: {requirement}

SOURCE DOCUMENT:
Filename: {doc_name}
Source Type: {source_type}
Location: {source_loc}

EVIDENCE EXCERPT:
{excerpt}

Evaluate this evidence against the requirement and output JSON."""


def clean_and_parse_match_json(raw_text: str) -> Optional[Dict[str, Any]]:
    if not raw_text or not raw_text.strip():
        return None

    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    start_brace = cleaned.find("{")
    end_brace = cleaned.rfind("}")

    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        json_str = cleaned[start_brace:end_brace + 1]
        try:
            return json.loads(json_str)
        except Exception:
            sanitized = re.sub(r",\s*([}\]])", r"\1", json_str)
            try:
                return json.loads(sanitized)
            except Exception:
                return None
    return None


class EvidenceMatcherService:
    @classmethod
    async def match_single_candidate(
        cls,
        req: ExtractedRequirement,
        cand: CandidateEvidence
    ) -> EvidenceResult:
        """
        Matches a single candidate evidence excerpt against a tender requirement using the AI Task Router.
        """
        # Enforce Previous Proposal Safety Rule (Section 14)
        if cand.source_type == "previous_proposal":
            # If the excerpt is from a previous proposal, it can only be REFERENCE_ONLY or INSUFFICIENT
            return EvidenceResult(
                evidence_id=f"EVID-{cand.document_id}-{req.requirement_id}",
                requirement_id=req.requirement_id,
                document_id=cand.document_id,
                document_name=cand.document_name,
                source_type=cand.source_type,
                relevance=cand.relevance_score,
                excerpt=cand.excerpt[:500],
                source_location=cand.source_location,
                reason="Statement appears in a previous proposal; underlying supporting evidence has not been independently verified.",
                evidence_status="REFERENCE_ONLY",
                missing_information=["Underlying primary supporting certificate or client verification required."]
            )

        # Call AI provider for required_document candidate matching
        route = AiTaskRouter.get_task_route(AiTaskType.EVIDENCE_MATCHING)
        sys_prompt = build_evidence_match_system_prompt()
        user_prompt = build_evidence_match_user_prompt(
            requirement=req.requirement,
            category=req.category,
            doc_name=cand.document_name,
            source_type=cand.source_type,
            source_loc=cand.source_location,
            excerpt=cand.excerpt
        )

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ]

        res = await AiProviderService._execute_provider(
            provider=route.primary_provider,
            messages=messages,
            model=route.primary_model,
            temperature=0.1,
            max_tokens=512
        )

        content = res.get("content", "") if res.get("success") else ""
        if not content:
            # Try backup provider
            fallback_res = await AiProviderService._execute_provider(
                provider=route.backup_provider,
                messages=messages,
                model=route.backup_model,
                temperature=0.1,
                max_tokens=512
            )
            content = fallback_res.get("content", "") if fallback_res.get("success") else ""

        parsed = clean_and_parse_match_json(content)
        
        status_val: EvidenceStatus = "SUPPORTING_EVIDENCE"
        reason_val = f"Document excerpt from {cand.document_name} provides relevant context."
        missing_val: List[str] = []

        if parsed:
            raw_stat = str(parsed.get("evidence_status", "")).strip().upper()
            if raw_stat in {"DIRECT_EVIDENCE", "SUPPORTING_EVIDENCE", "REFERENCE_ONLY", "INSUFFICIENT", "NOT_FOUND"}:
                status_val = raw_stat  # type: ignore
            reason_val = str(parsed.get("reason", reason_val)).strip()
            raw_missing = parsed.get("missing_information", [])
            if isinstance(raw_missing, list):
                missing_val = [str(m).strip() for m in raw_missing if str(m).strip()]

        return EvidenceResult(
            evidence_id=f"EVID-{cand.document_id}-{req.requirement_id}",
            requirement_id=req.requirement_id,
            document_id=cand.document_id,
            document_name=cand.document_name,
            source_type=cand.source_type,
            relevance=cand.relevance_score,
            excerpt=cand.excerpt[:600],
            source_location=cand.source_location,
            reason=reason_val,
            evidence_status=status_val,
            missing_information=missing_val
        )

    @classmethod
    async def build_matrix_for_requirements(
        cls,
        requirements: List[ExtractedRequirement]
    ) -> BuildRequirementMatrixResponse:
        """
        Builds the complete Requirement Matrix by retrieving and matching evidence for each requirement.
        """
        route = AiTaskRouter.get_task_route(AiTaskType.EVIDENCE_MATCHING)
        matrix_items: List[RequirementMatrixItem] = []
        summary_counts: Dict[str, int] = {
            "DIRECT_EVIDENCE": 0,
            "SUPPORTING_EVIDENCE": 0,
            "REFERENCE_ONLY": 0,
            "INSUFFICIENT": 0,
            "NOT_FOUND": 0
        }

        for req in requirements:
            # 1. Retrieve candidates
            candidates = EvidenceRetrieverService.retrieve_candidates_for_requirement(
                requirement_text=req.requirement,
                category=req.category,
                max_candidates=2  # Top 2 most relevant candidates per requirement for efficiency
            )

            evidence_items: List[EvidenceResult] = []
            if not candidates:
                overall_status: EvidenceStatus = "NOT_FOUND"
                missing_info = ["No supporting document or reference found in repository."]
            else:
                for cand in candidates:
                    ev_res = await cls.match_single_candidate(req, cand)
                    evidence_items.append(ev_res)

                # Synthesize overall status
                statuses = [e.evidence_status for e in evidence_items]
                if "DIRECT_EVIDENCE" in statuses:
                    overall_status = "DIRECT_EVIDENCE"
                elif "SUPPORTING_EVIDENCE" in statuses:
                    overall_status = "SUPPORTING_EVIDENCE"
                elif "REFERENCE_ONLY" in statuses:
                    overall_status = "REFERENCE_ONLY"
                elif "INSUFFICIENT" in statuses:
                    overall_status = "INSUFFICIENT"
                else:
                    overall_status = "NOT_FOUND"

                # Consolidate missing information
                missing_set = set()
                for e in evidence_items:
                    for m in e.missing_information:
                        missing_set.add(m)
                missing_info = list(missing_set)

            summary_counts[overall_status] = summary_counts.get(overall_status, 0) + 1

            matrix_items.append(
                RequirementMatrixItem(
                    requirement_id=req.requirement_id,
                    category=req.category,
                    requirement=req.requirement,
                    mandatory=req.mandatory,
                    evidence_required=req.evidence_required,
                    requirement_status=req.status,
                    evidence_items=evidence_items,
                    overall_evidence_status=overall_status,
                    missing_information=missing_info,
                    review_status="pending_review"
                )
            )

        return BuildRequirementMatrixResponse(
            success=True,
            task_type="evidence_matching",
            provider=route.primary_provider,
            model=route.primary_model,
            fallback_used=False,
            total_requirements=len(matrix_items),
            matrix=matrix_items,
            summary=summary_counts,
            error=None
        )
