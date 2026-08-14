-- Run this once in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run

create table if not exists analyses (
    id uuid primary key default gen_random_uuid(),
    analysis_code text not null unique,      -- human-readable id, e.g. ANL-2026-0121

    -- Evidence Information (from the Analyse form)
    case_id text not null,
    evidence_id text not null,
    analyst_name text not null,
    collection_date date,
    collection_location text,
    evidence_notes text,

    -- Image
    image_url text not null,                  -- Cloudinary secure_url
    image_public_id text,                      -- Cloudinary public_id, needed to delete/transform later

    -- Model output
    predicted_species text not null,           -- 'Cow' | 'Goat' | 'Sheep'
    confidence numeric not null,                -- 0-100
    probability_distribution jsonb not null,    -- {"Cow": 85.4, "Goat": 8.7, "Sheep": 5.9}
    model_version text not null default 'HoofNet v1.0',
    secondary_model_prediction text,            -- EfficientNetB0+LSTM cross-check prediction
    secondary_model_confidence numeric,

    -- Analyst review workflow
    status text not null default 'pending_review'
        check (status in ('pending_review', 'verified', 'inconclusive')),
    verified_by text,
    verified_at timestamptz,

    created_at timestamptz not null default now()
);

create index if not exists idx_analyses_created_at on analyses (created_at desc);
create index if not exists idx_analyses_status on analyses (status);

-- No RLS policies needed: this table is only ever touched by the FastAPI
-- backend using the service-role key, never directly from the browser.
