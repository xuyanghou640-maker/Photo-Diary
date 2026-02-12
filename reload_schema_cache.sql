-- Reload the PostgREST schema cache
-- This is necessary when you make changes to the database schema (like adding columns)
-- and the API doesn't pick them up immediately.

NOTIFY pgrst, 'reload config';