import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Chip,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PetsIcon from '@mui/icons-material/Pets'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { SPECIES_LIST, ROLES } from '../../utils/constants'
import type { UserRole, Species } from '../../types'

const STEPS = [
  'auth.personalInfo',
  'auth.roleSelection',
  'auth.locationInfo',
  'auth.livestockInfo',
]

export default function Register() {
  const { t } = useTranslation()
  const { signUp } = useAuth()

  const [activeStep, setActiveStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer' as UserRole,
    village: '',
    block: '',
    district: '',
    state: '',
    species: [] as Species[],
    cattleCount: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (step === 0) {
      if (!form.firstName.trim()) newErrors.firstName = t('common.required')
      if (!form.lastName.trim()) newErrors.lastName = t('common.required')
      if (!form.email.trim()) {
        newErrors.email = t('common.required')
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
        newErrors.email = t('common.invalid')
      }
      if (!form.phone.trim()) {
        newErrors.phone = t('common.required')
      } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
        newErrors.phone = t('common.invalid')
      }
      if (!form.password) {
        newErrors.password = t('common.required')
      } else if (form.password.length < 6) {
        newErrors.password = t('common.invalid')
      }
      if (form.confirmPassword !== form.password) {
        newErrors.confirmPassword = t('auth.passwordMismatch')
      }
    }
    if (step === 1 && !form.role) {
      newErrors.role = t('common.required')
    }
    if (step === 2) {
      if (!form.village.trim()) newErrors.village = t('common.required')
      if (!form.block.trim()) newErrors.block = t('common.required')
      if (!form.district.trim()) newErrors.district = t('common.required')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(activeStep)) return
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return
    setLoading(true)
    try {
      await signUp({
        ...form,
        species: form.species,
        livestockCount: form.cattleCount ? Number(form.cattleCount) : 0,
      })
      toast.success(t('auth.registerSuccess'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const toggleSpecies = (species: Species) => {
    if (form.species.includes(species)) {
      updateField(
        'species',
        form.species.filter((s) => s !== species),
      )
    } else {
      updateField('species', [...form.species, species])
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          'linear-gradient(135deg, #10b981 0%, #4f46e5 50%, #7c3aed 100%)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 2.5, sm: 4 },
          maxWidth: 560,
          width: '100%',
          borderRadius: 4,
          my: { xs: 4, sm: 8 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1,
            }}
          >
            <PetsIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {t('auth.register')}
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { fontSize: 11 },
                }}
              >
                {t(label)}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.firstName')}
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.lastName')}
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('common.email')}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('common.phone')}
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('common.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('auth.confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography fontSize={14} mb={1}>
                {t('auth.role')}
              </Typography>
              <RadioGroup
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
              >
                {ROLES.map((role) => (
                  <FormControlLabel
                    key={role.value}
                    value={role.value}
                    control={<Radio />}
                    label={t(`auth.${role.label}`)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      px: 1,
                      width: '100%',
                      '&:has(input:checked)': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(99,102,241,0.06)',
                      },
                    }}
                  />
                ))}
              </RadioGroup>
              {errors.role && (
                <Typography fontSize={12} color="error">
                  {errors.role}
                </Typography>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('reports.village')}
                  value={form.village}
                  onChange={(e) => updateField('village', e.target.value)}
                  error={Boolean(errors.village)}
                  helperText={errors.village}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('reports.block')}
                  value={form.block}
                  onChange={(e) => updateField('block', e.target.value)}
                  error={Boolean(errors.block)}
                  helperText={errors.block}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('reports.district')}
                  value={form.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  error={Boolean(errors.district)}
                  helperText={errors.district}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('reports.state')}
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography fontSize={14} mb={1}>
                Livestock owned (species)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                {SPECIES_LIST.map((species) => (
                  <Chip
                    key={species}
                    label={t(`animals.${species}`)}
                    color={form.species.includes(species) ? 'primary' : 'default'}
                    variant={form.species.includes(species) ? 'filled' : 'outlined'}
                    onClick={() => toggleSpecies(species)}
                  />
                ))}
              </Stack>
              <TextField
                fullWidth
                label={t('dashboard.totalAnimals')}
                type="number"
                value={form.cattleCount}
                onChange={(e) => updateField('cattleCount', e.target.value)}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
            >
              {t('common.back')}
            </Button>
            {activeStep === STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {t('auth.createAccount')}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                {t('common.next')}
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center', fontSize: 13 }}>
          {t('auth.haveAccount')}{' '}
          <Link
            to="/login"
            style={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
          >
            {t('auth.login')}
          </Link>
        </Box>
      </Paper>
    </Box>
  )
}