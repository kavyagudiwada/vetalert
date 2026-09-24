import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import AddIcon from '@mui/icons-material/Add'
import BiotechIcon from '@mui/icons-material/Biotech'
import toast from 'react-hot-toast'
import { labSamplesApi } from '../../api/endpoints'
import DataTable, { type Column } from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDateTime, getLabStatusKey } from '../../utils/helpers'
import { LAB_SAMPLE_STATUSES, SAMPLE_TYPES } from '../../utils/constants'
import type { LabSample, LabSampleStatus } from '../../types'

export default function LabSamples() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null)
  const [newStatus, setNewStatus] = useState<LabSampleStatus>('received')
  const [result, setResult] = useState('')
  const [notes, setNotes] = useState('')

  const [newSampleOpen, setNewSampleOpen] = useState(false)
  const [newSample, setNewSample] = useState({
    sampleId: '',
    sampleType: 'blood',
    testedFor: '',
    notes: '',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['lab-samples', statusFilter, typeFilter, search, page],
    queryFn: async () =>
      (
        await labSamplesApi.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sampleType: typeFilter !== 'all' ? typeFilter : undefined,
          search: search || undefined,
          page: page + 1,
          pageSize,
        })
      ).data,
  })

  const samples: LabSample[] = data?.items ?? []

  const updateStatus = useMutation({
    mutationFn: () =>
      labSamplesApi.update(selectedSample!.id, {
        status: newStatus,
        result: result || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      setStatusDialogOpen(false)
      setSelectedSample(null)
      setResult('')
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['lab-samples'] })
    },
  })

  const createSample = useMutation({
    mutationFn: () =>
      labSamplesApi.create({
        sampleId: newSample.sampleId,
        sampleType: newSample.sampleType,
        collectedOn: new Date().toISOString(),
        collectedAt: { latitude: 20.59, longitude: 78.96 },
        testedFor: newSample.testedFor,
        notes: newSample.notes || undefined,
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      setNewSampleOpen(false)
      setNewSample({ sampleId: '', sampleType: 'blood', testedFor: '', notes: '' })
      queryClient.invalidateQueries({ queryKey: ['lab-samples'] })
    },
  })

  const openStatusDialog = (sample: LabSample) => {
    setSelectedSample(sample)
    setNewStatus(sample.status)
    setResult(sample.result ?? '')
    setNotes(sample.notes ?? '')
    setStatusDialogOpen(true)
  }

  const columns: Column<LabSample>[] = [
    {
      key: 'sampleId',
      label: t('labs.sampleId'),
      render: (row) => (
        <Typography fontSize={13} fontWeight={600} color="primary">
          {row.sampleId}
        </Typography>
      ),
    },
    {
      key: 'sampleType',
      label: t('labs.sampleType'),
      render: (row) => (
        <Chip
          label={t(`labs.${row.sampleType}`)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      key: 'testedFor',
      label: t('labs.testRequested'),
      render: (row) => row.testedFor,
      hideOnMobile: true,
    },
    {
      key: 'collectedOn',
      label: t('labs.collectedDate'),
      render: (row) => formatDateTime(row.collectedOn),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: t('labs.currentStatus'),
      render: (row) => <StatusBadge status={row.status} type="lab" />,
    },
    {
      key: 'actions',
      label: t('common.actions'),
      align: 'right',
      render: (row) => (
        <Button size="small" variant="outlined" onClick={() => openStatusDialog(row)}>
          {t('labs.updateStatus')}
        </Button>
      ),
    },
  ]

  const filters = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          {LAB_SAMPLE_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(getLabStatusKey(status))}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>{t('labs.sampleType')}</InputLabel>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(0)
          }}
          label={t('labs.sampleType')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {SAMPLE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {t(`labs.${type}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
            <BiotechIcon />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {t('labs.samples')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewSampleOpen(true)}
        >
          {t('common.save')}
        </Button>
      </Box>

      <DataTable<LabSample>
        columns={columns}
        data={samples}
        loading={isLoading}
        error={error ? String(error) : null}
        searchable
        onSearch={(query) => {
          setSearch(query)
          setPage(0)
        }}
        filters={filters}
        emptyMessage={t('labs.noSamples')}
        keyExtractor={(row) => row.id}
        page={page}
        pageSize={pageSize}
        totalCount={data?.total}
        onPageChange={setPage}
        onPageSizeChange={() => setPage(0)}
      />

      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t('labs.updateStatus')} — {selectedSample?.sampleId}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>{t('labs.currentStatus')}</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LabSampleStatus)}
              label={t('labs.currentStatus')}
            >
              {LAB_SAMPLE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(getLabStatusKey(status))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t('reports.description')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => updateStatus.mutate()}
            disabled={updateStatus.isPending}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newSampleOpen}
        onClose={() => setNewSampleOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('labs.sampleCollected')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('labs.sampleId')}
            value={newSample.sampleId}
            onChange={(e) => setNewSample({ ...newSample, sampleId: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('labs.sampleType')}</InputLabel>
            <Select
              value={newSample.sampleType}
              onChange={(e) => setNewSample({ ...newSample, sampleType: e.target.value })}
              label={t('labs.sampleType')}
            >
              {SAMPLE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`labs.${type}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label={t('labs.testRequested')}
            value={newSample.testedFor}
            onChange={(e) => setNewSample({ ...newSample, testedFor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t('reports.description')}
            value={newSample.notes}
            onChange={(e) => setNewSample({ ...newSample, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSampleOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={createSample.isPending || !newSample.sampleId}
            onClick={() => createSample.mutate()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}