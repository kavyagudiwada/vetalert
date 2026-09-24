import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import AddIcon from '@mui/icons-material/Add'
import MapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { alertsApi } from '../../api/endpoints'
import DataTable, { type Column } from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import GeoMap, { type MapMarker, type MapCircle } from '../../components/common/GeoMap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDateTime, timeAgo, getSeverityColor } from '../../utils/helpers'
import { SEVERITY_LEVELS } from '../../utils/constants'
import type { Alert } from '../../types'

export default function AlertList() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter, page],
    queryFn: async () =>
      (
        await alertsApi.list({
          severity: severityFilter !== 'all' ? severityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: page + 1,
          pageSize,
        })
      ).data,
  })

  const alerts: Alert[] = data?.items ?? []

  const markers: MapMarker[] = useMemo(
    () =>
      alerts.map((alert) => ({
        id: alert.id,
        position: alert.location,
        title: alert.title,
        description: `${alert.affectedArea} · ${t(`status.${alert.severity}`)}`,
        severity: alert.severity,
      })),
    [alerts, t],
  )

  const circles: MapCircle[] = useMemo(
    () =>
      alerts.map((alert) => ({
        id: `circle-${alert.id}`,
        center: alert.location,
        radiusMeters: alert.radiusKm * 1000,
        color: getSeverityColor(alert.severity),
        label: `${alert.title} (${alert.radiusKm} km)`,
        severity: alert.severity,
      })),
    [alerts],
  )

  const columns: Column<Alert>[] = [
    {
      key: 'title',
      label: t('alerts.alertTitle'),
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveIcon
            sx={{ color: getSeverityColor(row.severity), fontSize: 20 }}
          />
          <Box>
            <Typography fontSize={13} fontWeight={600}>
              {row.title}
            </Typography>
            <Typography fontSize={11} color="text.secondary">
              {row.message.slice(0, 60)}
              {row.message.length > 60 ? '...' : ''}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'severity',
      label: t('alerts.severity'),
      render: (row) => <StatusBadge status={row.severity} type="severity" />,
    },
    {
      key: 'affectedArea',
      label: t('alerts.affectedArea'),
      render: (row) => (
        <>
          {row.affectedArea}
          <Typography fontSize={11} color="text.secondary">
            {row.radiusKm} km radius
          </Typography>
        </>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => <StatusBadge status={row.status} type="status" />,
    },
    {
      key: 'createdAt',
      label: t('common.date'),
      render: (row) => (
        <Box>
          <Typography fontSize={12}>{formatDateTime(row.createdAt)}</Typography>
          <Typography fontSize={11} color="text.secondary">
            {timeAgo(row.createdAt)}
          </Typography>
        </Box>
      ),
      hideOnMobile: true,
    },
  ]

  const filters = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>{t('alerts.severity')}</InputLabel>
        <Select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value)
            setPage(0)
          }}
          label={t('alerts.severity')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {SEVERITY_LEVELS.map((severity) => (
            <MenuItem key={severity} value={severity}>
              {t(`status.${severity}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>{t('common.status')}</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(0)
          }}
          label={t('common.status')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="active">{t('status.active')}</MenuItem>
          <MenuItem value="expired">{t('status.closed')}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  )

  if (isLoading && alerts.length === 0) return <LoadingSpinner />

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
        <Typography variant="h5" fontWeight={700}>
          {t('alerts.activeAlerts')}
        </Typography>
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
            startIcon={<AddIcon />}
            onClick={() => navigate('/alerts/new')}
          >
            {t('alerts.createAlert')}
          </Button>
        </Stack>
      </Box>

      {view === 'list' ? (
        <DataTable<Alert>
          columns={columns}
          data={alerts}
          loading={isLoading}
          searchable={false}
          filters={filters}
          emptyMessage={t('alerts.noAlerts')}
          keyExtractor={(row) => row.id}
          page={page}
          pageSize={pageSize}
          totalCount={data?.total}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(0)}
        />
      ) : (
        <Box sx={{ height: 'calc(100vh - 240px)' }}>
          <Box sx={{ mb: 1.5 }}>{filters}</Box>
          {alerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              {t('alerts.noAlerts')}
            </Box>
          ) : (
            <GeoMap markers={markers} circles={circles} height={'100%'} zoom={6} />
          )}
        </Box>
      )}
    </Box>
  )
}