import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';

const API_URL = 'http://localhost:8000';

const Inventory = () => {
  const theme = useTheme();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Filter state
  const [varietyFilter, setVarietyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  
  const [varieties, setVarieties] = useState<string[]>([]);
  
  // New Item Form State
  const [newItem, setNewItem] = useState({
    variety: '',
    trayCount: 1,
    weightKg: '',
    status: 'in-storage',
    harvestDate: new Date(),
    notes: '',
  });
  
  // Fetch varieties for filter dropdown
  useEffect(() => {
    const fetchVarieties = async () => {
      try {
        const response = await fetch(`${API_URL}/varieties`);
        const data = await response.json();
        setVarieties(data.map((v: any) => v.name));
      } catch (error) {
        console.error('Error fetching varieties:', error);
      }
    };
    fetchVarieties();
  }, []);
  
  // Fetch inventory data based on filters
  const fetchInventory = async () => {
    setLoading(true);
    let queryParams = '?';
    if (varietyFilter) queryParams += `variety=${varietyFilter}&`;
    if (statusFilter) queryParams += `status=${statusFilter}&`;
    if (startDateFilter) queryParams += `start_date=${startDateFilter.toISOString()}&`;
    if (endDateFilter) queryParams += `end_date=${endDateFilter.toISOString()}&`;
    
    try {
      const response = await fetch(`${API_URL}/inventory${queryParams}`);
      const data = await response.json();
      // Add a unique 'id' field if it doesn't exist, or ensure it's correct for DataGrid
      setInventory(data.map((item: any) => ({ ...item, id: item.id || Math.random() }))); 
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInventory();
  }, [varietyFilter, statusFilter, startDateFilter, endDateFilter]); // Refetch on filter change
  
  const handleClearFilters = () => {
    setVarietyFilter('');
    setStatusFilter('');
    setStartDateFilter(null);
    setEndDateFilter(null);
  };

  // Add Item Modal Handlers
  const handleOpenAddModal = () => setAddModalOpen(true);
  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    // Reset form on close
    setNewItem({
      variety: '',
      trayCount: 1,
      weightKg: '',
      status: 'in-storage',
      harvestDate: new Date(),
      notes: '',
    });
  };

  const handleNewItemChange = (field: string, value: any) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewItemSubmit = async () => {
    const itemToAdd = {
      ...newItem,
      weightKg: parseFloat(newItem.weightKg) || 0,
      harvestDate: newItem.harvestDate.toISOString(),
    };

    console.log("Submitting:", itemToAdd);

    try {
      const response = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemToAdd),
      });

      if (response.ok) {
        handleCloseAddModal();
        fetchInventory();
      } else {
        console.error('Failed to add inventory item:', await response.text());
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  // Define columns for the DataGrid
  const columns: GridColDef[] = [
    { field: 'variety', headerName: 'Variety', width: 150 },
    { field: 'trayCount', headerName: 'Trays', type: 'number', width: 100, align: 'right', headerAlign: 'right' },
    { 
      field: 'weightKg', 
      headerName: 'Weight (kg)', 
      type: 'number', 
      width: 120, 
      align: 'right', 
      headerAlign: 'right',
      valueFormatter: (params) => params.value ? `${params.value.toFixed(2)} kg` : 'N/A'
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { 
      field: 'harvestDate', 
      headerName: 'Harvest Date', 
      width: 150,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        try {
          // Check if string is not a valid date format
          if (typeof params.value !== 'string' || params.value.trim() === '') {
            return 'N/A';
          }
          
          const date = new Date(params.value);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            return 'Invalid date';
          }
          return format(date, 'PPpp');
        } catch (error) {
          console.error('Error formatting date:', error, params.value);
          return 'Error';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Item">
            <IconButton size="small" onClick={() => console.log('Edit', params.row.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adjust Inventory">
            <IconButton size="small" onClick={() => console.log('Adjust', params.row.id)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory & Yield Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track harvested weights, manage inventory, and visualize yield patterns
        </Typography>
      </Box>
      
      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label="Variety"
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value)}
              fullWidth
              sx={{ 
                '& .MuiInputLabel-root': { 
                  overflow: 'visible',
                  whiteSpace: 'nowrap'
                },
                minWidth: '180px'
              }}
              InputLabelProps={{
                shrink: true
              }}
            >
              <MenuItem value=""><em>All Varieties</em></MenuItem>
              {varieties.map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
              sx={{ 
                '& .MuiInputLabel-root': { 
                  overflow: 'visible',
                  whiteSpace: 'nowrap'
                },
                minWidth: '180px'
              }}
              InputLabelProps={{
                shrink: true
              }}
            >
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="in-storage">In Storage</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="waste">Waste</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker 
              label="Harvest Start Date" 
              value={startDateFilter} 
              onChange={setStartDateFilter}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  InputLabelProps: {
                    shrink: true
                  }
                } 
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker 
              label="Harvest End Date" 
              value={endDateFilter} 
              onChange={setEndDateFilter}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  InputLabelProps: {
                    shrink: true
                  }
                } 
              }}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              size="small"
            >
              Clear Filters
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddCircleOutlineIcon />} 
              onClick={handleOpenAddModal}
              size="small"
            >
              Add New Item
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* DataGrid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={inventory}
          columns={columns}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>
      
      {/* Add New Item Modal */}
      <Dialog open={addModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              required
              label="Variety"
              value={newItem.variety}
              onChange={(e) => handleNewItemChange('variety', e.target.value)}
              fullWidth
            >
              {varieties.map((v) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
            <TextField
              required
              label="Number of Trays Harvested"
              type="number"
              value={newItem.trayCount}
              onChange={(e) => handleNewItemChange('trayCount', parseInt(e.target.value) || 1)}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
             <TextField
              label="Weight (kg)"
              type="number"
              value={newItem.weightKg}
              onChange={(e) => handleNewItemChange('weightKg', e.target.value)}
              fullWidth
              InputProps={{ inputProps: { step: 0.01, min: 0 } }}
            />
            <DatePicker
              label="Harvest Date"
              value={newItem.harvestDate}
              onChange={(date) => handleNewItemChange('harvestDate', date || new Date())}
              slotProps={{ textField: { fullWidth: true } }}
            />
             <TextField
              select
              label="Status"
              value={newItem.status}
              onChange={(e) => handleNewItemChange('status', e.target.value)}
              fullWidth
            >
              <MenuItem value="in-storage">In Storage</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="waste">Waste</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={newItem.notes}
              onChange={(e) => handleNewItemChange('notes', e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button 
            onClick={handleAddNewItemSubmit} 
            variant="contained"
            disabled={!newItem.variety || !newItem.trayCount}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* TODO: Add Modals for Edit/Adjust */}
    </Box>
  );
};

export default Inventory; 