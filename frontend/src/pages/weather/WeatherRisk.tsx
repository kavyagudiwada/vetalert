import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  LinearProgress,
  Paper,
  Divider,
  Alert,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import OpacityIcon from '@mui/icons-material/Opacity'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirIcon from '@mui/icons-material/Air'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import { weatherApi } from '../../api/endpoints'
import GeoMap, { type MapCircle, type HeatPoint } from '../../components/common/GeoMap'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { WeatherRisk } from '../../types'

const DISTRICTS = ['Nagpur', 'Pune', 'Amravati', 'Nashik', 'Aurangabad', 'Kolhapur']

export default function WeatherRiskPage() {
  const { t } = useTranslation()
  const [district, setDistrict] = useState('Nagpur')

  const { data: risk, isLoading, error } = useQuery({
    queryKey: ['weather', 'risk', district],
    queryFn: async () =>
      (await weatherApi.riskAssessment({ district })).data,
  })

  const { data: forecast } = useQuery({
    queryKey: ['weather', 'forecast', district],
    queryFn: async () => (await weatherApi.forecast({ district })).data,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <Alert severity="error">{String(error)}</Alert>

  const riskData: WeatherRisk = risk ?? {
    district,
    riskLevel: 'medium',
    temperature: 31,
    humidity: 68,
    rainfall: 12,
    windSpeed: 18,
    correlatedDiseases: [
      { diseaseId: 'fmd', name: 'Foot and Mouth Disease', correlation: 0.72 },
      { diseaseId: 'anthrax', name: 'Anthrax', correlation: 0.55 },
      { diseaseId: 'mastitis', name: 'Mastitis', correlation: 0.4 },
    ],
    advice: [
      'Monitor herds for lameness and oral lesions',
      'Ensure clean drinking water sources',
      'Boost vaccination for FMD in high-risk villages',
    ],
    updatedAt: new Date().toISOString(),
  }

  const heatPoints: HeatPoint[] = [
    { position: { latitude: 21.15, longitude: 79.09 }, intensity: 0.82, title: 'Nagpur' },
    { position: { latitude: 18.52, longitude: 73.86 }, intensity: 0.45, title: 'Pune' },
    { position: { latitude: 20.93, longitude: 77.75 }, intensity: 0.6, title: 'Amravati' },
    { position: { latitude: 20.0, longitude: 73.78 }, intensity: 0.38, title: 'Nashik' },
    { position: { latitude: 19.88, longitude: 75.34 }, intensity: 0.25, title: 'Aurangabad' },
    { position: { latitude: 16.7, longitude: 74.24 }, intensity: 0.3, title: 'Kolhapur' },
  ]

  const circles: MapCircle[] = heatPoints.map((heat) => ({
    id: `weather-${heat.title}`,
    center: heat.position,
    radiusMeters: 25000 + heat.intensity * 45000,
    color: heat.intensity > 0.7 ? '#ef4444' : heat.intensity > 0.4 ? '#f59e0b' : '#10b981',
    label: `${heat.title} (${Math.round(heat.intensity * 100)}%)`,
    severity: heat.intensity > 0.7 ? 'critical' : heat.intensity > 0.4 ? 'high' : 'low',
  }))

  const forecastDays = Array.isArray(forecast) && forecast.length > 0
    ? forecast as Record<string, string | number>[]
    : Array.from({ length: 7 }).map((_, index) => {
        const date = new Date()
        date.setDate(date.getDate() + index)
        return {
          day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
          tempMax: Math.round(28 + Math.sin(index) * 4 + index),
          tempMin: Math.round(18 + Math.cos(index) * 3),
          humidity: Math.round(60 + Math.abs(Math.sin(index / 1.5)) * 25),
          rainfall: Math.round(Math.abs(Math.cos(index / 2)) * 20),
        }
      })

  const metricCards = [
    {
      label: t('weather.temperature'),
      value: `${riskData.temperature}°C`,
      icon: <ThermostatIcon />,
      color: '#ef4444',
    },
    {
      label: t('weather.humidity'),
      value: `${riskData.humidity}%`,
      icon: <OpacityIcon />,
      color: '#3b82f6',
    },
    {
      label: t('weather.rainfall'),
      value: `${riskData.rainfall} mm`,
      icon: <WaterDropIcon />,
      color: '#06b6d4',
    },
    {
      label: t('weather.windSpeed'),
      value: `${riskData.windSpeed} km/h`,
      icon: <AirIcon />,
      color: '#10b981',
    },
  ]

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'info.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WbSunnyIcon />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {t('weather.riskAssessment')}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('reports.district')}</InputLabel>
          <Select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            label={t('reports.district')}
          >
            {DISTRICTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography fontWeight={600} fontSize={15}>
                {t('weather.highRiskRegions')}
              </Typography>
              <StatusBadge status={riskData.riskLevel} type="severity" />
            </Box>
            <Box sx={{ height: 420 }}>
              <GeoMap
                heatPoints={heatPoints}
                circles={circles}
                center={{ latitude: 19.5, longitude: 76.5 }}
                height={420}
                zoom={6}
              />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Grid container spacing={2}>
            {metricCards.map((metric) => (
              <Grid item xs={6} key={metric.label}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${metric.color}18`,
                        color: metric.color,
                        mb: 1,
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600}>
                      {metric.label}
                    </Typography>
                    <Typography fontSize={22} fontWeight={700}>
                      {metric.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ borderRadius: 3, mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight={600} fontSize={15} mb={0.5}>
                {t('weather.diseaseCorrelation')}
              </Typography>
              <Typography fontSize={12} color="text.secondary" mb={1.5}>
                {district} · updated {new Date(riskData.updatedAt).toLocaleString()}
              </Typography>
              {riskData.correlatedDiseases.map((disease) => (
                <Box key={disease.diseaseId} sx={{ mb: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography fontSize={13} fontWeight={600}>
                      {disease.name}
                    </Typography>
                    <Typography fontSize={13} fontWeight={700} color="error.main">
                      {Math.round(disease.correlation * 100)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={disease.correlation * 100}
                    sx={{
                      height: 7,
                      borderRadius: 3,
                      bgcolor: 'divider',
                      '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' },
                    }}
                    color="error"
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('weather.daysForecast')}
              </Typography>
              <Grid container spacing={1}>
                {forecastDays.map((day, index) => (
                  <Grid item xs={6} sm={3} md={index < 4 ? 3 : 6} key={index}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography fontSize={12} fontWeight={600} mb={0.5}>
                        {String(day.day)}
                      </Typography>
                      <Stack direction="row" justifyContent="center" spacing={0.5}>
                        <ThermostatIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                        <Typography fontSize={13} fontWeight={700}>
                          {String(day.tempMax)}°
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="center" spacing={0.5}>
                        <WaterDropIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                        <Typography fontSize={12} color="text.secondary">
                          {String(day.humidity)}%
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="center" spacing={0.5} mt={0.5}>
                        <WaterDropIcon sx={{ fontSize: 14, color: '#06b6d4' }} />
                        <Typography fontSize={12} color="text.secondary">
                          {String(day.rainfall)} mm
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('reports.recommendedActions')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {riskData.advice.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                  <Chip
                    label={index + 1}
                    size="small"
                    color="info"
                    sx={{ mr: 1.5, mt: 0.2, fontWeight: 700 }}
                  />
                  <Typography fontSize={13}>{item}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}