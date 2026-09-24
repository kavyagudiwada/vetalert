import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import AddIcon from '@mui/icons-material/Add'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import PetsIcon from '@mui/icons-material/Pets'
import { animalsApi } from '../../api/endpoints'
import DataTable, { type Column } from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { SPECIES_LIST } from '../../utils/constants'
import { formatDateTime } from '../../utils/helpers'
import type { Animal } from '../../types'

const SPECIES_EMOJI: Record<string, string> = {
  cattle: '🐄',
  buffalo: '🐃',
  goat: '🐐',
  sheep: '🐑',
  pig: '🐖',
  poultry: '🐔',
  horse: '🐎',
  camel: '🐫',
}

export default function AnimalList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 12

  const { data, isLoading } = useQuery({
    queryKey: ['animals', speciesFilter, districtFilter, search, page],
    queryFn: async () =>
      (
        await animalsApi.list({
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
          district: districtFilter || undefined,
          search: search || undefined,
          page: page + 1,
          pageSize,
        })
      ).data,
  })

  const animals: Animal[] = data?.items ?? []

  const columns: Column<Animal>[] = [
    {
      key: 'tagId',
      label: t('animals.tagId'),
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ fontSize: 22 }}>{SPECIES_EMOJI[row.species]}</Box>
          <Box>
            <Typography fontSize={13} fontWeight={600}>
              {row.tagId}
            </Typography>
            <Typography fontSize={11} color="text.secondary">
              {row.name || '-'}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'registrationNumber',
      label: t('animals.registrationNumber'),
      render: (row) => row.registrationNumber,
      hideOnMobile: true,
    },
    {
      key: 'species',
      label: t('reports.species'),
      render: (row) => t(`animals.${row.species}`),
    },
    {
      key: 'breed',
      label: t('animals.breed'),
      hideOnMobile: true,
    },
    {
      key: 'ageYears',
      label: t('animals.age'),
      render: (row) => `${row.ageYears}y${row.ageMonths ? ` ${row.ageMonths}m` : ''}`,
    },
    {
      key: 'district',
      label: t('reports.district'),
      render: (row) => row.district,
      hideOnMobile: true,
    },
    {
      key: 'healthStatus',
      label: t('common.status'),
      render: (row) => (
        <StatusBadge status={row.healthStatus || 'healthy'} type="status" />
      ),
    },
  ]

  const filters = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          {['Nagpur', 'Pune', 'Amravati', 'Nashik'].map((district) => (
            <MenuItem key={district} value={district}>
              {district}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )

  if (isLoading && animals.length === 0) return <LoadingSpinner />

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
          {t('nav.animals')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('reports.listView')}>
            <IconButton
              color={view === 'grid' ? 'primary' : 'default'}
              onClick={() => setView('grid')}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('reports.listView')}>
            <IconButton
              color={view === 'list' ? 'primary' : 'default'}
              onClick={() => setView('list')}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/animals/new')}
          >
            {t('animals.register')}
          </Button>
        </Stack>
      </Box>

      {view === 'list' ? (
        <DataTable<Animal>
          columns={columns}
          data={animals}
          loading={isLoading}
          searchable
          onSearch={(query) => {
            setSearch(query)
            setPage(0)
          }}
          filters={filters}
          emptyMessage={t('common.noData')}
          keyExtractor={(row) => row.id}
          page={page}
          pageSize={pageSize}
          totalCount={data?.total}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(0)}
          onRowClick={(row) => navigate(`/animals/${row.id}`)}
        />
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              {filters}
            </Stack>
          </Box>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Grid container spacing={2}>
              {animals.map((animal) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={animal.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                      height: '100%',
                    }}
                    onClick={() => navigate(`/animals/${animal.id}`)}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'primary.main',
                            color: 'white',
                          }}
                        >
                          <PetsIcon />
                        </Box>
                        <StatusBadge
                          status={animal.healthStatus || 'healthy'}
                          type="status"
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
                        <Box sx={{ fontSize: 20 }}>{SPECIES_EMOJI[animal.species]}</Box>
                        <Box>
                          <Typography fontWeight={700} fontSize={15}>
                            {animal.name || animal.tagId}
                          </Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {animal.breed} · {t(`animals.${animal.species}`)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography fontSize={11} color="text.secondary">
                            {t('animals.age')}
                          </Typography>
                          <Typography fontSize={13} fontWeight={600}>
                            {animal.ageYears}y {animal.ageMonths ? `${animal.ageMonths}m` : ''}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography fontSize={11} color="text.secondary">
                            {t('animals.tagId')}
                          </Typography>
                          <Typography fontSize={13} fontWeight={600}>
                            {animal.tagId}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography fontSize={11} color="text.secondary">
                            {t('reports.district')}
                          </Typography>
                          <Typography fontSize={13} fontWeight={600}>
                            {animal.district}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography fontSize={11} color="text.secondary" mt={1.5}>
                        {formatDateTime(animal.createdAt, 'MMM d, yyyy')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}