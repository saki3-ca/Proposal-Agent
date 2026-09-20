import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from pydantic import ValidationError

from backend.models.requirement_models import (
    ExtractedRequirement,
    RequirementsListWrapper,
    ExtractRequirementsResponse,
    RequirementCategory
)
from backend.services.ai_provider import AiProviderService
from backend.services.ai_task_router import AiTaskRouter, AiTaskType

logger = logging.getLogger("requirement_extractor")

VALID_CATEGORIES = {
    "Eligibility",
    "Firm Experience",
    "Engagement Partner Experience",
    "Team Requirements",
    "Technical Experience",
    "Sector Experience",
    "Financial Requirements",
    "Legal / Regulatory",
    "Methodology",
    "Deliverables",
    "Timeline",
    "Reporting",
    "Staffing",
    "Logistics",
    "Financial Proposal",
    "Submission Requirements",
    "Other"
}


def build_extraction_system_prompt() -> str:
    """
    Builds strict, anti-hallucinatory system instructions for requirement extraction.
    """
    return """You are a procurement and tender-document analysis assistant.

Extract explicit requirements from the supplied tender/RFP/ToR.

Your job is extraction, not proposal writing.
Extract what the document actually requires.
Do not invent requirements.
Do not infer requirements that are not supported by the document.
Do not evaluate whether ACNABIN satisfies a requirement.
Do not add ACNABIN experience, staff, credentials, clients, fees, or capabilities.
Do not rewrite the tender into marketing language.

Preserve important thresholds, numbers, dates, qualifications, experience periods, document requirements, submission conditions, financial requirements, staffing requirements, and regulatory requirements.

Every requirement must be traceable to the supplied document.

Categories allowed (use exact spelling):
- Eligibility
- Firm Experience
- Engagement Partner Experience
- Team Requirements
- Technical Experience
- Sector Experience
- Financial Requirements
- Legal / Regulatory
- Methodology
- Deliverables
- Timeline
- Reporting
- Staffing
- Logistics
- Financial Proposal
- Submission Requirements
- Other

Rules for fields:
- requirement_id: Sequential ID like "REQ-001", "REQ-002", etc.
- mandatory: true if the document states 'must', 'shall', 'required', 'mandatory', 'eligible only if', 'bidder shall', etc.; false if optional or informational.
- evidence_required: true when the tender requires supporting evidence (certificate, registration, license, experience certificate, CV, audit report, financial statement, bank statement, tax certificate, VAT certificate, work order, contract, completion certificate, organizational documents, partner qualification, staff qualification, client reference, similar assignment evidence); otherwise false.
- source_location: Exact section, page, or clause where found (e.g., "Section 3.2", "Page 4", "Clause 5.1", "Part B – Eligibility"). If not explicitly available, use "Location not explicitly available in processed text". Never fabricate source locations.
- status: "identified" (do NOT mark verified unless the document itself provides verification evidence).
- notes: null or string with nuances/thresholds.

Return valid JSON ONLY in this exact schema:
{
  "requirements": [
    {
      "requirement_id": "REQ-001",
      "category": "Eligibility",
      "requirement": "Exact requirement text clause...",
      "mandatory": true,
      "evidence_required": true,
      "source_document": "...",
      "source_location": "Section 3.1",
      "status": "identified",
      "notes": null
    }
  ]
}"""


def build_extraction_user_prompt(document_name: str, document_type: str, content: str) -> str:
    """
    Builds the user message containing document metadata and text content.
    """
    return f"""Document Name: {document_name}
Document Type: {document_type}

--- DOCUMENT CONTENT START ---
{content}
--- DOCUMENT CONTENT END ---

Extract all explicit tender requirements from the document content above into the specified JSON format."""


