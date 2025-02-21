/*
  # Create customers and invoices schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `service_frequency` (text)
      - `created_at` (timestamp)

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
    - Enable RLS on all tables
    - Add policies for all users
*/

-- Create customers table first
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  service_frequency text NOT NULL,
  created_at timestamptz DEFAULT now()
);

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

-- Create jobs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
    CREATE TABLE jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
      title text NOT NULL,
      status text NOT NULL DEFAULT 'scheduled',
      date date NOT NULL,
      frequency text NOT NULL,
      address text NOT NULL,
      description text NOT NULL,
      crew text[] NOT NULL DEFAULT '{}',
      estimated_hours numeric NOT NULL DEFAULT 0,
      price numeric NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Add columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Allow read access to customers for all users"
  ON customers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to customers for all users"
  ON customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to customers for all users"
  ON customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

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

-- Create policies for jobs
CREATE POLICY "Allow read access to jobs for all users"
  ON jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to jobs for all users"
  ON jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to jobs for all users"
  ON jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);