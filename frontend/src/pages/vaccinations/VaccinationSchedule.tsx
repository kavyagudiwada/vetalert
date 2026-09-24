import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  LinearProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { vaccinationsApi } from '../../api/endpoints'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'
import { VACCINE_LIST } from '../../utils/constants'
import type { Vaccination } from '../../types'

interface ScheduleGroup {
  label: string
  color: string
  items: Vaccination[]
}

export default function VaccinationSchedule() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [vaccineFilter, setVaccineFilter] = useState('all')
  const [month] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const { data, isLoading } = useQuery({
    queryKey: ['vaccinations', 'schedule', vaccineFilter, month],
    queryFn: async () =>
      (
        await vaccinationsApi.schedule({
          vaccine: vaccineFilter !== 'all' ? vaccineFilter : undefined,
          month,
        })
      ).data,
  })

  const vaccinations: Vaccination[] = data ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const groups: ScheduleGroup[] = [
    {
      label: t('vaccinations.overdue'),
      color: '#ef4444',
      items: vaccinations.filter((v) => new Date(v.nextDueOn) < today),
    },
    {
      label: t('vaccinations.dueToday'),
      color: '#f59e0b',
      items: vaccinations.filter((v) => {
        const d = new Date(v.nextDueOn)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      }),
    },
    {
      label: t('vaccinations.upcoming'),
      color: '#10b981',
      items: vaccinations.filter((v) => {
        const d = new Date(v.nextDueOn)
        d.setHours(0, 0, 0, 0)
        return d.getTime() > today.getTime()
      }),
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
          {t('vaccinations.schedule')}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('vaccinations.vaccineName')}</InputLabel>
            <Select
              value={vaccineFilter}
              onChange={(e) => setVaccineFilter(e.target.value)}
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
          <Button
            variant="outlined"
            component={Link}
            to="/vaccinations/records"
          >
            {t('vaccinations.records')}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} mb={3}>
        {groups.map((group) => {
          const totalInScope = vaccinations.length || 1
          const pct = ((group.items.length / totalInScope) * 100).toFixed(0)
          return (
            <Grid item xs={12} sm={4} key={group.label}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={600} fontSize={14}>
                      {group.label}
                    </Typography>
                    <Chip
                      label={group.items.length}
                      size="small"
                      sx={{ bgcolor: `${group.color}20`, color: group.color, fontWeight: 700 }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Number(pct)}
                    sx={{
                      mt: 1.5,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'divider',
                      '& .MuiLinearProgress-bar': { bgcolor: group.color },
                    }}
                  />
                  <Typography fontSize={11} color="text.secondary" mt={0.5}>
                    {pct}% of scheduled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        groups.map((group) => (
          <Card key={group.label} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: group.color,
                }}
              />
              <Typography fontWeight={600} fontSize={14}>
                {group.label}
              </Typography>
            </Box>
            {group.items.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                {t('common.noData')}
              </Box>
            ) : (
              group.items.map((vaccination) => (
                <Box
                  key={vaccination.id}
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate('/vaccinations/records')}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography fontSize={13} fontWeight={600}>
                        {vaccination.vaccineName}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        {t('vaccinations.recordVaccination')} #{vaccination.doseNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography fontSize={11} color="text.secondary">
                        {t('animals.tagId')}
                      </Typography>
                      <Typography fontSize={13} fontWeight={600}>
                        {vaccination.animalId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography fontSize={11} color="text.secondary">
                        {t('vaccinations.nextDue')}
                      </Typography>
                      <Typography fontSize={13} fontWeight={600}>
                        {formatDate(vaccination.nextDueOn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2} textAlign="right">
                      <Chip
                        size="small"
                        label={
                          new Date(vaccination.nextDueOn) < today
                            ? t('vaccinations.overdue')
                            : formatDate(vaccination.nextDueOn)
                        }
                        sx={{
                          bgcolor: `${group.color}20`,
                          color: group.color,
                          fontWeight: 600,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Card>
        ))
      )}
    </Box>
  )
}