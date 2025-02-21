/*
  # Create invoices table and related schema updates

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `amount` (numeric)
      - `date` (date)
      - `status` (text)
      - `created_at` (timestamp)
      - `scheduled_send_at` (timestamp)
      - `sent_at` (timestamp)
      - `paid_at` (timestamp)
    
    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, references invoices)
      - `description` (text)
      - `quantity` (numeric)
      - `price` (numeric)
      - `created_at` (timestamp)

  2. Table Updates
    - Add `invoice_id` to jobs table
    - Add `completed_at` to jobs table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  scheduled_send_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz
);

-- Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Allow read access to invoices for all users"
  ON invoices
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to invoices for all users"
  ON invoices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to invoices for all users"
  ON invoices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policies for invoice items
CREATE POLICY "Allow read access to invoice items for all users"
  ON invoice_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to invoice items for all users"
  ON invoice_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to invoice items for all users"
  ON invoice_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);