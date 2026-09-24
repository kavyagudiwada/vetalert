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
  InputAdornment,
  Alert,
  Divider,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import PetsIcon from '@mui/icons-material/Pets'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalsApi } from '../../api/endpoints'
import { useGeolocation } from '../../hooks/useGeolocation'
import { SPECIES_LIST } from '../../utils/constants'
import type { Species, Sex } from '../../types'

export default function RegisterAnimal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const geolocation = useGeolocation()

  const [form, setForm] = useState({
    tagId: '',
    name: '',
    species: 'cattle' as Species,
    breed: '',
    sex: 'female' as Sex,
    ageYears: '',
    ageMonths: '',
    weightKg: '',
    ownerName: '',
    village: '',
    block: '',
    district: '',
    state: '',
  })
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.tagId.trim()) newErrors.tagId = t('common.required')
    if (!form.breed.trim()) newErrors.breed = t('common.required')
    if (!form.ageYears || Number(form.ageYears) < 0) {
      newErrors.ageYears = t('common.invalid')
    }
    if (!form.ownerName.trim()) newErrors.ownerName = t('common.required')
    if (!form.village.trim()) newErrors.village = t('common.required')
    if (!form.district.trim()) newErrors.district = t('common.required')
    if (!latitude || !longitude) {
      newErrors.location = t('common.required')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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

  const createMutation = useMutation({
    mutationFn: () =>
      animalsApi.create({
        tag_number: form.tagId.trim(),
        name: form.name.trim() || undefined,
        species: form.species,
        breed: form.breed.trim() || undefined,
        gender: form.sex,
        location: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        },
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      queryClient.invalidateQueries({ queryKey: ['animals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/animals')
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
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PetsIcon />
        </Box>
        <div>
          <Typography variant="h5" fontWeight={700}>
            {t('animals.register')}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {t('animals.registrationNumber')} · PSR
          </Typography>
        </div>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, borderRadius: 3 }}>
        <Typography fontWeight={600} fontSize={14} mb={2}>
          {t('reports.selectAnimal')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('animals.tagId')}
              value={form.tagId}
              onChange={(e) => updateField('tagId', e.target.value)}
              error={Boolean(errors.tagId)}
              helperText={errors.tagId}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`${t('animals.name')} (${t('reports.optional')})`}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('reports.species')}</InputLabel>
              <Select
                value={form.species}
                label={t('reports.species')}
                onChange={(e) => updateField('species', e.target.value)}
              >
                {SPECIES_LIST.map((species) => (
                  <MenuItem key={species} value={species}>
                    {t(`animals.${species}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('animals.breed')}
              value={form.breed}
              onChange={(e) => updateField('breed', e.target.value)}
              error={Boolean(errors.breed)}
              helperText={errors.breed}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('animals.sex')}</InputLabel>
              <Select
                value={form.sex}
                label={t('animals.sex')}
                onChange={(e) => updateField('sex', e.target.value)}
              >
                <MenuItem value="male">{t('animals.male')}</MenuItem>
                <MenuItem value="female">{t('animals.female')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              required
              type="number"
              label={`${t('animals.age')} (y)`}
              value={form.ageYears}
              onChange={(e) => updateField('ageYears', e.target.value)}
              error={Boolean(errors.ageYears)}
              helperText={errors.ageYears}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={`${t('animals.age')} (m)`}
              value={form.ageMonths}
              onChange={(e) => updateField('ageMonths', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={t('animals.weight')}
              value={form.weightKg}
              onChange={(e) => updateField('weightKg', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              required
              label={t('animals.owner')}
              value={form.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              error={Boolean(errors.ownerName)}
              helperText={errors.ownerName}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography fontWeight={600} fontSize={14} mb={1}>
          {t('reports.location')}
        </Typography>
        <Stack direction="row" spacing={1} mb={2}>
          <Button
            size="small"
            startIcon={<MyLocationIcon />}
            onClick={detectLocation}
          >
            {t('reports.autoDetect')}
          </Button>
        </Stack>
        <Grid container spacing={2}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('reports.village')}
              value={form.village}
              onChange={(e) => updateField('village', e.target.value)}
              error={Boolean(errors.village)}
              helperText={errors.village}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('reports.block')}
              value={form.block}
              onChange={(e) => updateField('block', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label={t('reports.district')}
              value={form.district}
              onChange={(e) => updateField('district', e.target.value)}
              error={Boolean(errors.district)}
              helperText={errors.district}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('reports.state')}
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
            />
          </Grid>
        </Grid>

        {geolocation.error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {geolocation.error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={() => navigate('/animals')}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
          >
            {t('common.save')}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}