// @ts-nocheck
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
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

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
  orderDate: string;
  pickupDate: string;
  status: string;
  items: OrderItem[];
  total_price?: number;
}

// Helper to get chip color based on status
const getStatusChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'pending': return 'warning';
    case 'confirmed': return 'default';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [pickupStartFilter, setPickupStartFilter] = useState<Date | null>(null);
  const [pickupEndFilter, setPickupEndFilter] = useState<Date | null>(null);
  
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

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch orders data based on filters
  const fetchOrders = async () => {
    setLoading(true);
    let queryParams = '?';
    if (statusFilter) queryParams += `status=${statusFilter}&`;
    if (startDateFilter) queryParams += `start_date=${startDateFilter.toISOString()}&`;
    if (endDateFilter) queryParams += `end_date=${endDateFilter.toISOString()}&`;
    if (pickupStartFilter) queryParams += `pickup_start_date=${pickupStartFilter.toISOString()}&`;
    if (pickupEndFilter) queryParams += `pickup_end_date=${pickupEndFilter.toISOString()}&`;
    
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
  }, [statusFilter, startDateFilter, endDateFilter, pickupStartFilter, pickupEndFilter]); // Refetch on filter change
  
  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setPickupStartFilter(null);
    setPickupEndFilter(null);
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
        body: JSON.stringify({ status: newStatus }), // Send status field as JSON
      });
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      // Refetch orders to show the update
      fetchOrders();
      setSuccessMsg(`Order status updated to '${newStatus}'.`);
    } catch (error) {
      console.error('Error updating order status:', error);
      setErrorMsg('Failed to update order status. Please try again.');
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

  // Edit modal handlers
  const handleEditOpen = (order: Order) => {
    setEditOrder(order);
    setEditModalOpen(true);
  };
  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditOrder(null);
  };
  const handleEditSave = async () => {
    if (editOrder) {
      await handleStatusChange(editOrder.id, editOrder.status);
      handleEditClose();
    }
  };

  // Define columns for the DataGrid
  const columns: GridColDef<Order>[] = [
    { field: 'id', headerName: 'Order #', flex: 1, minWidth: 150 },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 150 },
    { field: 'orderDate', headerName: 'Order Date', flex: 1, minWidth: 170, valueFormatter: params => {
      try {
        const d = new Date(params.value as string);
        return isNaN(d.getTime()) ? 'Invalid' : format(d, 'MMM dd, yyyy HH:mm');
      } catch {
        return 'Error';
      }
    } },
    { field: 'pickupDate', headerName: 'Pickup Date', flex: 1, minWidth: 170, valueFormatter: params => {
      try {
        const d = new Date(params.value as string);
        return isNaN(d.getTime()) ? 'Invalid' : format(d, 'MMM dd, yyyy HH:mm');
      } catch {
        return 'Error';
      }
    } },
    {
      field: 'status', headerName: 'Status', width: 150, renderCell: (params: GridRenderCellParams<any, Order>) => (
        <Chip
          label={params.row.status}
          color={getStatusChipColor(params.row.status)}
          size="small"
        />
      )
    },
    { field: 'total_price', headerName: 'Total', type: 'number', flex: 1, minWidth: 100 },
    { field: 'actions', headerName: 'Actions', width: 120, renderCell: (params) => (
      <Box>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => console.log('View', params.row.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEditOpen(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ) }
  ];

  return (
    <>
      {/* Notification Snackbars */}
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)}>
        <Alert onClose={() => setSuccessMsg(null)} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
      <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg(null)}>
        <Alert onClose={() => setErrorMsg(null)} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
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
        <Box component="div" sx={{ p: 2, mb: 3 }}>
          <Box component="div" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexBasis: { xs: '100%', sm: '50%', md: '33.33%' } }}>
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
            </Box>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexBasis: { xs: '100%', sm: '50%', md: '33.33%' } }}>
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
            </Box>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexBasis: { xs: '100%', sm: '50%', md: '33.33%' } }}>
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
            </Box>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexBasis: { xs: '100%', sm: '50%', md: '33.33%' } }}>
              <DatePicker
                label="Pickup Start"
                value={pickupStartFilter}
                onChange={setPickupStartFilter}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
            </Box>
            <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexBasis: { xs: '100%', sm: '50%', md: '33.33%' } }}>
              <DatePicker
                label="Pickup End"
                value={pickupEndFilter}
                onChange={setPickupEndFilter}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
            </Box>
            <Box component="div" sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 1, mt: 1 }}>
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
            </Box>
          </Box>
        </Box>
        
        {/* DataGrid - wider container to reduce horizontal scroll pain */}
        <Paper sx={{ height: 600, width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1200 }}>
            <DataGrid
              rows={orders}
              columns={columns}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } }, sorting: { sortModel: [{ field: 'orderDate', sort: 'desc' }] } }}
              pageSizeOptions={[10,25,50]}
              checkboxSelection
              disableRowSelectionOnClick
            />
          </Box>
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

        {/* Edit Order Modal */}
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Order Status</DialogTitle>
          <DialogContent>
            <Select
              value={editOrder?.status || ''}
              onChange={(e) => setEditOrder(prev => prev ? { ...prev, status: e.target.value } : prev)}
              fullWidth
              sx={{ mt: 2 }}
            >
              {['pending','confirmed','completed','cancelled'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* TODO: Add Modals for View Order Details */}
      </Box>
    </>
  );
};

export default Orders; 