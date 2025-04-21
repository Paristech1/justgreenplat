import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SpaIcon from '@mui/icons-material/Spa';

interface SidebarProps {
  open: boolean;
}

const navItems = [
  { name: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { name: 'Crop Planner', icon: <CalendarMonthIcon />, path: '/crop-planner' },
  { name: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { name: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
  { name: 'Forecasting', icon: <TrendingUpIcon />, path: '/forecasting' },
];

const bottomNavItems = [
  { name: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { name: 'Help', icon: <HelpOutlineIcon />, path: '/help' },
];

const Sidebar = ({ open }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const drawerWidth = 240;

  const isActive = (path: string) => location.pathname === path;

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ height: 64 }} />
        
        <Box sx={{ p: 2, pb: 0 }}>
          <Box 
            sx={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 1
            }}
          >
            <SpaIcon 
              color="primary" 
              sx={{ 
                fontSize: 28,
                p: 0.5,
                borderRadius: '50%',
                bgcolor: 'greenLight.main'
              }} 
            />
            <Typography 
              variant="subtitle1" 
              color="text.primary"
            >
              Green Leaf Farms
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Microgreen Production
          </Typography>
        </Box>
        
        <Divider />

        <List sx={{ px: 1 }}>
          {navItems.map((item) => (
            <ListItem 
              key={item.name} 
              disablePadding
              sx={{ mb: 0.5 }}
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'greenLight.main',
                    '&:hover': {
                      bgcolor: 'greenLight.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.dark',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />
        <List sx={{ px: 1 }}>
          {bottomNavItems.map((item) => (
            <ListItem key={item.name} disablePadding>
              <Tooltip title={item.name} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'greenLight.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Microgreen Grower Portal v1.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 