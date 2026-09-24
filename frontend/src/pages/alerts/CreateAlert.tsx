import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Chip,
  InputAdornment,
  Divider,
  Alert,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import LockIcon from '@mui/icons-material/Lock'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../../api/endpoints'
import { useGeolocation } from '../../hooks/useGeolocation'
import { SEVERITY_LEVELS, ROLES } from '../../utils/constants'
import type { SeverityLevel, UserRole } from '../../types'

export default function CreateAlert() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const geolocation = useGeolocation()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<SeverityLevel>('medium')
  const [affectedArea, setAffectedArea] = useState('')
  const [radiusKm, setRadiusKm] = useState('5')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [broadcastTo, setBroadcastTo] = useState<UserRole[]>([
    'farmer',
    'veterinarian',
  ])
  const [expiresInDays, setExpiresInDays] = useState('7')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const detectLocation = async () => {
    try {
      const loc = await geolocation.requestLocation()
      setLatitude(loc.latitude.toFixed(6))
      setLongitude(loc.longitude.toFixed(6))
      toast.success(t('reports.autoDetect'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const toggleRole = (role: UserRole) => {
    if (broadcastTo.includes(role)) {
      setBroadcastTo(broadcastTo.filter((r) => r !== role))
    } else {
      setBroadcastTo([...broadcastTo, role])
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = t('common.required')
    if (!message.trim()) newErrors.message = t('common.required')
    if (!affectedArea.trim()) newErrors.affectedArea = t('common.required')
    if (!radiusKm || Number(radiusKm) <= 0) newErrors.radiusKm = t('common.invalid')
    if (!latitude || !longitude) newErrors.location = t('common.required')
    if (broadcastTo.length === 0) newErrors.broadcastTo = t('common.required')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createMutation = useMutation({
    mutationFn: () =>
      alertsApi.create({
        title: title.trim(),
        message: message.trim(),
        severity,
        affectedArea: affectedArea.trim(),
        radiusKm: Number(radiusKm),
        location: {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        broadcastTo,
        createdBy: 'current-user',
        expiresAt: new Date(
          Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      navigate('/alerts')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    createMutation.mutate()
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NotificationsActiveIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('alerts.createAlert')}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {t('alerts.sendAlert')} · {t('common.role')}: {t('auth.governmentOfficial')}
          </Typography>
        </Box>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} mb={1}>
          <Chip
            icon={<LockIcon />}
            label={t('alerts.officials')}
            color="error"
            size="small"
            variant="outlined"
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label={t('alerts.alertTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              minRows={3}
              label={t('alerts.message')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={Boolean(errors.message)}
              helperText={errors.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('alerts.severity')}</InputLabel>
              <Select
                value={severity}
                label={t('alerts.severity')}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              >
                {SEVERITY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {t(`status.${level}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label={t('alerts.radius')}
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              error={Boolean(errors.radiusKm)}
              helperText={errors.radiusKm}
              InputProps={{
                endAdornment: <InputAdornment position="end">km</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label={t('alerts.affectedArea')}
              value={affectedArea}
              onChange={(e) => setAffectedArea(e.target.value)}
              error={Boolean(errors.affectedArea)}
              helperText={errors.affectedArea}
            />
          </Grid>

          <Divider sx={{ my: 1, gridColumn: '1 / -1' }} />

          <Grid item xs={12}>
            <Typography fontSize={13} fontWeight={600} mb={0.5}>
              {t('reports.location')}
            </Typography>
            <Button
              size="small"
              startIcon={<MyLocationIcon />}
              onClick={detectLocation}
              sx={{ mb: 1 }}
            >
              {t('reports.autoDetect')}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              error={Boolean(errors.location)}
              helperText={errors.location}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              error={Boolean(errors.location)}
              helperText={errors.location}
            />
          </Grid>

          <Divider sx={{ my: 1, gridColumn: '1 / -1' }} />

          <Grid item xs={12}>
            <Typography fontSize={13} fontWeight={600} mb={1}>
              {t('alerts.broadcastTo')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {ROLES.map((role) => (
                <Chip
                  key={role.value}
                  label={t(`auth.${role.label}`)}
                  color={broadcastTo.includes(role.value as UserRole) ? 'primary' : 'default'}
                  variant={
                    broadcastTo.includes(role.value as UserRole) ? 'filled' : 'outlined'
                  }
                  onClick={() => toggleRole(role.value as UserRole)}
                />
              ))}
            </Stack>
            {errors.broadcastTo && (
              <Typography fontSize={12} color="error" mt={0.5}>
                {errors.broadcastTo}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={t('common.date')}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">days</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {geolocation.error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {geolocation.error}
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1}
          sx={{ mt: 3 }}
        >
          <Button onClick={() => navigate('/alerts')}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={createMutation.isPending}
          >
            {t('alerts.sendAlert')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}