import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import PetsIcon from '@mui/icons-material/Pets'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import MapIcon from '@mui/icons-material/Map'
import { dashboardApi, alertsApi } from '../api/endpoints'
import {
  formatNumber,
  timeAgo,
  getSeverityColor,
} from '../utils/helpers'
import GeoMap, { type MapCircle } from '../components/common/GeoMap'
import DiseaseTrendChart from '../components/charts/DiseaseTrendChart'
import SpeciesDistributionChart from '../components/charts/SpeciesDistributionChart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import StatusBadge from '../components/common/StatusBadge'
import type { Alert } from '../types'

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
  to,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  trend?: string
  to?: string
}) {
  const navigate = useNavigate()
  return (
    <Card
      onClick={() => to && navigate(to)}
      sx={{
        borderRadius: 3,
        cursor: to ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': to
          ? { transform: 'translateY(-3px)', boxShadow: 6 }
          : {},
        height: '100%',
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
        {trend && (
          <Typography fontSize={11} color="text.secondary" mt={1}>
            {trend}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => (await dashboardApi.stats()).data,
  })

  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: async () => (await dashboardApi.heatmap()).data,
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: async () => (await dashboardApi.trends()).data,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await dashboardApi.summary()).data,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => (await alertsApi.list({ pageSize: 5 })).data,
  })

  const { data: fmdCoverage } = useQuery({
    queryKey: ['dashboard', 'fmd-coverage'],
    queryFn: async () => (await dashboardApi.vaccinationCoverage()).data,
  })

  const { data: surveillanceData } = useQuery({
    queryKey: ['dashboard', 'surveillance'],
    queryFn: async () => (await dashboardApi.surveillance()).data,
  })

  const recentAlerts: Alert[] = alertsData?.items ?? []

  const topFmdDistricts: Record<string, unknown>[] = (fmdCoverage ?? []).slice(0, 8)

  const latestPrev: Record<string, Record<string, unknown>> = {}
  ;(surveillanceData ?? []).forEach((r: any) => {
    if (r.surveillance_type !== 'serosurveillance') return
    const cur = latestPrev[r.state]
    if (!cur || (r.year as number) > (cur.year as number)) {
      latestPrev[r.state] = r
    }
  })
  const prevalenceList = Object.values(latestPrev)
    .sort((a, b) => ((b.positive_pct as number) ?? 0) - ((a.positive_pct as number) ?? 0))
    .slice(0, 8)

  const heatCircles: MapCircle[] = Object.entries(heatmap ?? {}).map(
    ([key, count], index) => {
      const [lat, lng] = key.split(',').map(Number)
      return {
        id: `heat-${index}`,
        center: { latitude: lat, longitude: lng },
        radiusMeters: 5000 + count * 2000,
        color:
          count > 10 ? '#dc2626' : count > 5 ? '#f59e0b' : '#10b981',
        label: `${count} reports`,
        severity:
          count > 10 ? 'critical' : count > 5 ? 'high' : 'low',
      }
    },
  )

  const speciesData = [
    { species: 'cattle', value: 1200 },
    { species: 'buffalo', value: 800 },
    { species: 'goat', value: 500 },
    { species: 'sheep', value: 300 },
    { species: 'pig', value: 150 },
    { species: 'poultry', value: 4500 },
  ]
  const trendData = Array.from({ length: 14 }).map((_, index) => ({
    date: `${index + 1}/04`,
    cases: Math.round(Math.abs(Math.sin(index / 3)) * 20) + 5,
    confirmed: Math.round(Math.abs(Math.sin(index / 4)) * 8) + 1,
  }))

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t('dashboard.welcome')} 👋
      </Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.totalAnimals')}
            value={stats ? formatNumber(stats.totalAnimals) : '-'}
            icon={<PetsIcon />}
            color="#6366f1"
            trend="+12% vs last month"
            to="/animals"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.activeReports')}
            value={stats ? formatNumber(stats.activeReports) : '-'}
            icon={<AssignmentIcon />}
            color="#3b82f6"
            trend={`${stats?.criticalCases ?? 0} critical`}
            to="/reports"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.outbreaks')}
            value={stats ? formatNumber(stats.activeOutbreaks) : '-'}
            icon={<ReportProblemIcon />}
            color="#ef4444"
            trend={`${stats?.confirmedOutbreaks ?? 0} confirmed`}
            to="/outbreaks"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label={t('dashboard.vaccinationCoverage')}
            value={stats ? `${stats.vaccinationCoverage.toFixed(1)}%` : '-'}
            icon={<VaccinesIcon />}
            color="#10b981"
            trend={`${stats ? formatNumber(stats.vaccinatedAnimals) : ''} vaccinated`}
            to="/vaccinations"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} mb={1} color="text.secondary">
        Official Government Dataset (DAHD / Census)
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Livestock Population (2019 Census)"
            value={stats ? formatNumber(stats.livestockPopulation ?? 0) : '-'}
            icon={<PetsIcon />}
            color="#059669"
            trend="20th Livestock Census · all-India"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="FMD Vaccination Doses Administered"
            value={stats ? formatNumber(stats.fmdVaccinationDoses ?? 0) : '-'}
            icon={<VaccinesIcon />}
            color="#0891b2"
            trend="NADCP rounds 1–6 · district-wise"
            to="/vaccinations"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Farmers Benefited (NADCP)"
            value={stats ? formatNumber(stats.fmdFarmersBenefited ?? 0) : '-'}
            icon={<ReportProblemIcon />}
            color="#7c3aed"
            trend="officially reported beneficiaries"
            to="/vaccinations"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Districts Covered (Round 6)"
            value={stats ? formatNumber(stats.fmdDistrictsCovered ?? 0) : '-'}
            icon={<MapIcon />}
            color="#f59e0b"
            trend="expansion districts · 3 states"
          />
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
                FMD Vaccination Coverage — Top Districts
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                cumulative doses (all rounds)
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {topFmdDistricts.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  Loading…
                </Box>
              ) : (
                topFmdDistricts.map((d: any, i: number) => (
                  <Box key={String(d.district)} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {i + 1}. {String(d.district)}, {String(d.state)}
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
                        {formatNumber(Number(d.total_doses))} doses
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
                          width: `${Math.max(2, (Number(d.total_doses) / Number(topFmdDistricts[0].total_doses)) * 100)}%`,
                          bgcolor: '#0891b2',
                        }}
                      />
                    </Box>
                    <Typography fontSize={11} color="text.secondary">
                      {formatNumber(Number(d.farmers_benefited))} farmers · last round{' '}
                      {String(d.last_round)} · ratio {Number(d.dose_to_livestock_ratio)}x livestock
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
                FMD Seroprevalence by State (Latest Year)
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                NIVEDI serosurveillance
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {prevalenceList.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  Loading…
                </Box>
              ) : (
                prevalenceList.map((s: any, i: number) => (
                  <Box key={`${String(s.state)}-${String(s.year)}`} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {i + 1}. {String(s.state)}
                      </Typography>
                      <Typography fontSize={13} fontWeight={700} color="#dc2626">
                        {Number(s.positive_pct)}%
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
                          width: `${Math.min(100, Number(s.positive_pct) ?? 0)}%`,
                          bgcolor: '#dc2626',
                        }}
                      />
                    </Box>
                    <Typography fontSize={11} color="text.secondary">
                      {String(s.year)} · {formatNumber(Number(s.sample_size))} samples tested ·
                      antibody prevalence
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography fontWeight={600} fontSize={15}>
                Disease Heatmap
              </Typography>
            </Box>
            <Box sx={{ height: '100%', minHeight: 400 }}>
              {heatmapLoading ? (
                <LoadingSpinner />
              ) : (
                <GeoMap
                  circles={heatCircles}
                  center={
                    heatCircles[0]
                      ? heatCircles[0].center
                      : { latitude: 20.59, longitude: 78.96 }
                  }
                  zoom={5}
                  height={420}
                  onMarkerClick={(marker) => navigate(`/reports?district=${marker.id}`)}
                />
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              <Link
                to="/alerts"
                style={{ textDecoration: 'none', fontSize: 12, color: 'primary.main' }}
              >
                {t('dashboard.viewAll')} →
              </Link>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {recentAlerts.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  {t('alerts.noAlerts')}
                </Box>
              ) : (
                recentAlerts.map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      borderLeft: 3,
                      borderColor: getSeverityColor(alert.severity),
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate('/alerts')}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize={13} fontWeight={600}>
                        {alert.title}
                      </Typography>
                      <StatusBadge status={alert.severity} type="severity" />
                    </Box>
                    <Typography fontSize={12} color="text.secondary" mt={0.5} mb={0.5}>
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
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600} fontSize={15}>
                {t('dashboard.diseaseTrend')}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                Last 14 days
              </Typography>
            </Box>
            <DiseaseTrendChart
              data={trends?.length ? (trends as typeof trendData) : trendData}
              loading={trendsLoading}
            />
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Typography fontWeight={600} fontSize={15} mb={1}>
              {t('dashboard.speciesDistribution')}
            </Typography>
            <SpeciesDistributionChart data={speciesData} />
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
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography fontWeight={600} fontSize={15}>
                {t('dashboard.districtSummary')}
              </Typography>
              <IconButton size="small">
                <MapIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {[
                      'District',
                      t('animals.registrationNumber'),
                      t('reports.noReports'),
                      t('dashboard.vaccinated'),
                      t('dashboard.outbreaks'),
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          textAlign: 'left',
                          padding: '10px 16px',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          color: 'text.secondary',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(summary ?? []).length > 0 ? (
                    (summary as Record<string, unknown>[]).map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                          {String(row.district)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {formatNumber(Number(row.totalAnimals ?? 0))}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {formatNumber(Number(row.totalReports ?? 0))}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {formatNumber(Number(row.vaccinated ?? 0))}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {formatNumber(Number(row.outbreaks ?? 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: 24, textAlign: 'center', color: 'text.secondary' }}
                      >
                        {t('common.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}