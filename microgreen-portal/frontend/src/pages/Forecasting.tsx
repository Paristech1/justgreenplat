import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import ChartCard from '../components/dashboard/ChartCard'; // Re-use chart card

const API_URL = 'http://localhost:8000';

interface ForecastPoint {
  date: string; // Store as string
  predictedTrays: number;
}

interface HistoricalPoint {
    date: string; // Store as string
    totalTraysSold: number;
}

interface CombinedDataPoint {
  date: string;
  historical?: number;
  predicted?: number;
}

const Forecasting = () => {
  const theme = useTheme();
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastWeeks, setForecastWeeks] = useState(4);
  const [historicalDays, setHistoricalDays] = useState(90);

  // Fetch forecast and historical data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [forecastRes, historicalRes] = await Promise.all([
        fetch(`${API_URL}/forecast?weeks=${forecastWeeks}`),
        fetch(`${API_URL}/historical-sales?days=${historicalDays}`),
      ]);
      
      if (!forecastRes.ok) throw new Error(`Forecast fetch failed: ${forecastRes.statusText}`);
      if (!historicalRes.ok) throw new Error(`Historical fetch failed: ${historicalRes.statusText}`);
      
      const forecastJson = await forecastRes.json();
      const historicalJson: HistoricalPoint[] = await historicalRes.json();
      
      setForecastData(forecastJson.predictions || []);
      setHistoricalData(historicalJson || []);
      
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setForecastData([]);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [forecastWeeks, historicalDays]); // Refetch when parameters change

  // Combine historical and forecast data for the chart
  const combinedChartData: CombinedDataPoint[] = [].concat(
      historicalData.map(d => ({ date: d.date, historical: d.totalTraysSold })), 
      forecastData.map(d => ({ date: d.date, predicted: d.predictedTrays }))
  ).reduce((acc: CombinedDataPoint[], curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
          Object.assign(existing, curr);
      } else {
          acc.push(curr);
      }
      return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleWeeksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const weeks = parseInt(event.target.value, 10);
      if (!isNaN(weeks) && weeks > 0 && weeks <= 12) { // Limit forecast range
          setForecastWeeks(weeks);
      }
  };
  
  const handleDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const days = parseInt(event.target.value, 10);
       if (!isNaN(days) && days > 0 && days <= 365) { // Limit historical range
          setHistoricalDays(days);
      }
  };
  
  const formatDateTick = (tickItem: any) => {
    if (!tickItem) return '';
    try {
      const date = new Date(tickItem);
      if (isNaN(date.getTime())) return 'Invalid';
      return format(date, 'MMM d');
    } catch (error) {
      console.error('Error formatting date tick:', error);
      return 'Error';
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sales & Demand Forecasting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Forecast demand, analyze trends, and optimize your growing schedule
        </Typography>
      </Box>
      
      {/* Configuration Section */}
       <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
             <TextField
                label="Historical Days"
                type="number"
                value={historicalDays}
                onChange={handleDaysChange}
                fullWidth
                size="small"
                inputProps={{ min: 7, max: 365 }}
            />
          </Grid>
           <Grid item xs={6} sm={3}>
            <TextField
                label="Forecast Weeks"
                type="number"
                value={forecastWeeks}
                onChange={handleWeeksChange}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
           <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
              {/* Placeholder for What-if simulator button */}
               <Button variant="outlined" disabled>What-If Simulator</Button>
           </Grid>
        </Grid>
      </Paper>

      {/* Forecast Chart */}
      <ChartCard
        title="Tray Demand Forecast"
        subtitle={`Historical (${historicalDays} days) vs. Predicted (${forecastWeeks} weeks)`}
        height={400}
        isLoading={loading}
        chart={
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedChartData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                 dataKey="date" 
                 tickFormatter={formatDateTick} 
                 // Dynamically adjust ticks based on data range?
                 // interval={'preserveStartEnd'}
              />
              <YAxis label={{ value: 'Trays', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                labelFormatter={(label) => {
                  if (!label) return '';
                  try {
                    const date = new Date(label);
                    if (isNaN(date.getTime())) return 'Invalid date';
                    return format(date, 'PPP');
                  } catch (error) {
                    console.error('Error formatting tooltip label:', error, label);
                    return 'Error';
                  }
                }} 
              />
              <Legend />
              <Line 
                 type="monotone" 
                 dataKey="historical" 
                 name="Historical Sold" 
                 stroke={theme.palette.secondary.main} 
                 strokeWidth={2}
                 dot={false}
                 connectNulls // Connect lines across potential gaps where prediction starts
              />
              <Line 
                 type="monotone" 
                 dataKey="predicted" 
                 name="Predicted Demand" 
                 stroke={theme.palette.primary.main} 
                 strokeWidth={2}
                 strokeDasharray="5 5" 
                 dot={false}
                 connectNulls
               />
            </LineChart>
          </ResponsiveContainer>
        }
      />
      
      {/* Placeholder for raw data table and alerts */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6">Additional Features</Typography>
         <Typography variant="body2" color="text.secondary">
            (Raw data table view and automated alerts would be added here)
        </Typography>
      </Paper>
    </Box>
  );
};

export default Forecasting; 