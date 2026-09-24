import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  InputBase,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import LanguageIcon from '@mui/icons-material/Language'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import CheckIcon from '@mui/icons-material/Check'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { LANGUAGES } from '../../utils/constants'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const {
    language,
    setLanguage,
    theme: themeMode,
    toggleTheme,
    notifications,
    markNotificationRead,
    clearNotifications,
  } = useAppStore()
  const { user, logout } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null)
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/reports?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    setProfileAnchor(null)
    navigate('/login')
  }

  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flex: 1,
            maxWidth: 420,
            ml: 1,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            px: 1.5,
            alignItems: 'center',
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, fontSize: 14 }}
          />
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'flex', sm: 'none' } }} />

        <Tooltip title={t('settings.language')}>
          <IconButton
            color="inherit"
            onClick={(e) => setLangAnchor(e.currentTarget)}
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>

        <IconButton color="inherit" onClick={toggleTheme}>
          {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>

        <Tooltip title={t('dashboard.recentAlerts')}>
          <IconButton
            color="inherit"
            onClick={(e) => setNotifAnchor(e.currentTarget)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={t('settings.profile')}>
          <IconButton
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{ ml: 0.5 }}
          >
            <Avatar
              sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}
            >
              {initials || <PersonIcon fontSize="small" />}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={language === lang.code}
            onClick={() => {
              setLanguage(lang.code)
              setLangAnchor(null)
            }}
          >
            <ListItemIcon sx={{ fontSize: 18 }}>{lang.flag}</ListItemIcon>
            <ListItemText>{t(`settings.${lang.label}`)}</ListItemText>
            {language === lang.code && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { width: 340, maxHeight: 420 } }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={600} fontSize={14}>
            {t('dashboard.recentAlerts')}
          </Typography>
          {notifications.length > 0 && (
            <Typography
              fontSize={12}
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={clearNotifications}
            >
              Clear all
            </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>
            {t('common.noData')}
          </Box>
        ) : (
          notifications.slice(0, 20).map((notification) => (
            <MenuItem
              key={notification.id}
              sx={{ whiteSpace: 'normal', py: 1.5 }}
              onClick={() => markNotificationRead(notification.id)}
            >
              <Box sx={{ width: '100%' }}>
                <Typography fontSize={13}>{notification.message}</Typography>
                <Typography fontSize={11} color="text.secondary">
                  {new Date(notification.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
      >
        <Box sx={{ px: 2, py: 1.5, minWidth: 200 }}>
          <Typography fontWeight={600} fontSize={14}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {user?.email}
          </Typography>
          <Typography fontSize={12} color="primary" sx={{ textTransform: 'capitalize' }}>
            {user?.role?.replace('_', ' ')}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setProfileAnchor(null)
            navigate('/settings')
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('nav.settings')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  )
}