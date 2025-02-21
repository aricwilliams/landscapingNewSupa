/*
  # Add products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `base_price` (numeric)
      - `estimated_hours` (numeric)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policies for authenticated users to manage products
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  base_price numeric NOT NULL DEFAULT 0,
  estimated_hours numeric NOT NULL DEFAULT 1,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow read access to products for all users"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to products for all users"
  ON products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to products for all users"
  ON products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to products for all users"
  ON products
  FOR DELETE
  USING (true);