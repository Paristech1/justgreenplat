import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  useTheme, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem,
  Popover,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

interface CropPlannerProps {}

interface Planting {
  id: string;
  variety_id: string;
  plant_date: string;
  expected_harvest_date: string;
  tray_count: number;
  notes?: string;
}

const CropPlanner = ({}: CropPlannerProps) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [varieties, setVarieties] = useState<{id: string, name: string}[]>([]);
  
  // Add Planting Modal states
  const [addPlantingOpen, setAddPlantingOpen] = useState(false);
  const [viewAllPlantingsOpen, setViewAllPlantingsOpen] = useState(false);
  const [newPlanting, setNewPlanting] = useState<{
    variety_id: string;
    plant_date: Date | null;
    expected_harvest_date: Date | null;
    tray_count: number;
    notes: string;
  }>({
    variety_id: '',
    plant_date: new Date(),
    expected_harvest_date: addDays(new Date(), 10), // default 10 days growth
    tray_count: 1,
    notes: ''
  });
  
  // Planting Detail Popover states
  const [detailsPopoverAnchor, setDetailsPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null);
  
  useEffect(() => {
    // Fetch plantings
    const fetchPlantings = async () => {
      try {
        const response = await fetch('http://localhost:8000/plantings');
        const data = await response.json();
        setPlantings(data);
      } catch (error) {
        console.error('Error fetching plantings:', error);
      }
    };
    
    // Fetch varieties for dropdown
    const fetchVarieties = async () => {
      try {
        const response = await fetch('http://localhost:8000/varieties');
        const data = await response.json();
        setVarieties(data);
      } catch (error) {
        console.error('Error fetching varieties:', error);
      }
    };
    
    fetchPlantings();
    fetchVarieties();
  }, []);
  
  // Generate array of dates for the calendar (4 weeks starting from today)
  const calendarDates = Array.from({ length: 28 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      day: format(date, 'd'),
      weekday: format(date, 'EEE'),
      month: format(date, 'MMM'),
      isToday: i === 0,
    };
  });
  
  // Get plantings for a specific date
  const getPlantingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return plantings.filter(planting => {
      const plantDate = new Date(planting.plant_date);
      const harvestDate = new Date(planting.expected_harvest_date);
      
      return format(plantDate, 'yyyy-MM-dd') === dateStr || 
             format(harvestDate, 'yyyy-MM-dd') === dateStr;
    });
  };
  
  // Add Planting Modal handlers
  const handleOpenAddPlanting = () => setAddPlantingOpen(true);
  const handleCloseAddPlanting = () => setAddPlantingOpen(false);
  
  // Handlers for View All Plantings modal
  const handleOpenViewAllPlantings = () => setViewAllPlantingsOpen(true);
  const handleCloseViewAllPlantings = () => setViewAllPlantingsOpen(false);
  
  const handleNewPlantingChange = (field: string, value: any) => {
    setNewPlanting({ ...newPlanting, [field]: value });
  };
  
  const handleAddPlantingSubmit = async () => {
    // Convert dates to ISO strings for backend
    const plantingToAdd = {
      ...newPlanting,
      plant_date: newPlanting.plant_date?.toISOString(),
      expected_harvest_date: newPlanting.expected_harvest_date?.toISOString()
    };
    
    try {
      const response = await fetch('http://localhost:8000/plantings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plantingToAdd),
      });
      
      if (response.ok) {
        // Fetch updated plantings
        const newPlantsResponse = await fetch('http://localhost:8000/plantings');
        const data = await newPlantsResponse.json();
        setPlantings(data);
        
        // Reset form and close modal
        setNewPlanting({
          variety_id: '',
          plant_date: new Date(),
          expected_harvest_date: addDays(new Date(), 10),
          tray_count: 1,
          notes: ''
        });
        handleCloseAddPlanting();
      } else {
        console.error('Failed to add planting');
      }
    } catch (error) {
      console.error('Error adding planting:', error);
    }
  };
  
  // Details Popover handlers
  const handleOpenDetailsPopover = (event: React.MouseEvent<HTMLElement>, planting: Planting) => {
    setDetailsPopoverAnchor(event.currentTarget);
    setSelectedPlanting(planting);
  };
  
  const handleCloseDetailsPopover = () => {
    setDetailsPopoverAnchor(null);
    setSelectedPlanting(null);
  };
  
  const isDetailsPopoverOpen = Boolean(detailsPopoverAnchor);
  
  // Find variety name by id
  const getVarietyName = (id: string) => {
    const variety = varieties.find(v => v.id === id);
    return variety ? variety.name : id;
  };
  
  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crop Planner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Plan your plantings and harvests with our drag-and-drop calendar
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker 
              label="Select Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleOpenAddPlanting}
            >
              Add Planting
            </Button>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleOpenViewAllPlantings}
            >
              View All Plantings
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Calendar Grid */}
      <Paper sx={{ p: 0, overflow: 'auto' }}>
        <Box sx={{ minWidth: 1200 }}>
          {/* Calendar Header */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Box 
                key={day} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  borderRight: day !== 'Sat' ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                {day}
              </Box>
            ))}
          </Box>
          
          {/* Calendar Grid */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(4, minmax(100px, auto))',
              border: 1,
              borderTop: 0,
              borderColor: 'divider'
            }}
          >
            {calendarDates.map((dateObj, index) => {
              const isFirstOfMonth = dateObj.day === '1';
              const plantingsForDate = getPlantingsForDate(dateObj.date);
              
              return (
                <Box 
                  key={index} 
                  sx={{ 
                    minHeight: 120,
                    p: 1,
                    borderRight: (index + 1) % 7 !== 0 ? 1 : 0,
                    borderBottom: index < 21 ? 1 : 0,
                    borderColor: 'divider',
                    bgcolor: dateObj.isToday ? 'greenLight.main' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'greenLight.light',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: dateObj.isToday ? 'bold' : 'normal',
                      }}
                    >
                      {dateObj.day}
                    </Typography>
                    {isFirstOfMonth && (
                      <Typography variant="caption" color="text.secondary">
                        {dateObj.month}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Plantings and Harvests for this date */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {plantingsForDate.map((planting, i) => {
                      const isPlanting = format(new Date(planting.plant_date), 'yyyy-MM-dd') === 
                                         format(dateObj.date, 'yyyy-MM-dd');
                      
                      const bgColor = isPlanting ? theme.palette.primary.light : theme.palette.secondary.light;
                      const color = isPlanting ? theme.palette.primary.contrastText : theme.palette.secondary.contrastText;
                      
                      return (
                        <Box
                          key={i}
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: bgColor,
                            color: color,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.9,
                            }
                          }}
                          onClick={(e) => handleOpenDetailsPopover(e, planting)}
                        >
                          {isPlanting ? '🌱 Plant: ' : '🔪 Harvest: '}
                          {getVarietyName(planting.variety_id)} ({planting.tray_count} tray{planting.tray_count > 1 ? 's' : ''})
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
      
      {/* Add Planting Modal */}
      <Dialog 
        open={addPlantingOpen} 
        onClose={handleCloseAddPlanting}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Planting</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Variety"
              value={newPlanting.variety_id}
              onChange={(e) => handleNewPlantingChange('variety_id', e.target.value)}
              fullWidth
              required
            >
              {varieties.map((variety) => (
                <MenuItem key={variety.id} value={variety.id}>
                  {variety.name}
                </MenuItem>
              ))}
            </TextField>
            
            <DatePicker 
              label="Plant Date" 
              value={newPlanting.plant_date}
              onChange={(date) => handleNewPlantingChange('plant_date', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            
            <DatePicker 
              label="Expected Harvest Date" 
              value={newPlanting.expected_harvest_date}
              onChange={(date) => handleNewPlantingChange('expected_harvest_date', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            
            <TextField
              label="Number of Trays"
              type="number"
              value={newPlanting.tray_count}
              onChange={(e) => handleNewPlantingChange('tray_count', parseInt(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
            
            <TextField
              label="Notes"
              value={newPlanting.notes}
              onChange={(e) => handleNewPlantingChange('notes', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddPlanting}>Cancel</Button>
          <Button 
            onClick={handleAddPlantingSubmit} 
            variant="contained" 
            color="primary"
            disabled={!newPlanting.variety_id || !newPlanting.plant_date || !newPlanting.expected_harvest_date}
          >
            Add Planting
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View All Plantings Modal */}
      <Dialog 
        open={viewAllPlantingsOpen} 
        onClose={handleCloseViewAllPlantings}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>All Plantings</DialogTitle>
        <DialogContent>
          <List>
            {plantings.length > 0 ? (
              plantings.map((planting) => (
                <ListItem key={planting.id} divider>
                  <ListItemText
                    primary={`${getVarietyName(planting.variety_id)} (${planting.tray_count} tray${planting.tray_count > 1 ? 's' : ''})`}
                    secondary={`Planted: ${format(new Date(planting.plant_date), 'MMM dd, yyyy')} | Harvest: ${format(new Date(planting.expected_harvest_date), 'MMM dd, yyyy')}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography>No plantings found.</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewAllPlantings}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Planting Details Popover */}
      <Popover
        open={isDetailsPopoverOpen}
        anchorEl={detailsPopoverAnchor}
        onClose={handleCloseDetailsPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {selectedPlanting && (
          <Box sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              {getVarietyName(selectedPlanting.variety_id)}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Plant Date:</strong> {format(new Date(selectedPlanting.plant_date), 'PP')}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Harvest Date:</strong> {format(new Date(selectedPlanting.expected_harvest_date), 'PP')}
            </Typography>
            
            <Typography variant="body2" gutterBottom>
              <strong>Trays:</strong> {selectedPlanting.tray_count}
            </Typography>
            
            {selectedPlanting.notes && (
              <Typography variant="body2">
                <strong>Notes:</strong> {selectedPlanting.notes}
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                color="primary"
                onClick={handleCloseDetailsPopover}
              >
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default CropPlanner; 