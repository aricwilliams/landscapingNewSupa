/*
  # Create messaging system tables

  1. New Tables
    - `channels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `channel_id` (uuid, foreign key to channels)
      - `sender_id` (text)
      - `sender_name` (text)
      - `content` (text)
      - `image_url` (text)
      - `created_at` (timestamp)

  2. Storage
    - Create bucket for message images

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
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

-- Create policies for channels
CREATE POLICY "Allow read access to channels for authenticated users"
  ON channels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to channels for authenticated users"
  ON channels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for messages
CREATE POLICY "Allow read access to messages for authenticated users"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to messages for authenticated users"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true);

-- Enable public access to message images
CREATE POLICY "Allow public access to message images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'message-images');

CREATE POLICY "Allow authenticated users to upload message images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-images');