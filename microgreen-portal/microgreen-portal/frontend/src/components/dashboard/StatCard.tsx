import { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, useTheme } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  isLoading = false,
  color = 'primary',
  onClick,
}: StatCardProps) => {
  const theme = useTheme();
  
  const iconBgColors = {
    primary: 'rgba(76, 175, 80, 0.1)',  // primary green
    secondary: 'rgba(139, 195, 74, 0.1)', // secondary green
    success: 'rgba(67, 160, 71, 0.1)',
    warning: 'rgba(255, 160, 0, 0.1)',
    error: 'rgba(229, 57, 53, 0.1)',
    info: 'rgba(41, 182, 246, 0.1)',
  };
  
  const iconColor = theme.palette[color].main;
  const iconBgColor = iconBgColors[color];
  
  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
        } : {},
      }}
    >
      <CardContent sx={{ height: '100%', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            {isLoading ? (
              <Skeleton variant="text" width={100} height={40} />
            ) : (
              <Typography variant="h4" color="text.primary" fontWeight="bold">
                {value}
              </Typography>
            )}
            
            {trend && !isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  vs last week
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1.5,
              bgcolor: iconBgColor,
              borderRadius: '12px',
              color: iconColor,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard; 