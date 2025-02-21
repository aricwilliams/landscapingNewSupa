export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  serviceFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  activeJobs: number;
  totalInvoices: number;
  pendingQuotes: number;
  scheduledJobs: number;
}

export interface Job {
  id: string;
  customerId: string;
  title: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  date: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  address: string;
  description: string;
  crew: string[];
  estimatedHours: number;
  price: number;
  completedAt?: string;
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
  };
  amount: number;
  date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  image_url?: string;
  created_at: string;
  channel_id: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  created_at: string;
}