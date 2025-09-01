import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Flight as FlightIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { AlertSeverity, AlertType } from '../../types/app.types';

interface AddAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAlert: (alert: any) => void;
}

export default function AddAlertDialog({ open, onClose, onAddAlert }: AddAlertDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.MEDIUM);
  const [type, setType] = useState<AlertType>(AlertType.SYSTEM_ERROR);
  const [aircraftId, setAircraftId] = useState('');
  const [airport, setAirport] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      return;
    }

    const newAlert = {
      id: `user_${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      severity,
      type,
      timestamp: scheduledTime ? new Date(scheduledTime) : new Date(),
      acknowledged: false,
      aircraftId: aircraftId.trim() || undefined,
      airport: airport.trim() || undefined,
      isUserCreated: true,
      isRecurring,
      tags,
      notes: notes.trim() || undefined,
      createdBy: 'user',
      createdAt: new Date()
    };

    onAddAlert(newAlert);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTitle('');
    setMessage('');
    setSeverity(AlertSeverity.MEDIUM);
    setType(AlertType.SYSTEM_ERROR);
    setAircraftId('');
    setAirport('');
    setScheduledTime('');
    setIsRecurring(false);
    setTags([]);
    setNewTag('');
    setNotes('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getSeverityIcon = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertTypeLabel = (alertType: AlertType): string => {
    switch (alertType) {
      case AlertType.COLLISION_WARNING:
        return 'Advertencia de Colisión';
      case AlertType.PROXIMITY_ALERT:
        return 'Alerta de Proximidad';
      case AlertType.ALTITUDE_DEVIATION:
        return 'Desviación de Altitud';
      case AlertType.COURSE_DEVIATION:
        return 'Desviación de Rumbo';
      case AlertType.WEATHER_WARNING:
        return 'Advertencia Meteorológica';
      case AlertType.AIRSPACE_VIOLATION:
        return 'Violación de Espacio Aéreo';
      case AlertType.SYSTEM_ERROR:
        return 'Recordatorio Personal';
      case AlertType.DATA_LOSS:
        return 'Nota de Vuelo';
      default:
        return 'Alerta Personalizada';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6">Create Custom Alert</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              📝 Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Alert Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Check fuel before takeoff"
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                label="Severity"
                >
                <MenuItem value={AlertSeverity.LOW}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSeverityIcon(AlertSeverity.LOW)}
                    Low
                  </Box>
                </MenuItem>
                <MenuItem value={AlertSeverity.MEDIUM}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSeverityIcon(AlertSeverity.MEDIUM)}
                    Medium
                  </Box>
                </MenuItem>
                <MenuItem value={AlertSeverity.HIGH}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSeverityIcon(AlertSeverity.HIGH)}
                    High
                  </Box>
                </MenuItem>
                <MenuItem value={AlertSeverity.CRITICAL}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSeverityIcon(AlertSeverity.CRITICAL)}
                    Critical
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Alert Description"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe in detail what you need to remember during the flight..."
              required
            />
          </Grid>

          {/* Flight details */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✈️ Flight Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as AlertType)}
                label="Category"
              >
                <MenuItem value={AlertType.SYSTEM_ERROR}>Personal Reminder</MenuItem>
                <MenuItem value={AlertType.DATA_LOSS}>Flight Note</MenuItem>
                <MenuItem value={AlertType.WEATHER_WARNING}>Weather Warning</MenuItem>
                <MenuItem value={AlertType.AIRSPACE_VIOLATION}>Airspace</MenuItem>
                <MenuItem value={AlertType.ALTITUDE_DEVIATION}>Altitude</MenuItem>
                <MenuItem value={AlertType.COURSE_DEVIATION}>Navigation</MenuItem>
                <MenuItem value={AlertType.PROXIMITY_ALERT}>Proximity</MenuItem>
                <MenuItem value={AlertType.COLLISION_WARNING}>Safety</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Aircraft (Optional)"
              value={aircraftId}
              onChange={(e) => setAircraftId(e.target.value)}
              placeholder="Ex: N123AB, EC-ABC"
              InputProps={{
                startAdornment: <FlightIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Airport (Optional)"
              value={airport}
              onChange={(e) => setAirport(e.target.value)}
              placeholder="Ex: KJFK, LEMD, EGLL"
            />
          </Grid>

          {/* Scheduling */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              ⏰ Scheduling
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Date and Time (Optional)"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              helperText="Leave empty for immediate alert"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="Recurring Alert"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Will repeat in future flights
            </Typography>
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🏷️ Tags
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="New tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Ex: preflight, fuel, weather"
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Additional notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Additional Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information you consider important..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleReset} color="inherit">
          Clear
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!title.trim() || !message.trim()}
          startIcon={<AddIcon />}
        >
          Create Alert
        </Button>
      </DialogActions>
    </Dialog>
  );
}