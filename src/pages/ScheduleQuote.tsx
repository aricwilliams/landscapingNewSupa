import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Calendar,
  DollarSign,
  Mail,
  Plus,
  Leaf,
  Trees as Tree,
  Shovel,
  Scissors,
  SprayCan as Spray,
  Ruler,
  CloudRain,
  Sun,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Customer, Product } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  service_frequency: string;
}

const steps = ['Select Customer', 'Choose Services', 'Review & Send'];

export function ScheduleQuote() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    service_frequency: 'monthly', // Default value
  });
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [notes, setNotes] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailNote, setEmailNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
  };

  const handleNewCustomerChange = (field: keyof NewCustomer) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewCustomer((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleProductToggle = (product: Product) => {
    setSelectedProducts((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const getTotalPrice = () => {
    return selectedProducts.reduce((sum, product) => sum + product.base_price, 0);
  };

  const getTotalHours = () => {
    return selectedProducts.reduce((sum, product) => sum + product.estimated_hours, 0);
  };

  const handleSendQuote = async () => {
    try {
      setError(null);
      // First create or get customer
      let customerId;
      if (isNewCustomer) {
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            address: newCustomer.address,
            service_frequency: newCustomer.service_frequency,
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = customer.id;
      } else {
        customerId = selectedCustomer!.id;
      }

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          customer_id: customerId,
          total_amount: getTotalPrice(),
          status: 'pending',
          notes: `${notes}\n\nEmail Note: ${emailNote}`.trim(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItems = selectedProducts.map(product => ({
        quote_id: quote.id,
        product_id: product.id,
        description: product.name,
        quantity: 1,
        price: product.base_price,
        estimated_hours: product.estimated_hours,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      setSuccess('Quote created successfully!');
      setTimeout(() => {
        // Reset form
        setActiveStep(0);
        setSelectedCustomer(null);
        setIsNewCustomer(false);
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          address: '',
          service_frequency: 'monthly',
        });
        setSelectedProducts([]);
        setNotes('');
        setEmailNote('');
        setIsEmailDialogOpen(false);
        setSuccess(null);
        
        // Navigate to jobs dashboard
        navigate('/jobs');
      }, 2000);

    } catch (error) {
      console.error('Error creating quote:', error);
      setError('Failed to create quote. Please try again.');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Leaf': <Leaf size={24} />,
      'Tree': <Tree size={24} />,
      'Shovel': <Shovel size={24} />,
      'Scissors': <Scissors size={24} />,
      'Spray': <Spray size={24} />,
      'Ruler': <Ruler size={24} />,
      'Rain': <CloudRain size={24} />,
      'Sun': <Sun size={24} />,
    };
    return iconMap[iconName] || <Leaf size={24} />;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Customer
            </Typography>
            <Stack spacing={3}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={isNewCustomer ? null : selectedCustomer}
                onChange={(_, newValue) => handleCustomerSelect(newValue)}
                disabled={isNewCustomer}
                renderInput={(params) => (
                  <TextField {...params} label="Search Existing Customers" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isNewCustomer}
                    onChange={(e) => {
                      setIsNewCustomer(e.target.checked);
                      if (e.target.checked) {
                        setSelectedCustomer(null);
                      }
                    }}
                  />
                }
                label="New Customer"
              />
              {isNewCustomer && (
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={newCustomer.name}
                        onChange={handleNewCustomerChange('name')}
                      />
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={newCustomer.email}
                        onChange={handleNewCustomerChange('email')}
                      />
                      <TextField
                        fullWidth
                        label="Phone"
                        value={newCustomer.phone}
                        onChange={handleNewCustomerChange('phone')}
                      />
                      <TextField
                        fullWidth
                        label="Address"
                        value={newCustomer.address}
                        onChange={handleNewCustomerChange('address')}
                      />
                      <TextField
                        select
                        fullWidth
                        label="Service Frequency"
                        value={newCustomer.service_frequency}
                        onChange={handleNewCustomerChange('service_frequency')}
                      >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Bi-weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </TextField>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Services
            </Typography>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} key={product.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      bgcolor: selectedProducts.find((p) => p.id === product.id)
                        ? 'primary.light'
                        : 'background.paper',
                      color: selectedProducts.find((p) => p.id === product.id)
                        ? 'white'
                        : 'text.primary',
                    }}
                    onClick={() => handleProductToggle(product)}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {getIconComponent(product.icon)}
                        <Box>
                          <Typography variant="h6">{product.name}</Typography>
                          <Typography variant="body2">
                            {product.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={`$${product.base_price}`}
                              size="small"
                              color="primary"
                            />
                            <Chip
                              label={`${product.estimated_hours}h`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Quote
            </Typography>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Customer
                    </Typography>
                    <Typography variant="h6">
                      {isNewCustomer ? newCustomer.name : selectedCustomer?.name}
                    </Typography>
                    <Typography>
                      {isNewCustomer ? newCustomer.email : selectedCustomer?.email}
                    </Typography>
                    <Typography>
                      {isNewCustomer ? newCustomer.address : selectedCustomer?.address}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Services
                    </Typography>
                    <Stack spacing={2}>
                      {selectedProducts.map((product) => (
                        <Box
                          key={product.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getIconComponent(product.icon)}
                            <Box>
                              <Typography>{product.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Estimated: {product.estimated_hours} hours
                              </Typography>
                            </Box>
                          </Box>
                          <Typography>${product.base_price}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="h6" align="right">
                      Total: ${getTotalPrice()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="right">
                      Estimated Time: {getTotalHours()} hours
                    </Typography>
                  </Box>

                  {notes && (
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Additional Notes
                      </Typography>
                      <Typography>{notes}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return isNewCustomer
          ? Boolean(
              newCustomer.name &&
                newCustomer.email &&
                newCustomer.phone &&
                newCustomer.address
            )
          : Boolean(selectedCustomer);
      case 1:
        return selectedProducts.length > 0;
      default:
        return true;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Schedule Quote
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            startIcon={<Mail />}
            onClick={() => setIsEmailDialogOpen(true)}
            disabled={!isStepValid()}
          >
            Create Quote
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Email Dialog */}
      <Dialog
        open={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
      >
        <DialogTitle>Create Quote</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              multiline
              rows={4}
              label="Additional Note for Quote"
              value={emailNote}
              onChange={(e) => setEmailNote(e.target.value)}
              fullWidth
              placeholder="Add any additional notes to include with the quote..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendQuote}
            startIcon={<Mail />}
          >
            Create Quote
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}