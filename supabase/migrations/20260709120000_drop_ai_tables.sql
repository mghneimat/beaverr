-- Drop AI advice, coach chat, knowledge CMS, and prompt tables (removed from product).
-- Historical migrations remain for audit; this migration cleans hosted DB after deploy.

DROP TABLE IF EXISTS advice_chat_cache CASCADE;
DROP TABLE IF EXISTS advice_messages CASCADE;
DROP TABLE IF EXISTS advice_chat_runs CASCADE;
DROP TABLE IF EXISTS advice_threads CASCADE;
DROP TABLE IF EXISTS advice_cache CASCADE;
DROP TABLE IF EXISTS advice_runs CASCADE;
DROP TABLE IF EXISTS knowledge_tags CASCADE;
DROP TABLE IF EXISTS knowledge_routes CASCADE;
DROP TABLE IF EXISTS knowledge_sources CASCADE;
DROP TABLE IF EXISTS knowledge_chunks CASCADE;
DROP TABLE IF EXISTS prompt_versions CASCADE;
