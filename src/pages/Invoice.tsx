import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { Mail, Download, Eye, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import type { Invoice } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const InvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailDate, setEmailDate] = useState(new Date().toISOString().split('T')[0]);
  const [emailNote, setEmailNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out invoices with missing customer data
      const validInvoices = data?.filter(invoice => invoice.customer) || [];
      setInvoices(validInvoices);
      
      if (data && data.length !== validInvoices.length) {
        setError('Some invoices have missing customer data');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleEmailInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedInvoice?.customer) return;

    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: selectedInvoice.id,
          scheduledDate: emailDate,
          note: emailNote,
        },
      });

      if (error) throw error;

      // Update invoice status if sent immediately
      if (new Date(emailDate).toDateString() === new Date().toDateString()) {
        await supabase
          .from('invoices')
          .update({ status: 'sent' })
          .eq('id', selectedInvoice.id);
        
        fetchInvoices();
      }

      setIsEmailDialogOpen(false);
      setEmailDate(new Date().toISOString().split('T')[0]);
      setEmailNote('');
    } catch (error) {
      console.error('Error sending invoice:', error);
      setError('Failed to send invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'sent':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Invoices
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {invoices.map((invoice) => (
          <Grid item xs={12} md={6} lg={4} key={invoice.id}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Invoice #{invoice.id.slice(0, 8)}
                    </Typography>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  {invoice.customer && (
                    <Typography variant="body1">
                      {invoice.customer.name}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Amount
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(invoice.amount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Date
                      </Typography>
                      <Typography>
                        {format(new Date(invoice.date), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Eye size={18} />}
                      onClick={() => handleViewInvoice(invoice)}
                      fullWidth
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Mail size={18} />}
                      onClick={() => handleEmailInvoice(invoice)}
                      fullWidth
                      disabled={!invoice.customer}
                    >
                      Email
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {invoices.length === 0 && !error && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body1" align="center" color="text.secondary">
                  No invoices found
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* View Invoice Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Invoice #{selectedInvoice.id.slice(0, 8)}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Download size={18} />}
                  onClick={() => {/* Implement PDF download */}}
                >
                  Download PDF
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bill To
                    </Typography>
                    {selectedInvoice.customer ? (
                      <>
                        <Typography variant="body1">
                          {selectedInvoice.customer.name}
                        </Typography>
                        <Typography variant="body2">
                          {selectedInvoice.customer.email}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="error">
                        Customer data not available
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Invoice Date
                      </Typography>
                      <Typography>
                        {format(new Date(selectedInvoice.date), 'MMMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.quantity * item.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="subtitle1">Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1">
                            {formatCurrency(selectedInvoice.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Email Invoice Dialog */}
      <Dialog
        open={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
      >
        <DialogTitle>Send Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              type="date"
              label="Schedule Send Date"
              value={emailDate}
              onChange={(e) => setEmailDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              multiline
              rows={4}
              label="Additional Note (Optional)"
              value={emailNote}
              onChange={(e) => setEmailNote(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendEmail}
            startIcon={<Send size={18} />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};