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
import AssignmentIcon from '@mui/icons-material/Assignment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import ScienceIcon from '@mui/icons-material/Science'
import { dashboardApi, symptomReportsApi, labSamplesApi, vaccinationsApi } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { formatNumber, timeAgo, getSeverityColor } from '../../utils/helpers'
import StatusBadge from '../../components/common/StatusBadge'
import type { Vaccination } from '../../types'

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

export default function VetDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const { data: stats } = useQuery({
    queryKey: ['vet', 'stats'],
    queryFn: async () => (await dashboardApi.stats()).data,
  })

  const { data: pendingReports } = useQuery({
    queryKey: ['vet', 'pending-reports'],
    queryFn: async () => (await symptomReportsApi.list({ status: 'triaged', pageSize: 10 })).data,
  })

  const { data: labSamples } = useQuery({
    queryKey: ['vet', 'lab-samples'],
    queryFn: async () => (await labSamplesApi.list({ pageSize: 8 })).data,
  })

  const { data: vaccinations } = useQuery({
    queryKey: ['vet', 'vaccinations'],
    queryFn: async () => vaccinationsApi.schedule({ days: 30 }),
  })

  const { data: fmdCoverage } = useQuery({
    queryKey: ['vet', 'fmd-coverage'],
    queryFn: async () => (await dashboardApi.vaccinationCoverage()).data,
  })

  const topFmd: Record<string, unknown>[] = (fmdCoverage ?? []).slice(0, 5)

  const upcoming = vaccinations?.data ?? []
  const testingSamples = (labSamples?.items ?? []).filter(
    (s) => s.status === 'collected' || s.status === 'testing',
  ).length

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('dashboard.welcome')} Dr. {user?.firstName} 👨‍⚕️
          </Typography>
          <Typography fontSize={13} color="text.secondary" mt={0.5}>
            {user?.block || user?.district || ''} — Veterinarian
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" href="/reports">
            Triage Reports
          </Button>
          <Button variant="outlined" size="small" href="/vaccinations">
            Record Vaccination
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.activeReports')}
            value={formatNumber(stats?.activeReports ?? 0)}
            icon={<AssignmentIcon />}
            color="#3b82f6"
            to="/reports"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.outbreaks')}
            value={formatNumber(stats?.activeOutbreaks ?? 0)}
            icon={<ReportProblemIcon />}
            color="#ef4444"
            to="/outbreaks"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.vaccinationCoverage')}
            value={`${(stats?.vaccinationCoverage ?? 0).toFixed(1)}%`}
            icon={<VaccinesIcon />}
            color="#10b981"
            to="/vaccinations"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Lab Samples Testing"
            value={formatNumber(testingSamples)}
            icon={<ScienceIcon />}
            color="#8b5cf6"
            to="/labs"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} lg={4}>
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
                Pending Triage
              </Typography>
              <Link to="/reports" style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ p: 1, maxHeight: 340, overflowY: 'auto' }}>
              {(pendingReports?.items ?? []).length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  No reports awaiting triage
                </Box>
              ) : (
                (pendingReports?.items ?? []).map((report) => (
                  <Box
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      borderLeft: 3,
                      borderColor: getSeverityColor(report.severity),
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                        {report.species} — {report.district || 'Unknown district'}
                      </Typography>
                      <StatusBadge status={report.severity} type="severity" />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>
                      {(report.symptoms ?? []).slice(0, 3).join(', ')}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary" mt={0.5}>
                      {timeAgo(report.createdAt)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
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
                Upcoming Vaccinations
              </Typography>
              <Link to="/vaccinations" style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ p: 1, maxHeight: 340, overflowY: 'auto' }}>
              {upcoming.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  No vaccinations due soon
                </Box>
              ) : (
                upcoming.slice(0, 10).map((v: Vaccination) => (
                  <Box
                    key={v.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {v.vaccineName}
                      </Typography>
                      <Chip label={`Animal #${v.animalId}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>
                      Due {new Date(v.nextDueOn).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
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
                Recent Lab Samples
              </Typography>
              <Link to="/labs" style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ p: 1, maxHeight: 340, overflowY: 'auto' }}>
              {(labSamples?.items ?? []).length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  No lab samples yet
                </Box>
              ) : (
                (labSamples?.items ?? []).map((s) => (
                  <Box
                    key={s.id}
                    onClick={() => navigate('/labs')}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {s.sampleId}
                      </Typography>
                      <StatusBadge status={s.status} type="lab" />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>
                      {s.sampleType} · {s.result || 'awaiting result'}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary">
                      {timeAgo(s.collectedOn)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
                National FMD Programme (NADCP) — Vaccination Coverage
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                official district-wise rounds 1–6
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {topFmd.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  Loading…
                </Box>
              ) : (
                topFmd.map((d: any) => (
                  <Box key={String(d.district)} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {String(d.district)}, {String(d.state)}
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        {formatNumber(Number(d.total_doses))} doses ·{' '}
                        {formatNumber(Number(d.farmers_benefited))} farmers
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.100',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.max(2, (Number(d.total_doses) / Number(topFmd[0].total_doses)) * 100)}%`,
                          bgcolor: '#10b981',
                        }}
                      />
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}