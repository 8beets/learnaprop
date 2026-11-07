CREATE INDEX source_records_first_seen
ON source_records(first_seen_at DESC, source_id, external_id);
