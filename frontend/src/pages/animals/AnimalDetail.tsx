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
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PetsIcon from '@mui/icons-material/Pets'
import EditIcon from '@mui/icons-material/Edit'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import { animalsApi, vaccinationsApi, symptomReportsApi } from '../../api/endpoints'
import { formatDateTime } from '../../utils/helpers'
import StatusBadge from '../../components/common/StatusBadge'
import GeoMap, { type MapMarker } from '../../components/common/GeoMap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { Vaccination, SymptomReport } from '../../types'

export default function AnimalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: animal, isLoading, error } = useQuery({
    queryKey: ['animals', id],
    queryFn: async () => (await animalsApi.get(id!)).data,
    enabled: Boolean(id),
  })

  const { data: vaccinationsData } = useQuery({
    queryKey: ['animals', id, 'vaccinations'],
    queryFn: async () => (await vaccinationsApi.list({ animalId: id })).data,
    enabled: Boolean(id),
  })

  const { data: reportsData } = useQuery({
    queryKey: ['animals', id, 'reports'],
    queryFn: async () => (await symptomReportsApi.list({ animalId: id })).data,
    enabled: Boolean(id),
  })

  if (isLoading) return <LoadingSpinner />
  if (error || !animal) {
    return <Alert severity="error">{String(error) || t('common.error')}</Alert>
  }

  const vaccinations: Vaccination[] = vaccinationsData?.items ?? []
  const reports: SymptomReport[] = reportsData?.items ?? []

  const markers: MapMarker[] = [
    {
      id: animal.id,
      position: animal.location,
      title: animal.name || animal.tagId,
      description: `${animal.breed} · ${animal.district}`,
      color: '#4f46e5',
    },
  ]

  const coverage = animal.healthStatus === 'healthy' ? 100 : 60

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/animals')}
        sx={{ mb: 2 }}
      >
        {t('common.back')}
      </Button>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PetsIcon sx={{ fontSize: 36 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {animal.name || animal.tagId}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {animal.registrationNumber}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} mb={2}>
                <StatusBadge status={animal.healthStatus || 'healthy'} type="status" />
                <Chip
                  size="small"
                  label={t(`animals.${animal.species}`)}
                  variant="outlined"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.breed')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {animal.breed}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.age')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {animal.ageYears}y {animal.ageMonths ? `${animal.ageMonths}m` : ''}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.sex')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {t(`animals.${animal.sex}`)}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.weight')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {animal.weightKg ?? '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.tagId')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {animal.tagId}
                  </Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="text.secondary">
                    {t('animals.owner')}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600}>
                    {animal.ownerName}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography fontSize={11} color="text.secondary" mb={1}>
                  {t('dashboard.vaccinationCoverage')}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={coverage}
                  sx={{ borderRadius: 2, height: 8 }}
                />
                <Typography fontSize={12} fontWeight={600} mt={0.5}>
                  {coverage}%
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
  <Button
    size="small"
    variant="contained"
    onClick={() => navigate(`/reports/new?animalId=${animal.id}`)}
  >
     Analyze Animal Health
  </Button>

  <Button
    size="small"
    variant="outlined"
    startIcon={<EditIcon />}
    onClick={() => navigate('/animals')}
  >
    {t('common.edit')}
  </Button>
</Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mt: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
              <Typography fontWeight={600} fontSize={15}>
                {t('reports.location')}
              </Typography>
              <Typography fontSize={12} color="text.secondary" mt={0.5}>
                {animal.village}, {animal.block}, {animal.district}, {animal.state}
              </Typography>
            </Box>
            <Box sx={{ height: 260 }}>
              <GeoMap markers={markers} height={260} zoom={12} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('animals.healthHistory')}
              </Typography>
              {reports.length === 0 ? (
                <Typography fontSize={13} color="text.secondary">
                  {t('reports.noReports')}
                </Typography>
              ) : (
                reports.map((report) => (
                  <Box
                    key={report.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography fontSize={13} fontWeight={600}>
                        {report.description.slice(0, 60)}
                        {report.description.length > 60 ? '...' : ''}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <StatusBadge status={report.status} type="status" />
                        <StatusBadge status={report.severity} type="severity" />
                      </Stack>
                    </Stack>
                    <Typography fontSize={11} color="text.secondary" mt={0.5}>
                      {formatDateTime(report.createdAt)}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('animals.vaccinationRecords')}
              </Typography>
              {vaccinations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <VaccinesIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography fontSize={13}>{t('common.noData')}</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {vaccinations.map((vaccination) => (
                    <ListItem key={vaccination.id} disableGutters sx={{ px: 0 }}>
                      <ListItemIcon>
                        <VaccinesIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={vaccination.vaccineName}
                        secondary={
                          <>
                            {t('vaccinations.batchNumber')}: {vaccination.batchNumber} ·{' '}
                            {t('common.date')}: {formatDateTime(vaccination.administeredOn)}
                          </>
                        }
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                      <Chip
                        size="small"
                        label={`D${vaccination.doseNumber}`}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}