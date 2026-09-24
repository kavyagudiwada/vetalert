import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import AddIcon from '@mui/icons-material/Add'
import MapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import { symptomReportsApi } from '../../api/endpoints'
import DataTable, { type Column } from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import GeoMap, { type MapMarker } from '../../components/common/GeoMap'
import { formatDateTime } from '../../utils/helpers'
import { REPORT_STATUSES, SEVERITY_LEVELS, SPECIES_LIST } from '../../utils/constants'
import type { SymptomReport } from '../../types'

export default function ReportList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [statusFilter, setStatusFilter] = useState('all')
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [page, setPage] = useState(0)

  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'reports',
      statusFilter,
      speciesFilter,
      severityFilter,
      districtFilter,
      search,
      page,
    ],
    queryFn: async () =>
      (
        await symptomReportsApi.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
          district: districtFilter || undefined,
          search: search || undefined,
          page: page + 1,
          pageSize,
        })
      ).data,
  })

  const reports: SymptomReport[] = data?.items ?? []

  const markers: MapMarker[] = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        position: report.location,
        title: `${t(`animals.${report.species}`)} — ${report.district}`,
        description: `${report.symptoms.length} symptoms · ${t(
          `status.${report.status}`,
        )}`,
        severity: report.severity,
      })),
    [reports, t],
  )

  const columns: Column<SymptomReport>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (row) => (
        <Typography fontSize={13} fontWeight={600} color="primary">
          #{row.id.slice(0, 8)}
        </Typography>
      ),
    },
    {
      key: 'species',
      label: t('reports.species'),
      render: (row) => t(`animals.${row.species}`),
      hideOnMobile: true,
    },
    {
      key: 'symptoms',
      label: t('reports.selectSymptoms'),
      render: (row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.symptoms.slice(0, 3).map((symptom) => (
            <Chip
              key={symptom}
              label={t(`symptoms.${symptom}`)}
              size="small"
              sx={{ fontSize: 10, fontWeight: 500 }}
            />
          ))}
          {row.symptoms.length > 3 && (
            <Chip
              label={`+${row.symptoms.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 10 }}
            />
          )}
        </Stack>
      ),
    },
    {
      key: 'district',
      label: t('reports.district'),
      render: (row) => `${row.village}, ${row.district}`,
      hideOnMobile: true,
    },
    {
      key: 'severity',
      label: t('alerts.severity'),
      render: (row) => <StatusBadge status={row.severity} type="severity" />,
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => <StatusBadge status={row.status} type="status" />,
    },
    {
      key: 'createdAt',
      label: t('common.date'),
      sortable: true,
      render: (row) => (
        <Typography fontSize={12} color="text.secondary">
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
  ]

  const handleSearch = (query: string) => {
    setSearch(query)
    setPage(0)
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setSpeciesFilter('all')
    setSeverityFilter('all')
    setDistrictFilter('')
    setSearch('')
    setPage(0)
  }

  const filters = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 120 }}>
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
          {REPORT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`status.${status}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('reports.species')}</InputLabel>
        <Select
          value={speciesFilter}
          onChange={(e) => {
            setSpeciesFilter(e.target.value)
            setPage(0)
          }}
          label={t('reports.species')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {SPECIES_LIST.map((species) => (
            <MenuItem key={species} value={species}>
              {t(`animals.${species}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
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
        <InputLabel>{t('reports.district')}</InputLabel>
        <Select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value)
            setPage(0)
          }}
          label={t('reports.district')}
        >
          <MenuItem value="">{t('common.all')}</MenuItem>
          {['Nagpur', 'Pune', 'Amravati', 'Nashik', 'Aurangabad', 'Kolhapur'].map(
            (district) => (
              <MenuItem key={district} value={district}>
                {district}
              </MenuItem>
            ),
          )}
        </Select>
      </FormControl>

      <Button size="small" onClick={clearFilters}>
        {t('common.reset')}
      </Button>
    </Stack>
  )

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
          {t('nav.reports')}
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
            onClick={() => navigate('/reports/new')}
          >
            {t('reports.newReport')}
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        <Chip
          icon={<MyLocationIcon />}
          label={`${reports.length} ${t('common.count').toLowerCase()}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Stack>

      {view === 'list' ? (
        <DataTable<SymptomReport>
          columns={columns}
          data={reports}
          loading={isLoading}
          error={error ? String(error) : null}
          searchable
          onSearch={handleSearch}
          filters={filters}
          emptyMessage={t('reports.noReports')}
          keyExtractor={(row) => row.id}
          page={page}
          pageSize={pageSize}
          totalCount={data?.total}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(0)}
          onRowClick={(row) => navigate(`/reports/${row.id}`)}
        />
      ) : (
        <Box sx={{ height: 'calc(100vh - 240px)' }}>
          {reports.length === 0 && !isLoading ? (
            <Typography textAlign="center" py={4} color="text.secondary">
              {t('reports.noReports')}
            </Typography>
          ) : (
            <GeoMap
              markers={markers}
              height={'100%'}
              zoom={6}
              onMarkerClick={(marker) => navigate(`/reports/${marker.id}`)}
            />
          )}
        </Box>
      )}
    </Box>
  )
}