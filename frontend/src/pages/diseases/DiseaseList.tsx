import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  InputBase,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  alpha,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import CoronavirusIcon from '@mui/icons-material/Coronavirus'
import ScienceIcon from '@mui/icons-material/Science'
import { diseasesApi } from '../../api/endpoints'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { SPECIES_LIST } from '../../utils/constants'
import type { Disease } from '../../types'

const DISEASE_EMOJI: Record<string, string> = {
  fmd: '🐄',
  anthrax: '☠️',
  brucellosis: '🥛',
  peste: '🐐',
  rinderpest: '🐂',
  blueTongue: '👅',
  swineFever: '🐖',
  mastitis: '🥛',
  johne: '🐑',
  lumpySkin: '🐄',
  rabies: '🐕',
  glanders: '🐎',
}

export default function DiseaseList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme = useTheme()

  const [search, setSearch] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [zoonoticOnly, setZoonoticOnly] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['diseases', search, speciesFilter, zoonoticOnly],
    queryFn: async () =>
      (
        await diseasesApi.list({
          search: search || undefined,
          species: speciesFilter !== 'all' ? speciesFilter : undefined,
          zoonotic: zoonoticOnly || undefined,
        })
      ).data,
  })

  const diseases: Disease[] = data?.items ?? []

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          {t('nav.diseases')}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2,
            mb: 1.5,
            maxWidth: 420,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            fullWidth
            placeholder={t('diseases.searchHint')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: 14 }}
          />
        </Paper>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('diseases.speciesAffected')}</InputLabel>
            <Select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              label={t('diseases.speciesAffected')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {SPECIES_LIST.map((species) => (
                <MenuItem key={species} value={species}>
                  {t(`animals.${species}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip
            icon={<CoronavirusIcon />}
            label={t('diseases.zoonotic')}
            color={zoonoticOnly ? 'primary' : 'default'}
            onClick={() => setZoonoticOnly(!zoonoticOnly)}
          />
        </Stack>
      </Box>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Grid container spacing={2}>
          {diseases.map((disease) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={disease.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => navigate(`/diseases/${disease.id}`)}
              >
                <Box
                  sx={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 56,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    position: 'relative',
                  }}
                >
                  {DISEASE_EMOJI[disease.id] ?? (
                    <ScienceIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                  )}
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <StatusBadge status={disease.severity} type="severity" />
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography fontWeight={700} fontSize={15} flex={1}>
                      {disease.name}
                    </Typography>
                    {disease.zoonotic && (
                      <Chip
                        size="small"
                        icon={<CoronavirusIcon />}
                        label={t('diseases.zoonotic')}
                        color="error"
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                    )}
                  </Stack>
                  <Typography
                    fontSize={12}
                    color="text.secondary"
                    mb={1}
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {disease.description}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {disease.speciesAffected.slice(0, 3).map((species) => (
                      <Chip
                        key={species}
                        size="small"
                        label={t(`animals.${species}`)}
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                    ))}
                    {disease.speciesAffected.length > 3 && (
                      <Chip
                        size="small"
                        label={`+${disease.speciesAffected.length - 3}`}
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}