import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import PetsIcon from '@mui/icons-material/Pets'
import AssignmentIcon from '@mui/icons-material/Assignment'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AddIcon from '@mui/icons-material/Add'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import { animalsApi, symptomReportsApi, alertsApi } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { formatNumber, timeAgo, getSeverityColor } from '../../utils/helpers'
import StatusBadge from '../../components/common/StatusBadge'
import type { Alert } from '../../types'

function StatCard({
  label,
  value,
  icon,
  color,
  to,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  to: string
}) {
  const navigate = useNavigate()
  return (
    <Card
      onClick={() => navigate(to)}
      sx={{
        borderRadius: 3,
        cursor: 'pointer',
        height: '100%',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography fontSize={13} color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            <Typography fontSize={28} fontWeight={700} mt={0.5}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}18`,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function FarmerDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const { data: animals } = useQuery({
    queryKey: ['farmer', 'animals'],
    queryFn: async () => (await animalsApi.list({ pageSize: 20 })).data,
  })

  const { data: reports } = useQuery({
    queryKey: ['farmer', 'reports'],
    queryFn: async () => (await symptomReportsApi.list({ pageSize: 10 })).data,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['farmer', 'alerts'],
    queryFn: async () => (await alertsApi.list({ pageSize: 5 })).data,
  })

  const recentAlerts: Alert[] = alertsData?.items ?? []
  const activeAlerts = recentAlerts.filter((a) => a.status === 'active').length

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('dashboard.welcome')} {user?.firstName} 👋
          </Typography>
          <Typography fontSize={13} color="text.secondary" mt={0.5}>
            {user?.village || user?.district || 'Farmer'} — Farmer
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" startIcon={<AddIcon fontSize="small" />} href="/animals/new">
            Register Animal
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReportProblemIcon fontSize="small" />}
            href="/reports/new"
          >
            Report Symptom
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.totalAnimals')}
            value={formatNumber(animals?.total ?? 0)}
            icon={<PetsIcon />}
            color="#6366f1"
            to="/animals"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.activeReports')}
            value={formatNumber(reports?.total ?? 0)}
            icon={<AssignmentIcon />}
            color="#3b82f6"
            to="/reports"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontSize={13} color="text.secondary" fontWeight={600} mb={1.5}>
                Quick Actions
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" size="small" href="/reports/new">Report illness</Button>
                <Button variant="outlined" size="small" href="/animals/new">Add animal</Button>
                <Button variant="outlined" size="small" href="/diseases">Disease library</Button>
                <Button variant="outlined" size="small" href="/weather">Weather risk</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography fontWeight={600} fontSize={15}>
                {t('dashboard.recentAlerts')}
              </Typography>
              <Link to="/alerts" style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ p: 1, maxHeight: 320, overflowY: 'auto' }}>
              {recentAlerts.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  {t('alerts.noAlerts')}
                </Box>
              ) : (
                recentAlerts.map((alert) => (
                  <Box
                    key={alert.id}
                    onClick={() => navigate('/alerts')}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      borderLeft: 3,
                      borderColor: getSeverityColor(alert.severity),
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {alert.title}
                      </Typography>
                      <StatusBadge status={alert.severity} type="severity" />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>
                      {alert.affectedArea}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary">
                      {timeAgo(alert.createdAt)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography fontWeight={600} fontSize={15}>
                My Animals
              </Typography>
              <Link to="/animals" style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ p: 1, maxHeight: 320, overflowY: 'auto' }}>
              {(animals?.items ?? []).length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  No animals registered yet
                </Box>
              ) : (
                (animals?.items ?? []).map((animal) => (
                  <Box
                    key={animal.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/animals/${animal.id}`)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {animal.name || animal.tagId}
                      </Typography>
                      <Chip
                        label={`${animal.species} · ${animal.sex}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, textTransform: 'capitalize' }}
                      />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>
                      {animal.breed} · {animal.ageYears} yr
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <NotificationsActiveIcon fontSize="small" color="primary" />
            <Typography fontWeight={600} fontSize={14}>
              Advisories
            </Typography>
          </Box>
          <Typography fontSize={13} color="text.secondary">
            {activeAlerts > 0
              ? `${activeAlerts} active advisories for your area. Report any sick animal immediately.`
              : 'No active advisories right now. Stay alert during extreme weather.'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}