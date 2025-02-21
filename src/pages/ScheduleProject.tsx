import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { Calendar, Users, MapPin, Clock, DollarSign, Leaf, Trees as Tree, Shovel, Scissors, SprayCan as Spray, Ruler, CloudRain, Sun } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Customer } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  base_price: number;
  estimated_hours: number;
  category: string;
}

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const steps = ['Select Customer', 'Choose Services', 'Schedule & Details', 'Review'];

export const ScheduleProject: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<string>('once');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
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

  const handleSubmit = async () => {
    try {
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
            service_frequency: frequency
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = customer.id;
      } else {
        customerId = selectedCustomer!.id;
      }

      // Create the job
      const { error: jobError } = await supabase
        .from('jobs')
        .insert([{
          customer_id: customerId,
          title: selectedProducts.map(p => p.name).join(', '),
          status: 'scheduled',
          date,
          frequency,
          address: isNewCustomer ? newCustomer.address : selectedCustomer!.address,
          description: `Services: ${selectedProducts.map(p => p.name).join(', ')}\n${notes}`.trim(),
          crew: [],
          estimated_hours: getTotalHours(),
          price: getTotalPrice()
        }]);

      if (jobError) throw jobError;

      // Navigate to the jobs dashboard
      navigate('/jobs');
    } catch (error) {
      console.error('Error scheduling project:', error);
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
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Schedule & Details
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                type="date"
                label="Service Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                fullWidth
                label="Service Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <MenuItem value="once">One-time Service</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Stack>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Project Details
            </Typography>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Customer
                    </Typography>
                    <Typography variant="h6">
                      {isNewCustomer
                        ? newCustomer.name
                        : selectedCustomer?.name}
                    </Typography>
                    <Typography>
                      {isNewCustomer
                        ? newCustomer.address
                        : selectedCustomer?.address}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Services
                    </Typography>
                    <Stack spacing={1}>
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
                            <Typography>{product.name}</Typography>
                          </Box>
                          <Typography>${product.base_price}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Divider />
                  <Box>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          <Calendar size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                          Date
                        </Typography>
                        <Typography>{new Date(date).toLocaleDateString()}</Typography>
                      </Box>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          <Clock size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                          Estimated Hours
                        </Typography>
                        <Typography>{getTotalHours()} hours</Typography>
                      </Box>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          <DollarSign size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                          Total Price
                        </Typography>
                        <Typography>${getTotalPrice()}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                  {notes && (
                    <>
                      <Divider />
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Additional Notes
                        </Typography>
                        <Typography>{notes}</Typography>
                      </Box>
                    </>
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
      case 2:
        return Boolean(date && frequency);
      default:
        return true;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Schedule Project
      </Typography>

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
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={!isStepValid()}
        >
          {activeStep === steps.length - 1 ? 'Schedule Project' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};