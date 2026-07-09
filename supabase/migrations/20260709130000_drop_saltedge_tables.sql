-- Drop Salt Edge open banking tables (feature removed from product).
-- Historical migrations remain for audit; this migration cleans hosted DB after deploy.

DROP TABLE IF EXISTS saltedge_transactions CASCADE;
DROP TABLE IF EXISTS saltedge_accounts CASCADE;
DROP TABLE IF EXISTS saltedge_callback_events CASCADE;
DROP TABLE IF EXISTS saltedge_connections CASCADE;
DROP TABLE IF EXISTS saltedge_customers CASCADE;
