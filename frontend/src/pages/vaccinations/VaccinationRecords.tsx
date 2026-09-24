import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { vaccinationsApi } from '../../api/endpoints'
import DataTable, {
  type Column,
  type SortDirection,
} from '../../components/common/DataTable'
import { formatDate } from '../../utils/helpers'
import { VACCINE_LIST } from '../../utils/constants'
import type { Vaccination } from '../../types'

export default function VaccinationRecords() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [vaccineFilter, setVaccineFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data, isLoading, error } = useQuery({
    queryKey: ['vaccinations', vaccineFilter, search, page, sortKey, sortDirection],
    queryFn: async () =>
      (
        await vaccinationsApi.list({
          vaccine: vaccineFilter !== 'all' ? vaccineFilter : undefined,
          search: search || undefined,
          page: page + 1,
          pageSize,
          sortKey: sortKey || undefined,
          sortDirection,
        })
      ).data,
  })

  const records: Vaccination[] = data?.items ?? []

  const columns: Column<Vaccination>[] = [
    {
      key: 'vaccineName',
      label: t('vaccinations.vaccineName'),
      sortable: true,
      render: (row) => (
        <Typography fontSize={13} fontWeight={600}>
          {row.vaccineName}
        </Typography>
      ),
    },
    {
      key: 'animalId',
      label: t('animals.tagId'),
      render: (row) => row.animalId,
    },
    {
      key: 'batchNumber',
      label: t('vaccinations.batchNumber'),
      render: (row) => row.batchNumber,
      hideOnMobile: true,
    },
    {
      key: 'doseNumber',
      label: t('vaccinations.doseNumber'),
      align: 'center',
      render: (row) => `#${row.doseNumber}`,
    },
    {
      key: 'administeredOn',
      label: t('common.date'),
      sortable: true,
      render: (row) => formatDate(row.administeredOn),
    },
    {
      key: 'nextDueOn',
      label: t('vaccinations.nextDue'),
      render: (row) => {
        const overdue = new Date(row.nextDueOn) < new Date()
        return (
          <Typography
            fontSize={12}
            fontWeight={600}
            color={overdue ? 'error.main' : 'success.main'}
          >
            {formatDate(row.nextDueOn)} {overdue && `(${t('vaccinations.overdue')})`}
          </Typography>
        )
      },
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
        <Typography variant="h5" fontWeight={700}>
          {t('vaccinations.records')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => navigate('/vaccinations')}
        >
          {t('vaccinations.schedule')}
        </Button>
      </Box>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('vaccinations.vaccineName')}</InputLabel>
          <Select
            value={vaccineFilter}
            onChange={(e) => {
              setVaccineFilter(e.target.value)
              setPage(0)
            }}
            label={t('vaccinations.vaccineName')}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {VACCINE_LIST.map((vaccine) => (
              <MenuItem key={vaccine} value={vaccine}>
                {t(`vaccinations.${vaccine}Vaccine`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label={t('common.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      <DataTable<Vaccination>
        columns={columns}
        data={records}
        loading={isLoading}
        error={error ? String(error) : null}
        searchable={false}
        emptyMessage={t('common.noData')}
        keyExtractor={(row) => row.id}
        page={page}
        pageSize={pageSize}
        totalCount={data?.total}
        onPageChange={setPage}
        onPageSizeChange={() => setPage(0)}
        onSort={(key: string, direction: SortDirection) => {
          setSortKey(key)
          setSortDirection(direction)
          setPage(0)
        }}
      />
    </Box>
  )
}