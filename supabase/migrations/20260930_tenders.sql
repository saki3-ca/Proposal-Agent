-- Tender Finder Bot storage. Run once in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS public.tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dedupe_key TEXT NOT NULL UNIQUE,            -- normalised title + entity + deadline
    title TEXT NOT NULL,
    procuring_entity TEXT,
    country TEXT,
    category TEXT NOT NULL,
    classified_by TEXT,                          -- 'keyword' | 'llm:<model>' | 'keyword-ambiguous (LLM unavailable)'
    bd_eligibility TEXT,                         -- 'bangladesh' | 'open_international'
    published_date DATE,
    deadline DATE,
    deadline_time TEXT,
    source_id TEXT NOT NULL,
    source_url TEXT,
    document_url TEXT,                           -- direct PDF/DOCX link when the notice has one
    summary TEXT,
    raw_snippet TEXT,
    notified BOOLEAN NOT NULL DEFAULT FALSE,     -- included in a digest yet?
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tenders_deadline_idx ON public.tenders (deadline);
CREATE INDEX IF NOT EXISTS tenders_category_idx ON public.tenders (category);
-- RLS on with no policies: only the server-side service-role key can read/write. The key lives in secrets, never in a browser.
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
