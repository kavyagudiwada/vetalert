import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import MapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import PublicIcon from '@mui/icons-material/Public'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AddIcon from '@mui/icons-material/Add'
import toast from 'react-hot-toast'
import { outbreaksApi, diseasesApi } from '../../api/endpoints'
import GeoMap, {
  type MapMarker,
  type MapCircle,
  type MapPolygon,
} from '../../components/common/GeoMap'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate, getSeverityColor } from '../../utils/helpers'
import type { Outbreak, Disease } from '../../types'

export default function OutbreakTracker() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [view, setView] = useState<'list' | 'map'>('map')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [newOutbreak, setNewOutbreak] = useState({
    diseaseId: '',
    radiusKm: '5',
    confirmedCases: '1',
    latitude: '20.59',
    longitude: '78.96',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['outbreaks', statusFilter],
    queryFn: async () =>
      (
        await outbreaksApi.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          pageSize: 100,
        })
      ).data,
  })

  const { data: diseasesData } = useQuery({
    queryKey: ['diseases', 'all'],
    queryFn: async () => (await diseasesApi.list({ pageSize: 100 })).data,
  })

  const outbreaks: Outbreak[] = data?.items ?? []
  const diseases: Disease[] = diseasesData?.items ?? []

  const markers: MapMarker[] = useMemo(
    () =>
      outbreaks.map((outbreak) => ({
        id: outbreak.id,
        position: outbreak.location,
        title: outbreak.diseaseName,
        description: `${outbreak.confirmedCases} ${t('outbreaks.confirmedCases')} · ${t(
          `status.${outbreak.status}`,
        )}`,
        severity: outbreak.status === 'active' ? 'critical' : 'medium',
      })),
    [outbreaks, t],
  )

  const circles: MapCircle[] = useMemo(
    () =>
      outbreaks.map((outbreak) => ({
        id: `circle-${outbreak.id}`,
        center: outbreak.location,
        radiusMeters: outbreak.radiusKm * 1000,
        color:
          outbreak.status === 'active'
            ? getSeverityColor('critical')
            : getSeverityColor('medium'),
        label: `${outbreak.diseaseName}`,
        severity:
          outbreak.status === 'active' ? 'critical' : 'medium',
      })),
    [outbreaks],
  )

  const polygons: MapPolygon[] = []

  const markControlled = useMutation({
    mutationFn: (outbreak: Outbreak) =>
      outbreaksApi.update(outbreak.id, {
        status: 'controlled',
        controlledOn: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      queryClient.invalidateQueries({ queryKey: ['outbreaks'] })
    },
  })

  const createOutbreak = useMutation({
    mutationFn: () =>
      outbreaksApi.create({
        diseaseId: newOutbreak.diseaseId,
        diseaseName:
          diseases.find((d) => d.id === newOutbreak.diseaseId)?.name ||
          newOutbreak.diseaseId,
        status: 'active',
        location: {
          latitude: Number(newOutbreak.latitude),
          longitude: Number(newOutbreak.longitude),
        },
        radiusKm: Number(newOutbreak.radiusKm),
        confirmedCases: Number(newOutbreak.confirmedCases),
        activeCases: Number(newOutbreak.confirmedCases),
        deaths: 0,
        atRiskAnimals: 0,
        speciesAffected: [],
        declaredOn: new Date().toISOString(),
        controlMeasures: ['Quarantine affected area', 'Notify veterinary department'],
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['outbreaks'] })
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <Alert severity="error">{String(error)}</Alert>

  const activeCount = outbreaks.filter((o) => o.status === 'active').length
  const confirmedTotal = outbreaks.reduce(
    (sum, o) => sum + o.confirmedCases,
    0,
  )
  const atRiskTotal = outbreaks.reduce((sum, o) => sum + o.atRiskAnimals, 0)

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
              bgcolor: 'error.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PublicIcon />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {t('outbreaks.tracker')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('reports.listView')}>
            <IconButton
              color={view === 'list' ? 'primary' : 'default'}
              onClick={() => setView('list')}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('reports.mapView')}>
            <IconButton
              color={view === 'map' ? 'primary' : 'default'}
              onClick={() => setView('map')}
            >
              <MapIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            {t('outbreaks.newOutbreak')}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                {t('outbreaks.activeOutbreaks')}
              </Typography>
              <Typography fontSize={28} fontWeight={700} color="error.main">
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                {t('outbreaks.confirmedCases')}
              </Typography>
              <Typography fontSize={28} fontWeight={700} color="warning.main">
                {confirmedTotal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                {t('outbreaks.atRiskAnimals')}
              </Typography>
              <Typography fontSize={28} fontWeight={700} color="primary.main">
                {atRiskTotal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                {t('outbreaks.containedArea')}
              </Typography>
              <Typography fontSize={28} fontWeight={700} color="success.main">
                {outbreaks.filter((o) => o.status === 'controlled').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <FormControl size="small" sx={{ minWidth: 160, mb: 2 }}>
        <InputLabel>{t('common.status')}</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          label={t('common.status')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="active">{t('status.active')}</MenuItem>
          <MenuItem value="controlled">{t('status.closed')}</MenuItem>
          <MenuItem value="resolved">{t('status.resolved')}</MenuItem>
        </Select>
      </FormControl>

      {view === 'map' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ height: 480 }}>
            {outbreaks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                {t('outbreaks.noOutbreaks')}
              </Box>
            ) : (
              <GeoMap
                markers={markers}
                circles={circles}
                polygons={polygons}
                height={480}
                zoom={5}
              />
            )}
          </Box>
        </Card>
      ) : (
        <Stack spacing={2} mb={3}>
          {outbreaks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
              {t('outbreaks.noOutbreaks')}
            </Box>
          ) : (
            outbreaks.map((outbreak) => (
              <Card key={outbreak.id} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography fontWeight={700} fontSize={15}>
                        {outbreak.diseaseName}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {t('outbreaks.declaredOn')}: {formatDate(outbreak.declaredOn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography fontSize={11} color="text.secondary">
                        {t('outbreaks.confirmedCases')}
                      </Typography>
                      <Typography fontSize={16} fontWeight={700}>
                        {outbreak.confirmedCases}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography fontSize={11} color="text.secondary">
                        {t('outbreaks.atRiskAnimals')}
                      </Typography>
                      <Typography fontSize={16} fontWeight={700}>
                        {outbreak.atRiskAnimals}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <StatusBadge status={outbreak.status} type="status" />
                    </Grid>
                    <Grid item xs={6} sm={2} textAlign="right">
                      {outbreak.status === 'active' ? (
                        <Button
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => markControlled.mutate(outbreak)}
                          disabled={markControlled.isPending}
                        >
                          {t('outbreaks.markControlled')}
                        </Button>
                      ) : (
                        <Typography fontSize={12} color="success.main" fontWeight={600}>
                          {t('outbreaks.controlledOn')}:{' '}
                          {outbreak.controlledOn ? formatDate(outbreak.controlledOn) : '-'}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                  <LinearProgress
                    variant="determinate"
                    value={
                      outbreak.status === 'active'
                        ? 100 - (outbreak.deaths / (outbreak.confirmedCases || 1)) * 100
                        : 100
                    }
                    color={
                      outbreak.status === 'active' ? 'error' : 'success'
                    }
                    sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
                  />
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                    {outbreak.controlMeasures.map((measure, index) => (
                      <Chip
                        key={index}
                        label={measure}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('outbreaks.newOutbreak')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>{t('diseases.name')}</InputLabel>
            <Select
              value={newOutbreak.diseaseId}
              onChange={(e) =>
                setNewOutbreak({ ...newOutbreak, diseaseId: e.target.value })
              }
              label={t('diseases.name')}
            >
              {diseases.map((disease) => (
                <MenuItem key={disease.id} value={disease.id}>
                  {disease.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label={t('alerts.radius')}
            type="number"
            value={newOutbreak.radiusKm}
            onChange={(e) =>
              setNewOutbreak({ ...newOutbreak, radiusKm: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('outbreaks.confirmedCases')}
            type="number"
            value={newOutbreak.confirmedCases}
            onChange={(e) =>
              setNewOutbreak({ ...newOutbreak, confirmedCases: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={newOutbreak.latitude}
                onChange={(e) =>
                  setNewOutbreak({ ...newOutbreak, latitude: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={newOutbreak.longitude}
                onChange={(e) =>
                  setNewOutbreak({ ...newOutbreak, longitude: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={createOutbreak.isPending || !newOutbreak.diseaseId}
            onClick={() => createOutbreak.mutate()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}