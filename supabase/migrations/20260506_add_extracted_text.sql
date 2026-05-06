-- Add extracted_text column to resume_scans if it doesn't exist
ALTER TABLE resume_scans ADD COLUMN IF NOT EXISTS extracted_text text;
