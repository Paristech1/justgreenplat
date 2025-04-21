import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Alert,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack
} from '@mui/material';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Components
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import GrowingTrayScene from '../components/three/GrowingTrayScene';

// Icons
import SpaIcon from '@mui/icons-material/Spa';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface DashboardProps {
  data: any;
  isLoading: boolean;
}

const Dashboard = ({ data, isLoading }: DashboardProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTrays, setActiveTrays] = useState(0);
  const [avgYieldPerTray, setAvgYieldPerTray] = useState(0);
  const [recentRevenue, setRecentRevenue] = useState(0);
  const [ordersLastMonth, setOrdersLastMonth] = useState(0);
  const [topVarieties, setTopVarieties] = useState<any[]>([]);
  const [upcomingHarvests, setUpcomingHarvests] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      // Update state from API data
      setActiveTrays(data.kpis.active_trays);
      setAvgYieldPerTray(data.kpis.avg_yield_per_tray);
      setRecentRevenue(data.kpis.recent_revenue);
      setOrdersLastMonth(data.kpis.orders_last_30_days);
      setTopVarieties(data.top_varieties || []);
      setUpcomingHarvests(data.upcoming_harvests || []);
      
      // Process forecast data for chart
      if (data.demand_forecast) {
        const chartData = data.demand_forecast.map((item: any) => ({
          name: item.name,
          weekly: item.weekly_demand,
          monthly: item.monthly_demand
        }));
        setForecastData(chartData);
      }
    }
  }, [data]);

  // Sample performance data for chart
  const yieldPerformanceData = topVarieties.map(variety => ({
    name: variety.name,
    actual: variety.yield_per_tray,
    expected: variety.expected_yield_per_tray,
    performance: variety.performance
  }));

  // Sample revenue data for chart
  const revenueData = [
    { name: 'Week 1', value: 1200 },
    { name: 'Week 2', value: 1800 },
    { name: 'Week 3', value: 1400 },
    { name: 'Week 4', value: 2200 },
  ];

  // Sample variety distribution data for pie chart
  const varietyDistribution = topVarieties.map(variety => ({
    name: variety.name,
    value: variety.yield_per_tray * variety.performance / 100
  }));
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
  ];

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd');
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your microgreens production and business metrics
        </Typography>
      </Box>
      
      {/* KPI Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Trays"
            value={activeTrays}
            icon={<SpaIcon fontSize="large" />}
            trend={{ value: 12, isPositive: true }}
            isLoading={isLoading}
            onClick={() => navigate('/crop-planner')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Yield per Tray"
            value={`${avgYieldPerTray} g`}
            icon={<InventoryIcon fontSize="large" />}
            trend={{ value: 5, isPositive: true }}
            isLoading={isLoading}
            color="secondary"
            onClick={() => navigate('/forecasting')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue (30 days)"
            value={`$${recentRevenue}`}
            icon={<AttachMoneyIcon fontSize="large" />}
            trend={{ value: 8, isPositive: true }}
            isLoading={isLoading}
            color="success"
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Orders (30 days)"
            value={ordersLastMonth}
            icon={<ShoppingCartIcon fontSize="large" />}
            trend={{ value: 3, isPositive: false }}
            isLoading={isLoading}
            color="info"
            onClick={() => navigate('/orders')}
          />
        </Grid>
      </Grid>
      
      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* 3D Visualization */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Growing Area Visualization"
            subtitle="Real-time view of your active trays"
            height={400}
            chart={<GrowingTrayScene />}
            isLoading={isLoading}
          />
        </Grid>
        
        {/* Yield Performance Chart */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Yield Performance by Variety"
            subtitle="Comparing actual vs. expected yields"
            height={400}
            isLoading={isLoading}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yieldPerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="actual" name="Actual Yield (g)" fill={theme.palette.primary.main} />
                  <Bar yAxisId="left" dataKey="expected" name="Expected Yield (g)" fill={theme.palette.secondary.main} />
                  <Line yAxisId="right" type="monotone" dataKey="performance" name="Performance (%)" stroke={theme.palette.warning.main} />
                </BarChart>
              </ResponsiveContainer>
            }
          />
        </Grid>
        
        {/* Demand Forecast */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Demand Forecast"
            subtitle="Projected weekly and monthly demand by variety"
            height={350}
            isLoading={isLoading}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="weekly" name="Weekly Demand" fill={theme.palette.primary.main} />
                  <Bar dataKey="monthly" name="Monthly Demand" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            }
          />
        </Grid>
        
        {/* Revenue Trend */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Revenue Trend"
            subtitle="Last 4 weeks"
            height={350}
            isLoading={isLoading}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Revenue" 
                    stroke={theme.palette.success.main} 
                    fill={theme.palette.success.light} 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            }
          />
        </Grid>
        
        {/* Upcoming Harvests Table */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Upcoming Harvests"
            subtitle="Next scheduled harvests"
            height={350}
            isLoading={isLoading}
            chart={
              <Box sx={{ height: '100%', overflow: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Variety</TableCell>
                      <TableCell>Harvest Date</TableCell>
                      <TableCell align="right">Trays</TableCell>
                      <TableCell align="right">Est. Yield</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingHarvests.map((harvest, index) => (
                      <TableRow key={index}>
                        <TableCell>{harvest.variety}</TableCell>
                        <TableCell>{formatDate(harvest.expected_harvest_date)}</TableCell>
                        <TableCell align="right">{harvest.tray_count}</TableCell>
                        <TableCell align="right">{Math.round(harvest.expected_yield)}g</TableCell>
                      </TableRow>
                    ))}
                    {upcomingHarvests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No upcoming harvests</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            }
          />
        </Grid>
        
        {/* Variety Distribution */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="Variety Distribution"
            subtitle="Production by variety"
            height={350}
            isLoading={isLoading}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={varietyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {varietyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => typeof value === 'number' ? [`${value.toFixed(0)}g`, 'Yield'] : [value, 'Yield']} />
                </PieChart>
              </ResponsiveContainer>
            }
          />
        </Grid>
        
        {/* Action Items */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Action Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Alert severity="warning">
                <strong>Low inventory alert:</strong> Pea Shoots inventory is below target level. Consider planting 3-5 more trays.
              </Alert>
              <Alert severity="info">
                <strong>Upcoming order:</strong> Restaurant ABC has a large order scheduled for next week. Ensure sufficient inventory.
              </Alert>
              <Alert severity="success">
                <strong>Performance note:</strong> Sunflower yields are 8% above target. Consider documenting your growing approach.
              </Alert>
            </Stack>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">View All Alerts</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 