def clean_and_parse_json(raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Cleans markdown wrappers and parses JSON from LLM output.
    """
    if not raw_text or not raw_text.strip():
        return None

    cleaned = raw_text.strip()

    # Remove markdown code blocks if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    # Locate outermost JSON object {...}
    start_brace = cleaned.find("{")
    end_brace = cleaned.rfind("}")

    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        json_str = cleaned[start_brace:end_brace + 1]
        try:
            return json.loads(json_str)
        except Exception as e:
            logger.debug(f"Direct JSON parse failed: {e}. Attempting trailing comma cleanup.")
            # Simple cleanup for trailing commas before } or ]
            sanitized = re.sub(r",\s*([}\]])", r"\1", json_str)
            try:
                return json.loads(sanitized)
            except Exception:
                return None

    # Locate outermost JSON array [...]
    start_bracket = cleaned.find("[")
    end_bracket = cleaned.rfind("]")
    if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
        json_str = cleaned[start_bracket:end_bracket + 1]
        try:
            arr = json.loads(json_str)
            if isinstance(arr, list):
                return {"requirements": arr}
        except Exception:
            return None

    return None


def validate_and_normalize_requirements(
    raw_json: Dict[str, Any],
    document_name: str
) -> Tuple[bool, List[ExtractedRequirement], Optional[str]]:
    """
    Validates parsed JSON against Pydantic schema and normalizes requirement IDs and categories.
    """
    if not isinstance(raw_json, dict) or "requirements" not in raw_json or not isinstance(raw_json["requirements"], list):
        return False, [], "JSON missing 'requirements' array."

    raw_list = raw_json["requirements"]
    normalized_list: List[ExtractedRequirement] = []

    for idx, item in enumerate(raw_list):
        if not isinstance(item, dict):
            continue

        # Normalization of category
        raw_cat = str(item.get("category", "Other")).strip()
        category: RequirementCategory = raw_cat if raw_cat in VALID_CATEGORIES else "Other"  # type: ignore

        # Normalization of ID (deterministic sequential format REQ-001, REQ-002, ...)
        seq_id = f"REQ-{idx + 1:03d}"

        # Normalization of status
        raw_status = str(item.get("status", "identified")).strip().lower()
        status = raw_status if raw_status in {"identified", "verified", "ambiguous", "missing"} else "identified"

        # Mandatory & Evidence Required booleans
        req_text = str(item.get("requirement", "")).strip()
        if not req_text:
            continue

        mandatory = bool(item.get("mandatory", True))
        evidence_required = bool(item.get("evidence_required", False))
        source_doc = str(item.get("source_document") or document_name).strip()
        source_loc = str(item.get("source_location") or "Location not explicitly available in processed text").strip()
        notes = item.get("notes")
        if notes is not None:
            notes = str(notes).strip() or None

        try:
            req_model = ExtractedRequirement(
                requirement_id=seq_id,
                category=category,
                requirement=req_text,
                mandatory=mandatory,
                evidence_required=evidence_required,
                source_document=source_doc,
                source_location=source_loc,
                status=status,  # type: ignore
                notes=notes
            )
            normalized_list.append(req_model)
        except ValidationError as val_err:
            logger.warning(f"Pydantic validation skipped item {idx}: {val_err}")

    if not normalized_list and len(raw_list) > 0:
        return False, [], "No valid requirements could be parsed against the Pydantic schema."

    return True, normalized_list, None


class RequirementExtractorService:
    @classmethod
    async def extract_requirements(
        cls,
        document_name: str,
        document_type: str,
        content: str
    ) -> ExtractRequirementsResponse:
        """
        Executes structured requirement extraction using the Task Router,
        provider fallback, JSON parsing, and controlled retry mechanism.
        """
        route = AiTaskRouter.get_task_route(AiTaskType.REQUIREMENT_EXTRACTION)

        system_prompt = build_extraction_system_prompt()
        user_prompt = build_extraction_user_prompt(document_name, document_type, content)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        logger.info(
            f"Starting requirement extraction for '{document_name}' ({len(content)} chars). "
            f"Primary: {route.primary_provider}/{route.primary_model}, Backup: {route.backup_provider}/{route.backup_model}"
        )

        # 1. Attempt Primary Provider
        provider_used = route.primary_provider
        model_used = route.primary_model
        fallback_used = False
        retry_used = False

        primary_res = await AiProviderService._execute_provider(
            provider=route.primary_provider,
            messages=messages,
            model=route.primary_model,
            temperature=0.1,
            max_tokens=8192
        )

        candidate_content = ""
        if primary_res.get("success", False):
            candidate_content = primary_res.get("content", "")
        else:
            logger.warning(f"Primary provider {route.primary_provider} failed: {primary_res.get('error')}. Triggering fallback.")
            # Trigger Backup Provider
            fallback_res = await AiProviderService._execute_provider(
                provider=route.backup_provider,
                messages=messages,
                model=route.backup_model,
                temperature=0.1,
                max_tokens=8192
            )
            if fallback_res.get("success", False):
                candidate_content = fallback_res.get("content", "")
                provider_used = route.backup_provider
                model_used = route.backup_model
                fallback_used = True
            else:
                return ExtractRequirementsResponse(
                    success=False,
                    task_type="requirement_extraction",
                    provider=route.primary_provider,
                    model=route.primary_model,
                    fallback_used=True,
                    retry_used=False,
                    requirements_count=0,
                    requirements=[],
                    error=f"Both primary ({route.primary_provider}) and backup ({route.backup_provider}) providers failed."
                )

        # 2. Parse and Validate JSON
        parsed_json = clean_and_parse_json(candidate_content)
        valid = False
        reqs: List[ExtractedRequirement] = []
        val_error = None

        if parsed_json is not None:
            valid, reqs, val_error = validate_and_normalize_requirements(parsed_json, document_name)

        # 3. Controlled Retry (ONE retry only if parsing/validation failed)
        if not valid:
            logger.warning(f"Initial requirement extraction JSON parse/validation failed ({val_error}). Performing 1 controlled retry...")
            retry_used = True
            retry_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": candidate_content},
                {
                    "role": "user",
                    "content": (
                        "The previous response was not valid JSON or did not conform to the required schema. "
                        "Please re-output the extracted requirements as strictly valid JSON matching the schema: "
                        "{\"requirements\": [{\"requirement_id\": \"REQ-001\", \"category\": \"...\", \"requirement\": \"...\", "
                        "\"mandatory\": true, \"evidence_required\": false, \"source_document\": \"...\", "
                        "\"source_location\": \"...\", \"status\": \"identified\", \"notes\": null}]}"
                    )
                }
            ]

            retry_res = await AiProviderService._execute_provider(
                provider=provider_used,
                messages=retry_messages,
                model=model_used,
                temperature=0.0,
                max_tokens=8192
            )

            if retry_res.get("success", False):
                retry_content = retry_res.get("content", "")
                retry_json = clean_and_parse_json(retry_content)
                if retry_json is not None:
                    valid, reqs, val_error = validate_and_normalize_requirements(retry_json, document_name)

        if not valid or not reqs:
            # If still invalid, check if we can try backup provider once before failing completely
            if not fallback_used:
                logger.warning("Primary provider retry output could not be validated. Attempting backup provider as final fallback...")
                fallback_res = await AiProviderService._execute_provider(
                    provider=route.backup_provider,
                    messages=messages,
                    model=route.backup_model,
                    temperature=0.1,
                    max_tokens=8192
                )
                if fallback_res.get("success", False):
                    fb_json = clean_and_parse_json(fallback_res.get("content", ""))
                    if fb_json is not None:
                        valid, reqs, val_error = validate_and_normalize_requirements(fb_json, document_name)
                        if valid and reqs:
                            provider_used = route.backup_provider
                            model_used = route.backup_model
                            fallback_used = True

        if not valid or not reqs:
            return ExtractRequirementsResponse(
                success=False,
                task_type="requirement_extraction",
                provider=provider_used,
                model=model_used,
                fallback_used=fallback_used,
                retry_used=retry_used,
                requirements_count=0,
                requirements=[],
                error=val_error or "AI output could not be parsed into valid structured requirements."
            )

        logger.info(
            f"Successfully extracted {len(reqs)} structured requirements using {provider_used}/{model_used}. "
            f"Fallback: {fallback_used}, Retry: {retry_used}"
        )

        return ExtractRequirementsResponse(
            success=True,
            task_type="requirement_extraction",
            provider=provider_used,
            model=model_used,
            fallback_used=fallback_used,
            retry_used=retry_used,
            requirements_count=len(reqs),
            requirements=reqs,
            error=None
        )
