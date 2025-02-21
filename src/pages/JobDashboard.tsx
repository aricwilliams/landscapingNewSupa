import React, { useState, useEffect } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { Filter, Plus, Search, X as CloseIcon, Calendar, Users, MapPin, Clock, DollarSign, Repeat, ClipboardList, CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

interface NewJobForm {
  title: string;
  customerId: string;
  date: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  address: string;
  description: string;
  crew: string[];
  estimatedHours: number;
  price: number;
}

const initialFormState: NewJobForm = {
  title: '',
  customerId: '',
  date: new Date().toISOString().split('T')[0],
  frequency: 'once',
  address: '',
  description: '',
  crew: [],
  estimatedHours: 0,
  price: 0,
};

export function JobDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [frequency, setFrequency] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<NewJobForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<NewJobForm>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFrequency(event.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFrequency('all');
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
    setFormData(initialFormState);
    setFormErrors({});
    setIsEditMode(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setFormErrors({});
    setIsEditMode(false);
  };

  const handleDetailsModalOpen = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setSelectedJob(null);
    setIsDetailsModalOpen(false);
  };

  const handleEditClick = () => {
    if (selectedJob) {
      setFormData({
        title: selectedJob.title,
        customerId: selectedJob.customerId,
        date: selectedJob.date,
        frequency: selectedJob.frequency,
        address: selectedJob.address,
        description: selectedJob.description,
        crew: selectedJob.crew,
        estimatedHours: selectedJob.estimatedHours,
        price: selectedJob.price,
      });
      setIsEditMode(true);
      setIsModalOpen(true);
      setIsDetailsModalOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedJob) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', selectedJob.id);

      if (error) throw error;

      setJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));
      setIsDeleteDialogOpen(false);
      setIsDetailsModalOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleCompleteClick = () => {
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedJob) return;

    try {
      // Create an invoice for the completed job
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          customer_id: selectedJob.customerId,
          amount: selectedJob.price,
          date: new Date().toISOString().split('T')[0],
          status: 'draft'
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert([{
          invoice_id: invoice.id,
          description: selectedJob.title,
          quantity: 1,
          price: selectedJob.price
        }]);

      if (itemError) throw itemError;

      // Update the job as completed
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          invoice_id: invoice.id
        })
        .eq('id', selectedJob.id);

      if (jobError) throw jobError;

      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJob.id
            ? {
                ...job,
                status: 'completed',
                completedAt: new Date().toISOString(),
                invoiceId: invoice.id
              }
            : job
        )
      );

      setIsCompleteDialogOpen(false);
      setIsDetailsModalOpen(false);
      setSelectedJob(null);

      // Navigate to invoices page
      navigate('/invoices');
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name as keyof NewJobForm]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewJobForm> = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.estimatedHours <= 0) errors.estimatedHours = 'Estimated hours must be greater than 0';
    if (formData.price <= 0) errors.price = 'Price must be greater than 0';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isEditMode && selectedJob) {
        const { error } = await supabase
          .from('jobs')
          .update(formData)
          .eq('id', selectedJob.id);

        if (error) throw error;

        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === selectedJob.id
              ? { ...job, ...formData }
              : job
          )
        );
      } else {
        const { error, data } = await supabase
          .from('jobs')
          .insert([{
            ...formData,
            status: 'scheduled'
          }])
          .select()
          .single();

        if (error) throw error;
        setJobs(prev => [data, ...prev]);
      }

      handleModalClose();
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const filteredJobs = React.useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFrequency = frequency === 'all' || job.frequency === frequency;

      return matchesSearch && matchesFrequency;
    });
  }, [jobs, searchTerm, frequency]);

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getFrequencyColor = (jobFrequency: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (jobFrequency) {
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
          Job Dashboard
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search jobs..."
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
              value={frequency}
              onChange={handleFrequencyChange}
              InputProps={{
                startAdornment: <Filter size={20} style={{ marginRight: 8 }} />,
              }}
            >
              <MenuItem value="all">All Frequencies</MenuItem>
              <MenuItem value="once">One-time</MenuItem>
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
                Add New Job
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredJobs.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center" color="text.secondary">
                  No jobs found matching your filters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        label={job.frequency}
                        size="small"
                        color={getFrequencyColor(job.frequency)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Typography color="text.secondary" gutterBottom>
                      <Calendar size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                      {new Date(job.date).toLocaleDateString()}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                      {job.address}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {job.description}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Hours
                      </Typography>
                      <Typography variant="h6">{job.estimatedHours}h</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="h6">${job.price}</Typography>
                    </Grid>
                  </Grid>

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => handleDetailsModalOpen(job)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Job Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        aria-labelledby="job-modal"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              {isEditMode ? 'Edit Job' : 'Add New Job'}
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
                  label="Job Title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  error={!!formErrors.date}
                  helperText={formErrors.date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleFormChange}
                >
                  <MenuItem value="once">One-time</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </TextField>
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
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Hours"
                  name="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={handleFormChange}
                  error={!!formErrors.estimatedHours}
                  helperText={formErrors.estimatedHours}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleFormChange}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleModalClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    {isEditMode ? 'Save Changes' : 'Add Job'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>

      {/* Job Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onClose={handleDetailsModalClose}
        aria-labelledby="job-details-modal"
      >
        <Box sx={modalStyle}>
          {selectedJob && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                  Job Details
                </Typography>
                <IconButton onClick={handleDetailsModalClose} size="small">
                  <CloseIcon size={20} />
                </IconButton>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    label={selectedJob.status}
                    size="small"
                    color={getStatusColor(selectedJob.status)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Chip
                    label={selectedJob.frequency}
                    size="small"
                    color={getFrequencyColor(selectedJob.frequency)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Stack>
              </Box>

              <List>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={18} />
                        <Typography variant="subtitle1">Date</Typography>
                      </Box>
                    }
                    secondary={new Date(selectedJob.date).toLocaleDateString()}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={18} />
                        <Typography variant="subtitle1">Address</Typography>
                      </Box>
                    }
                    secondary={selectedJob.address}
                  />
                </ListItem>
                <Divider component="li" />

                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClipboardList size={18} />
                        <Typography variant="subtitle1">Description</Typography>
                      </Box>
                    }
                    secondary={selectedJob.description}
                  />
                </ListItem>
                <Divider component="li" />

                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users size={18} />
                        <Typography variant="subtitle1">Crew Members</Typography>
                      </Box>
                    }
                    secondary={selectedJob.crew.join(', ') || 'No crew assigned'}
                  />
                </ListItem>
                <Divider component="li" />

                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Clock size={18} />
                        <Typography variant="subtitle1">Estimated Hours</Typography>
                      </Box>
                    }
                    secondary={`${selectedJob.estimatedHours} hours`}
                  />
                </ListItem>
                <Divider component="li" />

                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DollarSign size={18} />
                        <Typography variant="subtitle1">Price</Typography>
                      </Box>
                    }
                    secondary={`$${selectedJob.price}`}
                  />
                </ListItem>
                <Divider component="li" />

                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Repeat size={18} />
                        <Typography variant="subtitle1">Frequency</Typography>
                      </Box>
                    }
                    secondary={selectedJob.frequency}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {selectedJob.status !== 'completed' && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<CheckCircle size={20} />}
                    onClick={handleCompleteClick}
                  >
                    Complete Job
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleEditClick}
                >
                  Edit Job
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleDeleteClick}
                >
                  Delete Job
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Complete Job Confirmation Dialog */}
      <Dialog
        open={isCompleteDialogOpen}
        onClose={() => setIsCompleteDialogOpen(false)}
      >
        <DialogTitle>Complete Job</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Are you sure you want to mark this job as complete? This will:
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Mark the job as completed</li>
              <li>Generate an invoice automatically</li>
              <li>Move the job to completed status</li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCompleteConfirm}
            variant="contained"
            color="success"
            startIcon={<CheckCircle size={20} />}
          >
            Complete Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this job? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}