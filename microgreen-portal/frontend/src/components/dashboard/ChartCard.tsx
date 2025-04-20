import { ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Divider,
  Box,
  Skeleton,
  IconButton
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  chart: ReactNode;
  isLoading?: boolean;
  height?: number | string;
  action?: ReactNode;
  footer?: ReactNode;
}

const ChartCard = ({ 
  title, 
  subtitle, 
  chart, 
  isLoading = false,
  height = 320,
  action,
  footer
}: ChartCardProps) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
        }
        subheader={
          subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )
        }
        action={
          action || (
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          )
        }
        sx={{ pb: 0 }}
      />
      
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          pt: 2,
          px: 2,
          pb: footer ? 0 : 2
        }}
      >
        {isLoading ? (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={height} 
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ) : (
          <Box sx={{ height, width: '100%' }}>
            {chart}
          </Box>
        )}
      </CardContent>
      
      {footer && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            {footer}
          </Box>
        </>
      )}
    </Card>
  );
};

export default ChartCard; 