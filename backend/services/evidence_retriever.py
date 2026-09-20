import re
import logging
from typing import List, Dict, Any, Set
from backend.services.document_inventory_service import DocumentInventoryService, DocumentExcerpt
from backend.models.document_models import SourceType

logger = logging.getLogger("evidence_retriever")

STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
    "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
    "must", "shall", "required", "mandatory", "will", "provide", "submit"
}

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Eligibility": ["registration", "license", "certificate", "icab", "tin", "bin", "vat", "tax", "bsec", "incorporation", "solvency", "enlistment", "firm"],
    "Firm Experience": ["experience", "audit", "assignment", "project", "work order", "completion", "appointment", "client", "years", "donor", "portfolio"],
    "Engagement Partner Experience": ["partner", "fca", "cv", "experience", "leader", "engagement", "hoque", "fellow", "qualification", "practice certificate"],
    "Team Requirements": ["cv", "key expert", "manager", "staff", "associate", "team", "personnel", "manpower", "qualification", "ca cc"],
    "Technical Experience": ["audit", "compliance", "forensic", "financial", "special", "investigation", "revaluation", "system", "cmmi", "pci dss"],
    "Financial Requirements": ["turnover", "solvency", "bank", "financial statement", "audit report", "solvency certificate", "balance sheet", "revenue"],
    "Legal / Regulatory": ["trade license", "tin", "vat", "bin", "tax clearance", "frc", "icab", "incorporation", "memorandum", "bsec"],
    "Submission Requirements": ["submission", "proposal", "form", "format", "deadline", "envelope", "copies", "signed", "declaration", "application"]
}


class CandidateEvidence:
    def __init__(
        self,
        document_id: str,
        document_name: str,
        source_type: SourceType,
        source_location: str,
        excerpt: str,
        relevance_score: float
    ):
        self.document_id = document_id
        self.document_name = document_name
        self.source_type = source_type
        self.source_location = source_location
        self.excerpt = excerpt
        self.relevance_score = relevance_score


class EvidenceRetrieverService:
    @staticmethod
    def extract_search_terms(requirement_text: str, category: str = "") -> List[str]:
        """Extracts key search tokens and multi-word phrases from the requirement clause."""
        cleaned = re.sub(r"[^a-zA-Z0-9\s\-]", " ", requirement_text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 2 and t.strip() not in STOP_WORDS]

        # Extract numeric tokens with context (e.g., '10 years', '5 audits')
        num_patterns = re.findall(r"(\d+\s*(?:years?|projects?|audits?|assignments?|million|bdt|percent|%|partners?))", requirement_text.lower())
        
        terms = list(set(tokens))
        for np in num_patterns:
            terms.append(np.strip())

        # Include category specific terms if relevant
        if category in CATEGORY_KEYWORDS:
            for ck in CATEGORY_KEYWORDS[category]:
                if ck in cleaned:
                    terms.append(ck)

        return terms

    @classmethod
    def retrieve_candidates_for_requirement(
        cls,
        requirement_text: str,
        category: str = "",
        max_candidates: int = 4
    ) -> List[CandidateEvidence]:
        """
        Retrieves the top candidate evidence excerpts from the indexed document inventory.
        """
        terms = cls.extract_search_terms(requirement_text, category)
        if not terms:
            return []

        all_excerpts = DocumentInventoryService.get_all_excerpts()
        candidates: List[CandidateEvidence] = []

        req_text_lower = requirement_text.lower()

        for exc in all_excerpts:
            doc_name_lower = exc.document_name.lower()
            text_lower = exc.text.lower()

            score = 0.0
            matched_terms = 0

            # 1. Filename relevance boost
            for term in terms:
                if term in doc_name_lower:
                    score += 3.0
                    matched_terms += 1

            # 2. Exact requirement phrase overlap
            for term in terms:
                if term in text_lower:
                    score += 1.0
                    matched_terms += 1

            # 3. Category matching boost
            if category in CATEGORY_KEYWORDS:
                for ck in CATEGORY_KEYWORDS[category]:
                    if ck in doc_name_lower:
                        score += 2.0
                    if ck in text_lower:
                        score += 0.5

            # 4. Source document preference (required_document is preferred over previous_proposal)
            if exc.source_type == "required_document":
                score *= 1.2

            if score > 2.5 and matched_terms >= 1:
                # Normalize score
                normalized_score = min(0.98, max(0.50, round(score / (len(terms) + 5), 2)))
                candidates.append(
                    CandidateEvidence(
                        document_id=exc.document_id,
                        document_name=exc.document_name,
                        source_type=exc.source_type,
                        source_location=exc.source_location,
                        excerpt=exc.text[:1200],  # Truncate to reasonable excerpt length
                        relevance_score=normalized_score
                    )
                )

        # Sort candidates by relevance score descending
        candidates.sort(key=lambda c: c.relevance_score, reverse=True)

        # Ensure deduplication across identical excerpts
        deduped: List[CandidateEvidence] = []
        seen_texts = set()
        for cand in candidates:
            snippet_key = (cand.document_name, cand.excerpt[:100])
            if snippet_key not in seen_texts:
                seen_texts.add(snippet_key)
                deduped.append(cand)
            if len(deduped) >= max_candidates:
                break

        return deduped
