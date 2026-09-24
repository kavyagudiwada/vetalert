import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import CoronavirusIcon from '@mui/icons-material/Coronavirus'
import ScienceIcon from '@mui/icons-material/Science'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { diseasesApi, outbreaksApi } from '../../api/endpoints'
import StatusBadge from '../../components/common/StatusBadge'
import GeoMap, {
  type MapMarker,
  type MapCircle,
} from '../../components/common/GeoMap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getSeverityColor } from '../../utils/helpers'

export default function DiseaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: disease, isLoading, error } = useQuery({
    queryKey: ['diseases', id],
    queryFn: async () => (await diseasesApi.get(id!)).data,
    enabled: Boolean(id),
  })

  const { data: outbreaksData } = useQuery({
    queryKey: ['outbreaks', 'disease', id],
    queryFn: async () => (await outbreaksApi.list({ diseaseId: id })).data,
    enabled: Boolean(id),
  })

  if (isLoading) return <LoadingSpinner />
  if (error || !disease) {
    return <Alert severity="error">{String(error) || t('common.error')}</Alert>
  }

  const outbreaks = outbreaksData?.items ?? []

  const outbreakMarkers: MapMarker[] = outbreaks.map((outbreak) => ({
    id: outbreak.id,
    position: outbreak.location,
    title: outbreak.diseaseName,
    description: `${outbreak.confirmedCases} ${t('outbreaks.confirmedCases')}`,
    severity: 'critical',
  }))

  const outbreakCircles: MapCircle[] = outbreaks.map((outbreak) => ({
    id: `circle-${outbreak.id}`,
    center: outbreak.location,
    radiusMeters: outbreak.radiusKm * 1000,
    color: getSeverityColor('critical'),
    label: `${outbreak.diseaseName} (${outbreak.confirmedCases})`,
    severity: 'critical',
  }))

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/diseases')}
        sx={{ mb: 2 }}
      >
        {t('common.back')}
      </Button>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ScienceIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {disease.name}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {disease.scientificName}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} mb={2}>
                <StatusBadge status={disease.severity} type="severity" />
                {disease.zoonotic && (
                  <Chip
                    icon={<CoronavirusIcon />}
                    label={t('diseases.zoonotic')}
                    color="error"
                    size="small"
                  />
                )}
                {disease.contagious && (
                  <Chip
                    icon={<WarningAmberIcon />}
                    label="Contagious"
                    color="warning"
                    size="small"
                  />
                )}
              </Stack>

              <Typography fontSize={14} mb={2}>
                {disease.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography fontSize={13} fontWeight={600} color="text.secondary" mb={1}>
                {t('diseases.speciesAffected')}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {disease.speciesAffected.map((species) => (
                  <Chip
                    key={species}
                    label={t(`animals.${species}`)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography fontSize={13} fontWeight={600} color="text.secondary" mb={1}>
                {t('diseases.riskFactors')}
              </Typography>
              <List dense disablePadding>
                {disease.riskFactors.map((factor, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <WarningAmberIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={factor}
                      primaryTypographyProps={{ fontSize: 13 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('diseases.symptoms')}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {disease.symptoms.map((symptom) => (
                  <Chip
                    key={symptom}
                    label={t(`symptoms.${symptom}`)}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <ShieldOutlinedIcon color="success" />
                    <Typography fontWeight={600} fontSize={15}>
                      {t('diseases.prevention')}
                    </Typography>
                  </Stack>
                  <List dense disablePadding>
                    {disease.prevention.map((item, index) => (
                      <ListItem key={index} disableGutters>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{ fontSize: 13 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <LocalHospitalIcon color="primary" />
                    <Typography fontWeight={600} fontSize={15}>
                      {t('diseases.treatment')}
                    </Typography>
                  </Stack>
                  <List dense disablePadding>
                    {disease.treatment.map((item, index) => (
                      <ListItem key={index} disableGutters>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{ fontSize: 13 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
              <Typography fontWeight={600} fontSize={15}>
                {t('nav.outbreaks')} — {disease.name}
              </Typography>
            </Box>
            <Box sx={{ height: 360 }}>
              {outbreaks.length > 0 ? (
                <GeoMap
                  markers={outbreakMarkers}
                  circles={outbreakCircles}
                  center={
                    outbreaks[0]?.location ?? { latitude: 20.59, longitude: 78.96 }
                  }
                  height={360}
                  zoom={6}
                  onMarkerClick={() => navigate(`/outbreaks`)}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  {t('outbreaks.noOutbreaks')}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}