import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  MenuItem,
  Grid,
  Chip,
  Select,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

const API_URL = 'http://localhost:8000';

// Define interfaces based on backend models
interface OrderItem {
  id: string;
  orderId: string;
  inventoryItemId: string;
  variety: string;
  quantity: number;
  price_per_tray?: number;
}

interface Order {
  id: string;
  customerName: string;
  customerContact?: string;
  orderDate: string; // Store as string from API
  pickupDate: string; // Store as string from API
  status: string;
  items: OrderItem[];
  total_price?: number;
}

// Helper to get chip color based on status
const getStatusChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  
  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerContact: '',
    orderDate: new Date(),
    pickupDate: addDays(new Date(), 1), // Default pickup next day
    status: 'pending',
    items: [], 
    notes: '', // Optional notes field
  });

  // Fetch orders data based on filters
  const fetchOrders = async () => {
    setLoading(true);
    let queryParams = '?';
    if (statusFilter) queryParams += `status=${statusFilter}&`;
    if (startDateFilter) queryParams += `start_date=${startDateFilter.toISOString()}&`;
    if (endDateFilter) queryParams += `end_date=${endDateFilter.toISOString()}&`;
    
    try {
      const response = await fetch(`${API_URL}/orders${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure each row has an 'id' field for DataGrid
      setOrders(data.map((order: any, index: number) => ({ ...order, id: order.id ?? index })));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Clear orders on error
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [statusFilter, startDateFilter, endDateFilter]); // Refetch on filter change
  
  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDateFilter(null);
    setEndDateFilter(null);
  };

  // Handle inline status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    console.log(`Updating order ${orderId} to status ${newStatus}`);
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus), // FastAPI expects the status directly in the body for this endpoint
      });
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      // Refetch orders to show the update
      fetchOrders();
      // TODO: Add success notification toast
    } catch (error) {
      console.error('Error updating order status:', error);
      // TODO: Add error notification toast
    }
  };

  // Add Order Modal Handlers
  const handleOpenAddModal = () => setAddModalOpen(true);
  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    // Reset form on close
    setNewOrder({
      customerName: '',
      customerContact: '',
      orderDate: new Date(),
      pickupDate: addDays(new Date(), 1),
      status: 'pending',
      items: [],
      notes: '',
    });
  };

  const handleNewOrderChange = (field: string, value: any) => {
    setNewOrder(prev => ({ ...prev, [field]: value }));
  };

  // TODO: Implement logic to add/edit items within the new order form

  const handleAddNewOrderSubmit = async () => {
    const orderToAdd = {
      ...newOrder,
      orderDate: newOrder.orderDate.toISOString(),
      pickupDate: newOrder.pickupDate.toISOString(),
      items: [], // Sending empty items for now
    };

    console.log("Submitting Order:", orderToAdd);

    try {
      const response = await fetch(`${API_URL}/orders`, { // Assuming POST /orders endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderToAdd),
      });

      if (response.ok) {
        handleCloseAddModal();
        fetchOrders(); // Refresh order list
        // TODO: Add success notification
      } else {
        console.error('Failed to add order:', await response.text());
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error adding order:', error);
       // TODO: Show error message to user
    }
  };

  // Define columns for the DataGrid
  const columns: GridColDef<Order>[] = [
    { 
      field: 'id', 
      headerName: 'Order #', 
      width: 150,
      renderCell: (params: any) => {
        const value = params.value ? String(params.value) : '';
        const display = value ? `${value.substring(0, 8)}...` : '';
        return (
          <Tooltip title={value}>
            <code>{display}</code>
          </Tooltip>
        );
      }
    },
    { field: 'customerName', headerName: 'Customer', width: 150 },
    { 
      field: 'orderDate', 
      headerName: 'Order Date', 
      width: 170,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        try {
          if (typeof params.value !== 'string' || params.value.trim() === '') {
            return 'N/A';
          }
          const date = new Date(params.value);
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
      field: 'pickupDate', 
      headerName: 'Pickup Date', 
      width: 170,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        try {
          if (typeof params.value !== 'string' || params.value.trim() === '') {
            return 'N/A';
          }
          const date = new Date(params.value);
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
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params: GridRenderCellParams<any, Order>) => {
        // Guard against undefined row
        if (!params || !params.row) return null;
        return (
          <Select
            value={params.row.status}
            onChange={(event: SelectChangeEvent) => {
              handleStatusChange(params.row.id, event.target.value as string);
            }}
            size="small"
            sx={{ width: '100%' }}
            variant="outlined"
          >
            {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <MenuItem key={status} value={status}>
                <Chip
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  color={getStatusChipColor(status)}
                  size="small"
                  variant="outlined"
                  sx={{ width: '100%' }}
                />
              </MenuItem>
            ))}
          </Select>
        );
      }
    },
    { 
      field: 'totalTrays', 
      headerName: 'Total Trays', 
      width: 120, 
      align: 'right',
      headerAlign: 'right',
      valueGetter: (params: any) => {
        // Guard against undefined params or row
        if (!params || !params.row || !Array.isArray(params.row.items)) {
          return 0;
        }
        return params.row.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      }
    },
    { 
      field: 'total_price', 
      headerName: 'Total Price', 
      width: 120, 
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : 'N/A'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        // Guard against undefined row
        if (!params || !params.row) return null;
        return (
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => console.log('View Order', params.row.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Order Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer orders, track deliveries, and send notifications
        </Typography>
      </Box>
      
      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
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
                minWidth: '180px' // Ensure enough width for label
              }}
              InputLabelProps={{
                shrink: true // Keep label floated
              }}
            >
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker 
              label="Order Start Date" 
              value={startDateFilter} 
              onChange={setStartDateFilter}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  InputLabelProps: {
                    shrink: true // Keep label floated
                  }
                } 
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker 
              label="Order End Date" 
              value={endDateFilter} 
              onChange={setEndDateFilter}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  InputLabelProps: {
                    shrink: true // Keep label floated
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
              Add New Order
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* DataGrid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={orders}
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
            sorting: {
              sortModel: [{ field: 'orderDate', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>
      
      {/* Add New Order Modal */}
      <Dialog open={addModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
             <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Customer Name"
                  value={newOrder.customerName}
                  onChange={(e) => handleNewOrderChange('customerName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Contact (Email/Phone)"
                  value={newOrder.customerContact}
                  onChange={(e) => handleNewOrderChange('customerContact', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                 <DatePicker
                  label="Order Date"
                  value={newOrder.orderDate}
                  onChange={(date) => handleNewOrderChange('orderDate', date || new Date())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
               <Grid item xs={12} sm={6}>
                 <DatePicker
                  label="Pickup Date"
                  value={newOrder.pickupDate}
                  onChange={(date) => handleNewOrderChange('pickupDate', date || new Date())}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  value={newOrder.status}
                  onChange={(e) => handleNewOrderChange('status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  {/* Add other relevant statuses if needed */}
                </TextField>
              </Grid>
             <Grid item xs={12}>
                {/* Placeholder for adding Order Items */}
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Order Items</Typography>
                <Typography variant="body2" color="text.secondary">
                  (Adding items functionality will be implemented here)
                </Typography>
                {/* TODO: Implement UI for adding/editing OrderItem[] */}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={newOrder.notes}
                  onChange={(e) => handleNewOrderChange('notes', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button 
            onClick={handleAddNewOrderSubmit} 
            variant="contained"
            disabled={!newOrder.customerName || !newOrder.pickupDate} // Basic validation
          >
            Add Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* TODO: Add Modals for View Order Details */}
    </Box>
  );
};

export default Orders; 