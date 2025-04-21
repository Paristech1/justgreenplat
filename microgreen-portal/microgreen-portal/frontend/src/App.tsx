import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Theme
import theme from './theme/index.ts';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import CropPlanner from './pages/CropPlanner';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Forecasting from './pages/Forecasting';

// API data fetch
const API_URL = 'http://localhost:8000';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard-data`);
        const data = await response.json();
        setDashboardData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <Navbar toggleSidebar={toggleSidebar} />
            <Sidebar open={sidebarOpen} />
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                pt: 10,
                ml: sidebarOpen ? '240px' : 0,
                transition: 'margin-left 0.2s',
                overflow: 'auto',
                bgcolor: 'background.default',
                minHeight: '100vh',
              }}
            >
              <Routes>
                <Route 
                  path="/" 
                  element={<Dashboard data={dashboardData} isLoading={isLoading} />} 
                />
                <Route path="/crop-planner" element={<CropPlanner />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/forecasting" element={<Forecasting />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
