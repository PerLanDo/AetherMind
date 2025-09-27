-- Add cloud_key column to files table
ALTER TABLE files ADD COLUMN cloud_key TEXT;

-- Add size column for file sizes
ALTER TABLE files ADD COLUMN size INTEGER;

-- Add mime_type column for proper content type handling
ALTER TABLE files ADD COLUMN mime_type TEXT;

-- Create index for cloud_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_cloud_key ON files(cloud_key);
