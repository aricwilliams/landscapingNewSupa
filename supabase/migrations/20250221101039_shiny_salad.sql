/*
  # Add Quotes and Quote Items Tables

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `total_amount` (numeric)
      - `status` (text)
      - `notes` (text)
      - `valid_until` (timestamptz)
      - `created_at` (timestamptz)
    
    - `quote_items`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, references quotes)
      - `product_id` (uuid, references products)
      - `description` (text)
      - `quantity` (numeric)
      - `price` (numeric)
      - `estimated_hours` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for all users to read and write
*/

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  estimated_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Create policies for quotes
CREATE POLICY "Allow read access to quotes for all users"
  ON quotes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to quotes for all users"
  ON quotes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to quotes for all users"
  ON quotes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policies for quote items
CREATE POLICY "Allow read access to quote items for all users"
  ON quote_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to quote items for all users"
  ON quote_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to quote items for all users"
  ON quote_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);