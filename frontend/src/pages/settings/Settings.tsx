import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Chip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import PersonIcon from '@mui/icons-material/Person'
import LanguageIcon from '@mui/icons-material/Language'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PaletteIcon from '@mui/icons-material/Palette'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { LANGUAGES } from '../../utils/constants'

export default function Settings() {
  const { t } = useTranslation()
  const { user, setUser } = useAuthStore()
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    notifications,
    clearNotifications,
  } = useAppStore()

  const [tab, setTab] = useState(0)
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    village: user?.village ?? '',
    block: user?.block ?? '',
    district: user?.district ?? '',
    state: user?.state ?? '',
  })
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    sms: false,
    alerts: true,
    reportUpdates: true,
    vaccinationReminders: true,
  })

  const saveProfile = () => {
    setUser({ ...user!, ...profile })
    toast.success(t('common.saved'))
  }

  const initials =
    `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        {t('nav.settings')}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab icon={<PersonIcon />} label={t('settings.profile')} iconPosition="start" />
        <Tab icon={<LanguageIcon />} label={t('settings.language')} iconPosition="start" />
        <Tab icon={<NotificationsIcon />} label={t('settings.notifications')} iconPosition="start" />
        <Tab icon={<PaletteIcon />} label={t('settings.theme')} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <Avatar
                sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28 }}
              >
                {initials || <PersonIcon sx={{ fontSize: 36 }} />}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize={18}>
                  {profile.firstName} {profile.lastName}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  {profile.email} · {t(`auth.${user?.role ?? 'farmer'}`)}
                </Typography>
                <Chip
                  size="small"
                  label={`@${user?.role?.replace('_', '-') ?? 'farmer'}`}
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.firstName')}
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.lastName')}
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('common.email')}
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('common.phone')}
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('reports.village')}
                  value={profile.village}
                  onChange={(e) =>
                    setProfile({ ...profile, village: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('reports.block')}
                  value={profile.block}
                  onChange={(e) =>
                    setProfile({ ...profile, block: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('reports.district')}
                  value={profile.district}
                  onChange={(e) =>
                    setProfile({ ...profile, district: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('reports.state')}
                  value={profile.state}
                  onChange={(e) =>
                    setProfile({ ...profile, state: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" onClick={saveProfile}>
                {t('settings.updateProfile')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontWeight={600} fontSize={15} mb={2}>
              {t('settings.language')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {LANGUAGES.map((lang) => (
                <Chip
                  key={lang.code}
                  avatar={<Box component="span" sx={{ fontSize: 16 }}>{lang.flag}</Box>}
                  label={t(`settings.${lang.label}`)}
                  color={language === lang.code ? 'primary' : 'default'}
                  variant={language === lang.code ? 'filled' : 'outlined'}
                  onClick={() => setLanguage(lang.code)}
                  sx={{ px: 1, py: 2.5, fontSize: 14 }}
                />
              ))}
            </Stack>
            <Typography fontSize={13} color="text.secondary" mt={2}>
              {t('settings.savedSuccess')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography fontWeight={600} fontSize={15}>
                {t('settings.notifications')}
              </Typography>
              {notifications.length > 0 && (
                <Button size="small" onClick={clearNotifications}>
                  Clear ({notifications.length})
                </Button>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            {[
              { key: 'email' as const, label: t('settings.emailNotifications') },
              { key: 'push' as const, label: t('settings.pushNotifications') },
              { key: 'sms' as const, label: t('settings.smsNotifications') },
              { key: 'alerts' as const, label: t('settings.alertNotifications') },
              { key: 'reportUpdates' as const, label: t('settings.reportUpdates') },
              {
                key: 'vaccinationReminders' as const,
                label: t('settings.vaccinationReminders'),
              },
            ].map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Switch
                    checked={prefs[item.key]}
                    onChange={() => togglePref(item.key)}
                  />
                }
                label={item.label}
                sx={{
                  justifyContent: 'space-between',
                  width: '100%',
                  py: 0.5,
                  '& .MuiFormControlLabel-label': { fontSize: 14 },
                }}
              />
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => toast.success(t('common.saved'))}
              >
                {t('common.save')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontWeight={600} fontSize={15} mb={2}>
              {t('settings.theme')}
            </Typography>
            <Stack direction="row" spacing={2}>
              {(['light', 'dark'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={theme === mode ? 'contained' : 'outlined'}
                  onClick={() => setTheme(mode)}
                  sx={{ minWidth: 120, py: 1.5 }}
                >
                  {mode === 'light' ? '☀️' : '🌙'}{' '}
                  {t(`settings.${mode}`)}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}