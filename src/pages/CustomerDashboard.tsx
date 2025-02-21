import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Modal,
  IconButton,
} from '@mui/material';
import { Filter, Plus, Search, X as CloseIcon } from 'lucide-react';
import type { Customer } from '../types';

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '(919) 555-0123',
    email: 'john@example.com',
    address: '123 Pine Street, Chapel Hill, NC',
    serviceFrequency: 'weekly',
    activeJobs: 2,
    totalInvoices: 5,
    pendingQuotes: 1,
    scheduledJobs: 3,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '(919) 555-0124',
    email: 'sarah@example.com',
    address: '456 Oak Avenue, Durham, NC',
    serviceFrequency: 'biweekly',
    activeJobs: 1,
    totalInvoices: 3,
    pendingQuotes: 0,
    scheduledJobs: 2,
  },
  {
    id: '3',
    name: 'Michael Williams',
    phone: '(919) 555-0125',
    email: 'michael@example.com',
    address: '789 Elm Road, Raleigh, NC',
    serviceFrequency: 'monthly',
    activeJobs: 3,
    totalInvoices: 8,
    pendingQuotes: 2,
    scheduledJobs: 4,
  },
  {
    id: '4',
    name: 'Emily Davis',
    phone: '(919) 555-0126',
    email: 'emily@example.com',
    address: '321 Maple Lane, Cary, NC',
    serviceFrequency: 'quarterly',
    activeJobs: 1,
    totalInvoices: 2,
    pendingQuotes: 1,
    scheduledJobs: 1,
  }
];

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 600 },
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

interface NewCustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
}

const initialFormState: NewCustomerForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  serviceFrequency: 'weekly',
};

export const CustomerDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFrequency, setServiceFrequency] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NewCustomerForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<NewCustomerForm>>({});

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServiceFrequency(event.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setServiceFrequency('all');
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is edited
    if (formErrors[name as keyof NewCustomerForm]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewCustomerForm> = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
      errors.phone = 'Phone format should be (XXX) XXX-XXXX';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    const newCustomer: Customer = {
      id: `${customers.length + 1}`,
      ...formData,
      activeJobs: 0,
      totalInvoices: 0,
      pendingQuotes: 0,
      scheduledJobs: 0,
    };

    setCustomers(prev => [...prev, newCustomer]);
    handleModalClose();
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);

      const matchesFrequency = serviceFrequency === 'all' || customer.serviceFrequency === serviceFrequency;

      return matchesSearch && matchesFrequency;
    });
  }, [customers, searchTerm, serviceFrequency]);

  const getFrequencyColor = (frequency: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (frequency) {
      case 'weekly':
        return 'success';
      case 'biweekly':
        return 'info';
      case 'monthly':
        return 'warning';
      case 'quarterly':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Customer Dashboard
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={serviceFrequency}
              onChange={handleFrequencyChange}
              InputProps={{
                startAdornment: <Filter size={20} style={{ marginRight: 8 }} />,
              }}
            >
              <MenuItem value="all">All Frequencies</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="biweekly">Bi-weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus size={20} />}
                onClick={handleModalOpen}
              >
                Add New Customer
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredCustomers.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center" color="text.secondary">
                  No customers found matching your filters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredCustomers.map((customer) => (
            <Grid item xs={12} md={6} lg={4} key={customer.id}>
              <Card>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {customer.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {customer.phone}
                    </Typography>
                    <Chip
                      label={customer.serviceFrequency}
                      size="small"
                      color={getFrequencyColor(customer.serviceFrequency)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Active Jobs
                      </Typography>
                      <Typography variant="h6">{customer.activeJobs}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Invoices
                      </Typography>
                      <Typography variant="h6">{customer.totalInvoices}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Pending Quotes
                      </Typography>
                      <Typography variant="h6">{customer.pendingQuotes}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled Jobs
                      </Typography>
                      <Typography variant="h6">{customer.scheduledJobs}</Typography>
                    </Grid>
                  </Grid>

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => {/* Implement view customer details */}}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        aria-labelledby="add-customer-modal"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Add New Customer
            </Typography>
            <IconButton onClick={handleModalClose} size="small">
              <CloseIcon size={20} />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone || 'Format: (XXX) XXX-XXXX'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Service Frequency"
                  name="serviceFrequency"
                  value={formData.serviceFrequency}
                  onChange={handleFormChange}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Add Customer
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </Box>
  );
};