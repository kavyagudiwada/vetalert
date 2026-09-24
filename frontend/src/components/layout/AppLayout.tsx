import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
} from '@mui/material'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar, { NAV_ITEMS } from './Sidebar'
import Header from './Header'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((segment, index) => ({
    label: segment,
    path: `/${segments.slice(0, index + 1).join('/')}`,
  }))
}

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const crumbs = getBreadcrumbs(location.pathname)
  const navMatch = NAV_ITEMS.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== '/' && location.pathname.startsWith(item.path)),
  )

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        role={user?.role}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header onMenuClick={handleMenuClick} />

        <Box
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: 2,
            maxWidth: 1600,
            mx: 'auto',
            width: '100%',
            flex: 1,
          }}
        >
          <Box sx={{ mb: 2, mt: 0.5 }}>
            <Breadcrumbs aria-label="breadcrumb">
              <Link
                component={RouterLink}
                underline="hover"
                color="inherit"
                to="/"
                sx={{ fontSize: 13 }}
              >
                {t('nav.dashboard')}
              </Link>
              {crumbs.map((crumb) => {
                const label = navMatch && navMatch.path === crumb.path
                  ? t(navMatch.label)
                  : decodeURIComponent(crumb.label)
                const isLast =
                  crumb.path.replace(/\/$/, '') ===
                  location.pathname.replace(/\/$/, '')
                return isLast ? (
                  <Typography key={crumb.path} fontSize={13} color="text.primary">
                    {label}
                  </Typography>
                ) : (
                  <Link
                    key={crumb.path}
                    component={RouterLink}
                    underline="hover"
                    color="inherit"
                    to={crumb.path}
                    sx={{ fontSize: 13 }}
                  >
                    {label}
                  </Link>
                )
              })}
            </Breadcrumbs>
          </Box>

          <Outlet />
        </Box>

        <Box
          component="footer"
          sx={{
            py: 2,
            px: 3,
            textAlign: 'center',
            fontSize: 12,
            color: 'text.secondary',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          © 2026 {t('app.name')} — {t('app.tagline')}
        </Box>
      </Box>
    </Box>
  )
}