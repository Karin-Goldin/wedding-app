-- Create table for storing file messages
CREATE TABLE IF NOT EXISTS file_messages (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE file_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON file_messages
  FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" ON file_messages
  FOR INSERT WITH CHECK (true);
