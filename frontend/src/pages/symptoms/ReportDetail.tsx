import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab'
import { useTranslation } from 'react-i18next'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import toast from 'react-hot-toast'
import { symptomReportsApi, outbreaksApi } from '../../api/endpoints'
import { formatDateTime, getSeverityColor, timeAgo } from '../../utils/helpers'
import StatusBadge from '../../components/common/StatusBadge'
import TriageResult from '../../components/symptoms/TriageResult'
import GeoMap, { type MapMarker, type MapCircle } from '../../components/common/GeoMap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import type { ReportStatus } from '../../types'

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [statusDialog, setStatusDialog] = useState<boolean>(false)

  const [statusUpdate, setStatusUpdate] = useState<{
    status: ReportStatus
    note: string
  }>({ status: 'triaged', note: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', id],
    queryFn: async () => (await symptomReportsApi.get(id!)).data,
    enabled: Boolean(id),
  })

  const report = data

  const { data: outbreaksData } = useQuery({
    queryKey: ['outbreaks', 'active'],
    queryFn: async () => (await outbreaksApi.list({ status: 'active' })).data,
    enabled: Boolean(report),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { status: ReportStatus; note?: string }) =>
      symptomReportsApi.update(id!, {
        status: payload.status,
        statusHistory: [
          ...(report?.statusHistory ?? []),
          { status: payload.status, timestamp: new Date().toISOString(), note: payload.note },
        ],
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      setStatusDialog(false)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (error || !report) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {String(error) || t('common.error')}
      </Alert>
    )
  }

  const markers: MapMarker[] = [
    {
      id: report.id,
      position: report.location,
      title: `${t(`animals.${report.species}`)} — ${report.id.slice(0, 8)}`,
      description: report.description.slice(0, 120),
      severity: report.severity,
    },
  ]

  const outbreakCircles: MapCircle[] = (outbreaksData?.items ?? []).map(
    (outbreak) => ({
      id: outbreak.id,
      center: outbreak.location,
      radiusMeters: outbreak.radiusKm * 1000,
      color: getSeverityColor('critical'),
      label: `${outbreak.diseaseName} (${outbreak.confirmedCases} cases)`,
      severity: 'critical',
    }),
  )

  const statusOrder: ReportStatus[] = [
    'reported',
    'triaged',
    'confirmed',
    'resolved',
  ]

  const currentStatusIndex = statusOrder.indexOf(report.status)

  const relatedOutbreak = (outbreaksData?.items ?? []).find(
    (outbreak) => outbreak.id === report.relatedOutbreakId,
  )

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/reports')}
        sx={{ mb: 2 }}
      >
        {t('common.back')}
      </Button>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    #{report.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Typography color="text.secondary" fontSize={13}>
                    {t('reports.reportedOn')} {formatDateTime(report.createdAt)} · {timeAgo(report.createdAt)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <StatusBadge status={report.status} type="status" />
                  <StatusBadge status={report.severity} type="severity" />
                </Stack>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    {t('reports.species')}
                  </Typography>
                  <Typography fontSize={15} fontWeight={600} mb={2}>
                    {t(`animals.${report.species}`)}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    {t('reports.location')}
                  </Typography>
                  <Typography fontSize={15} mb={2}>
                    {report.village}, {report.block}, {report.district}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    {t('animals.tagId')}
                  </Typography>
                  <Typography fontSize={15} mb={2}>
                    {report.animal ? report.animal.tagId : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={1}>
                    {t('reports.selectSymptoms')}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {report.symptoms.map((symptom) => (
                      <Chip
                        key={symptom}
                        label={t(`symptoms.${symptom}`)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={1}>
                {t('reports.description')}
              </Typography>
              <Typography fontSize={14} mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
                {report.description}
              </Typography>

              {report.photos && report.photos.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {report.photos.map((photo, index) => (
                    <Box
                      component="img"
                      key={index}
                      src={photo}
                      sx={{
                        width: 96,
                        height: 96,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {report.triageResult && (
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <TriageResult result={report.triageResult} />
              </CardContent>
            </Card>
          )}

          {outbreakCircles.length > 0 && (
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2 }}>
                <Typography fontWeight={600} fontSize={15}>
                  {t('reports.relatedOutbreak')}
                </Typography>
              </Box>
              <Box sx={{ height: 320 }}>
                <GeoMap markers={markers} circles={outbreakCircles} height={320} zoom={9} />
              </Box>
            </Card>
          )}

          {relatedOutbreak && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography fontWeight={600} fontSize={13}>
                {relatedOutbreak.diseaseName}
              </Typography>
              <Typography fontSize={12}>
                {relatedOutbreak.confirmedCases} {t('outbreaks.confirmedCases')} ·{' '}
                {relatedOutbreak.atRiskAnimals} {t('outbreaks.atRiskAnimals')}
              </Typography>
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('reports.statusTimeline')}
              </Typography>
              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {report.statusHistory.map((entry, index) => {
                  const isCurrent = entry.status === report.status
                  return (
                    <TimelineItem key={index} sx={{ minHeight: 56 }}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            entry.status === 'resolved'
                              ? 'success'
                              : isCurrent
                                ? 'primary'
                                : 'grey'
                          }
                          variant={isCurrent ? 'filled' : 'outlined'}
                        >
                          {entry.status === 'resolved' ? (
                            <CheckCircleIcon fontSize="small" />
                          ) : entry.status === 'confirmed' ? (
                            <WarningAmberIcon fontSize="small" />
                          ) : (
                            <ScheduleIcon fontSize="small" />
                          )}
                        </TimelineDot>
                        {index < report.statusHistory.length - 1 && (
                          <TimelineConnector />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: 0, pr: 1 }}>
                        <Typography fontSize={13} fontWeight={isCurrent ? 700 : 500}>
                          {t(`status.${entry.status}`)}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {formatDateTime(entry.timestamp)}
                        </Typography>
                        {entry.note && (
                          <Typography fontSize={12} color="text.secondary">
                            {entry.note}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  )
                })}
              </Timeline>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontWeight={600} fontSize={15} mb={2}>
                {t('common.actions')}
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  color={
                    currentStatusIndex >= 1 ? 'primary' : 'primary'
                  }
                  startIcon={<RocketLaunchIcon />}
                  onClick={() => {
                    setStatusUpdate({ status: 'triaged', note: '' })
                    setStatusDialog(true)
                  }}
                >
                  {t('reports.escalate')}
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  disabled={currentStatusIndex >= 3}
                  onClick={() => {
                    setStatusUpdate({ status: 'resolved', note: '' })
                    setStatusDialog(true)
                  }}
                >
                  {t('reports.resolve')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {t('updateReportStatus')}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>{t('common.status')}</InputLabel>
            <Select
              value={statusUpdate.status}
              onChange={(e) =>
                setStatusUpdate({ ...statusUpdate, status: e.target.value as ReportStatus })
              }
              label={t('common.status')}
            >
              {['triaged', 'confirmed', 'resolved'].map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`status.${status}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t('reports.description')}
            value={statusUpdate.note}
            onChange={(e) =>
              setStatusUpdate({ ...statusUpdate, note: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({
                status: statusUpdate.status,
                note: statusUpdate.note,
              })
            }
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}