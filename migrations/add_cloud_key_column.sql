-- Migration to add cloud_key column to files table
-- Run this SQL command on your database to add cloud storage support

ALTER TABLE files ADD COLUMN cloud_key TEXT;

-- Optional: Add index for better performance on cloud_key lookups
CREATE INDEX idx_files_cloud_key ON files(cloud_key);

-- Add comment for documentation
COMMENT ON COLUMN files.cloud_key IS 'Storage key for files stored in Backblaze B2 cloud storage';