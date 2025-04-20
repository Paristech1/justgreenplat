import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Box, 
  Menu, 
  MenuItem, 
  Tooltip,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SpaIcon from '@mui/icons-material/Spa';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <SpaIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, fontSize: 30 }} />
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          Microgreen Grower Portal
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationMenu}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="notification-menu"
            anchorEl={notificationAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
          >
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2">Sunflower trays ready for harvest</Typography>
            </MenuItem>
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2">Low inventory alert: Pea Shoots</Typography>
            </MenuItem>
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2">New order from Restaurant ABC</Typography>
            </MenuItem>
          </Menu>

          <Tooltip title="Account settings">
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'white' }}>
                <AccountCircleIcon sx={{ color: 'primary.main' }} />
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 