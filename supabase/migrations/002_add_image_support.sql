-- Add image_url column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_url text;

-- Add index for reports with images
CREATE INDEX IF NOT EXISTS idx_reports_with_images ON reports(image_url) WHERE image_url IS NOT NULL;