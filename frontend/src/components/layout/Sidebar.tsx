import { useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTheme, useMediaQuery, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import { useTranslation } from 'react-i18next'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PetsIcon from '@mui/icons-material/Pets'
import BiotechIcon from '@mui/icons-material/Biotech'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import ScienceIcon from '@mui/icons-material/Science'
import SettingsIcon from '@mui/icons-material/Settings'
import PublicIcon from '@mui/icons-material/Public'
import WbCloudyIcon from '@mui/icons-material/WbCloudy'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import type { ReactNode } from 'react'
import type { UserRole } from '../../types'

export interface NavItem {
  label: string
  path: string
  icon: ReactNode
  roles?: UserRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'nav.dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'nav.reports', path: '/reports', icon: <AssignmentIcon /> },
  { label: 'nav.animals', path: '/animals', icon: <PetsIcon /> },
  { label: 'nav.diseases', path: '/diseases', icon: <BiotechIcon /> },
  { label: 'nav.alerts', path: '/alerts', icon: <NotificationsActiveIcon /> },
  {
    label: 'nav.vaccinations',
    path: '/vaccinations',
    icon: <VaccinesIcon />,
    roles: ['veterinarian', 'government_official', 'hospital_admin'],
  },
  {
    label: 'nav.labs',
    path: '/labs',
    icon: <ScienceIcon />,
    roles: ['veterinarian', 'government_official', 'hospital_admin'],
  },
  {
    label: 'nav.outbreaks',
    path: '/outbreaks',
    icon: <PublicIcon />,
    roles: ['veterinarian', 'government_official', 'hospital_admin'],
  },
  {
    label: 'nav.weather',
    path: '/weather',
    icon: <WbCloudyIcon />,
  },
  {
    label: 'nav.settings',
    path: '/settings',
    icon: <SettingsIcon />,
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  role?: UserRole
}

export default function Sidebar({ open, onClose, role }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const items = useMemo(() => {
    if (!role) return NAV_ITEMS
    return NAV_ITEMS.filter(
      (item) => !item.roles || item.roles.includes(role),
    )
  }, [role])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        py: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          mb: 3,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            mr: open ? 1.5 : 0,
            flexShrink: 0,
          }}
        >
          <PetsIcon />
        </Box>
        {open && (
          <Box>
            <Box sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              {t('app.name')}
            </Box>
            <Box
              sx={{
                fontSize: 11,
                color: 'text.secondary',
                lineHeight: 1.2,
              }}
            >
              {t('app.tagline')}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const active = isActive(item.path)
          const link = (
            <Link
              to={item.path}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemButton
                selected={active}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  justifyContent: open ? 'flex-start' : 'center',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={t(item.label)}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
                  />
                )}
              </ListItemButton>
            </Link>
          )
          return !open ? (
            <Tooltip key={item.path} title={t(item.label)} placement="right">
              {link}
            </Tooltip>
          ) : (
            <div key={item.path}>{link}</div>
          )
        })}
      </Box>

      <Box sx={{ px: 2, pt: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            display: open ? 'block' : 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: 13,
              fontWeight: 600,
              color: 'warning.main',
              mb: 0.5,
            }}
          >
            <ReportProblemIcon fontSize="small" />
            Emergency Helpline
          </Box>
          <Box sx={{ fontSize: 14, fontWeight: 700 }}>1962</Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{
        width: open ? 260 : 72,
        flexShrink: 0,
        transition: (theme) =>
          theme.transitions.create('width', {
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      {!isDesktop && open ? (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1200,
          }}
          onClick={onClose}
        />
      ) : null}
      <Box
        sx={{
          width: open ? 260 : 72,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          position: isDesktop ? 'sticky' : 'fixed',
          top: 0,
          height: '100vh',
          zIndex: 1201,
          transition: (theme) =>
            theme.transitions.create('width', {
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {content}
      </Box>
    </Box>
  )
}