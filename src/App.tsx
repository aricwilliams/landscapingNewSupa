import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { JobDashboard } from './pages/JobDashboard';
import { ScheduleProject } from './pages/ScheduleProject';
import { ScheduleQuote } from './pages/ScheduleQuote';
import { CrewMessage } from './pages/CrewMessage';
import { Products } from './pages/Products';
import { InvoicePage } from './pages/Invoice';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<CustomerDashboard />} />
            <Route path="/customers" element={<CustomerDashboard />} />
            <Route path="/jobs" element={<JobDashboard />} />
            <Route path="/schedule-project" element={<ScheduleProject />} />
            <Route path="/schedule-quote" element={<ScheduleQuote />} />
            <Route path="/crew-message" element={<CrewMessage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/invoices" element={<InvoicePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;