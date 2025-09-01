import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

export default function DonateButton() {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const paypalEmail = 'd.jhosep360@mail.ru';

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(paypalEmail);
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handlePayPalDonate = () => {
    // Open PayPal direct payment link
    const paypalUrl = 'https://www.paypal.com/ncp/payment/HRMCEX2BXMJ8G';
    window.open(paypalUrl, '_blank');
  };

  return (
    <>
      {/* Floating Donate Button */}
      <Tooltip title="Support AeroSynapse Development" placement="left">
        <Fab
          color="secondary"
          variant="extended"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            px: 3,
            '&:hover': {
              background: 'linear-gradient(45deg, #FF5252, #FF7979)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'
          }}
        >
          <HeartIcon sx={{ mr: 1 }} />
          DONATE
        </Fab>
      </Tooltip>

      {/* Donation Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              💝 Support AeroSynapse
            </Typography>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ color: 'white', textAlign: 'center', py: 3 }}>
          <Typography variant="h6" gutterBottom>
            Help keep AeroSynapse free and awesome! ✈️
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Your $7 donation helps cover server costs and keeps this flight tracking tool running smoothly for everyone.
          </Typography>



          <Typography variant="body2" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
            Every contribution, no matter how small, makes a huge difference! 🙏
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handlePayPalDonate}
            sx={{
              background: 'linear-gradient(45deg, #FFC107, #FF9800)',
              color: 'white',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #FFB300, #F57C00)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(255, 193, 7, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            💳 DONATE $7 VIA PAYPAL
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
        >
          Email copied to clipboard! 📋
        </Alert>
      </Snackbar>
    </>
  );
}