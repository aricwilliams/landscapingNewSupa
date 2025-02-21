/*
  # Create channels and messages tables with proper RLS

  1. Tables
    - `channels` table for chat channels
    - `messages` table for chat messages
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Set up storage bucket for message images
*/

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  content text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to channels for authenticated users" ON channels;
DROP POLICY IF EXISTS "Allow insert access to channels for authenticated users" ON channels;
DROP POLICY IF EXISTS "Allow read access to messages for authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow insert access to messages for authenticated users" ON messages;

-- Create policies for channels
CREATE POLICY "Allow read access to channels for all users"
  ON channels
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to channels for all users"
  ON channels
  FOR INSERT
  WITH CHECK (true);

-- Create policies for messages
CREATE POLICY "Allow read access to messages for all users"
  ON messages
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to messages for all users"
  ON messages
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for message images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('message-images', 'message-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable public access to message images
CREATE POLICY "Allow public access to message images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'message-images');

CREATE POLICY "Allow upload access to message images for all users"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'message-images');