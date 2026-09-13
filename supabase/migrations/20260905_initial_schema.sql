-- ====================================================================
-- AI Proposal & Tender Preparation Agent - Supabase Database Schema
-- Migration File: 20260905_initial_schema.sql
-- ====================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    assignment_title TEXT NOT NULL,
    tender_type VARCHAR(50) NOT NULL CHECK (tender_type IN ('TOR', 'RFP', 'RFQ', 'EOI', 'Tender', 'Other')),
    ref_number VARCHAR(100),
    submission_deadline TIMESTAMPTZ NOT NULL,
    issuing_org VARCHAR(255),
    manager VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review_required', 'ready', 'submitted')),
    completion_percentage INT DEFAULT 0,
    mandatory_unresolved_count INT DEFAULT 0,
    active_step INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents Table (Tender Files & Knowledge Base Documents)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    kb_category VARCHAR(100), -- 'Company', 'Legal', 'Tax', 'CV', 'Experience', 'PreviousProposal'
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('PDF', 'DOCX', 'XLSX', 'PPTX', 'Image', 'TXT', 'CSV')),
    file_size_mb NUMERIC(10,2) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by VARCHAR(255),
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processing_status VARCHAR(50) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'file_identified', 'text_extracted', 'ocr_check', 'markdown_converted', 'ai_analyzed', 'error')),
    ocr_required BOOLEAN DEFAULT FALSE,
    ocr_completed BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    page_count INT DEFAULT 1,
    markdown_path TEXT,
    markdown_content TEXT,
    source_hash VARCHAR(64),
    version VARCHAR(20) DEFAULT '1.0',
    ai_confidence NUMERIC(3,2) DEFAULT 0.95
);

-- 3. Requirements Matrix Table
CREATE TABLE IF NOT EXISTS public.requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Eligibility', 'Technical', 'Financial', 'Administrative')),
    mandatory BOOLEAN DEFAULT TRUE,
    source_file VARCHAR(255) NOT NULL,
    source_page INT DEFAULT 1,
    source_section VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'REVIEW_REQUIRED' CHECK (status IN ('READY', 'REVIEW_REQUIRED', 'MISSING', 'NOT_APPLICABLE')),
    ai_interpretation TEXT,
    evidence_status VARCHAR(50) DEFAULT 'Missing' CHECK (evidence_status IN ('Available', 'Partial', 'Missing')),
    ai_confidence NUMERIC(3,2) DEFAULT 0.90,
    reviewer_comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Requirement Evidence Mapping Table
CREATE TABLE IF NOT EXISTS public.requirement_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    evidence_document_name VARCHAR(255) NOT NULL,
    evidence_document_id UUID REFERENCES public.documents(id),
    page_number INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Experts / CV Database Table
CREATE TABLE IF NOT EXISTS public.experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    years_experience INT NOT NULL,
    education TEXT NOT NULL,
    certifications TEXT[],
    relevant_assignments_count INT DEFAULT 0,
    verification_status VARCHAR(50) DEFAULT 'Verified',
    skills TEXT[],
    sector_experience TEXT[],
    cv_document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Company Experience Credentials Table
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client VARCHAR(255) NOT NULL,
    assignment_title VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    assignment_type VARCHAR(100) NOT NULL,
    scope TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    contract_value VARCHAR(100),
    role VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Bangladesh',
    evidence_document VARCHAR(255),
    evidence_page INT DEFAULT 1,
    verification_status VARCHAR(50) DEFAULT 'Verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Proposal Sections Table
CREATE TABLE IF NOT EXISTS public.proposal_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    section_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    section_order INT NOT NULL,
    content TEXT,
    ai_draft TEXT,
    ai_generated BOOLEAN DEFAULT TRUE,
    confidence NUMERIC(3,2) DEFAULT 0.95,
    status VARCHAR(50) DEFAULT 'ai_generated' CHECK (status IN ('draft', 'ai_generated', 'reviewed', 'approved')),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Financial Proposals Table
CREATE TABLE IF NOT EXISTS public.financial_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'BDT',
    fee_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 0.15,
    vat_amount NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    narrative_assumption TEXT,
    milestones JSONB DEFAULT '[]'::jsonb,
    is_approved BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Prescribed Forms Table
CREATE TABLE IF NOT EXISTS public.prescribed_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    form_name VARCHAR(255) NOT NULL,
    form_number VARCHAR(50) NOT NULL,
    source_page INT DEFAULT 1,
    mandatory BOOLEAN DEFAULT TRUE,
    file_format VARCHAR(20) DEFAULT 'DOCX',
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'populated', 'verified')),
    signature_required BOOLEAN DEFAULT TRUE,
    signature_status VARCHAR(50) DEFAULT 'Pending Signature',
    populated_fields_count INT DEFAULT 0,
    total_fields_count INT DEFAULT 0
);

-- 10. Compliance Checks & Audit Log Table
CREATE TABLE IF NOT EXISTS public.compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    overall_score_percentage INT NOT NULL DEFAULT 0,
    satisfied_count INT DEFAULT 0,
    review_required_count INT DEFAULT 0,
    missing_count INT DEFAULT 0,
    mandatory_unresolved_count INT DEFAULT 0,
    readiness_status VARCHAR(50) DEFAULT 'REVIEW_REQUIRED' CHECK (readiness_status IN ('READY', 'REVIEW_REQUIRED', 'BLOCKED')),
    category_scores JSONB DEFAULT '{}'::jsonb,
    overrides JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id),
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Supabase Storage Buckets Setup Script
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-base', 'knowledge-base', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', false)
ON CONFLICT (id) DO NOTHING;

-- Index Optimization
CREATE INDEX IF NOT EXISTS idx_requirements_project ON public.requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_project ON public.proposal_sections(project_id);

-- Seed Proposal Tracker Data Migrated from Sheet into Supabase Database (Empty for fresh production deployment)

