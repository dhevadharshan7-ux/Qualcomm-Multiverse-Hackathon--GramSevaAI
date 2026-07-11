-- Gram Seva AI — local Postgres schema (source of truth, append-only).
--
-- Table ownership (CONTRACT.md §5):
--   grievances    -> Grievance Platform (this repo)
--   device_state  -> DAL / orchestrator
--   farmer_produce -> reserved for Varshini's module, NOT defined here.
--                     Coordinate before adding it so we don't clash.
--
-- Applied automatically by infra/docker-compose.yml on first container start.
-- If you need to change a table after data exists, add a new migration file
-- instead of editing the CREATE TABLE below.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS grievances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id      TEXT,
    category        TEXT NOT NULL,
    description     TEXT NOT NULL,
    location        TEXT,
    priority        TEXT NOT NULL,
    source_channel  TEXT NOT NULL,
    status          TEXT NOT NULL,
    department      TEXT NOT NULL,
    sensor_device   TEXT,
    sensor_resource TEXT,
    sensor_value    JSONB,
    sensor_verdict  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grievances_citizen_id ON grievances (citizen_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances (status);

CREATE TABLE IF NOT EXISTS device_state (
    device      TEXT NOT NULL,
    resource    TEXT NOT NULL,
    value       JSONB NOT NULL,
    source      TEXT NOT NULL,
    read_at     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (device, resource)
);

CREATE TABLE IF NOT EXISTS id_update_requests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id        TEXT,
    id_type           TEXT NOT NULL,
    update_type       TEXT NOT NULL,
    description       TEXT NOT NULL,
    source_channel    TEXT NOT NULL,
    status            TEXT NOT NULL,
    authority_office  TEXT NOT NULL,
    extracted_fields  JSONB,
    document_ref      TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_id_update_requests_citizen_id ON id_update_requests (citizen_id);

-- Reserved name — do not create here. See CONTRACT.md §5 open question #3.
-- CREATE TABLE farmer_produce ( ... );
