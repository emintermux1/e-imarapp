-- Add new columns to reports table for sharing functionality
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add label column to watchlist table
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS label TEXT;