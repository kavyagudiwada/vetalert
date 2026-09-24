import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Divider,
  Chip,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PetsIcon from '@mui/icons-material/Pets'
import LoginIcon from '@mui/icons-material/Login'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import GoogleSignIn from '../../components/common/GoogleSignIn'

const GOOGLE_ROLES = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'veterinarian', label: 'Veterinarian' },
  { value: 'govt_officer', label: 'Govt Official' },
]

export default function Login() {
  const { t } = useTranslation()
  const { signIn, signInWithGoogle } = useAuth()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleRole, setGoogleRole] = useState('farmer')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!emailOrPhone.trim()) {
      newErrors.email = t('common.required')
    } else if (
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailOrPhone) &&
      !/^[0-9+\s-]{10,15}$/.test(emailOrPhone)
    ) {
      newErrors.email = t('common.invalid')
    }
    if (!password) {
      newErrors.password = t('common.required')
    } else if (password.length < 6) {
      newErrors.password = t('common.invalid')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await signIn(emailOrPhone.trim(), password)
      toast.success(t('auth.loginSuccess'))
    } catch {
      toast.error(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential: string) => {
    setLoading(true)
    try {
      await signInWithGoogle(credential, googleRole)
    } catch {
      // toast handled in hook
    } finally {
      setLoading(false)
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
          'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 460,
          width: '100%',
          borderRadius: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              mx: 'auto',
            }}
          >
            <PetsIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {t('app.name')}
          </Typography>
          <Typography color="text.secondary" fontSize={13} mt={0.5}>
            {t('app.tagline')}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label={t('auth.emailOrPhone')}
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            margin="normal"
            autoComplete="username"
          />
          <TextField
            fullWidth
            label={t('common.password')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password}
            margin="normal"
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 0.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                />
              }
              label={t('auth.rememberMe')}
              sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
            />
            <Typography
              fontSize={13}
              color="primary"
              sx={{ cursor: 'pointer' }}
            >
              {t('auth.forgotPassword')}
            </Typography>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={<LoginIcon />}
            sx={{ mt: 2 }}
          >
            {t('auth.login')}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>or</Divider>

        <Box>
          <Typography fontSize={13} fontWeight={600} mb={1}>
            Sign in with Google — select your role
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {GOOGLE_ROLES.map((role) => (
              <Chip
                key={role.value}
                label={role.label}
                size="small"
                color={googleRole === role.value ? 'primary' : 'default'}
                variant={googleRole === role.value ? 'filled' : 'outlined'}
                onClick={() => setGoogleRole(role.value)}
              />
            ))}
          </Stack>
          <GoogleSignIn onCredential={handleGoogle} />
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center', fontSize: 13 }}>
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            style={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
          >
            {t('auth.register')}
          </Link>
        </Box>
      </Paper>
    </Box>
  )
}