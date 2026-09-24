import { useMemo, useState } from 'react'
import {
  Box,
  Chip,
  Typography,
  InputBase,
  Paper,
  alpha,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { SYMPTOMS, SYMPTOM_CATEGORIES } from '../../utils/constants'

interface SymptomSelectorProps {
  value: string[]
  onChange: (symptoms: string[]) => void
  max?: number
}

export default function SymptomSelector({
  value,
  onChange,
  max = 10,
}: SymptomSelectorProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [search, setSearch] = useState('')

  const filteredSymptoms = useMemo(() => {
    if (!search.trim()) return SYMPTOMS
    const query = search.toLowerCase()
    return Object.fromEntries(
      Object.entries(SYMPTOMS).filter(([, symptoms]) =>
        symptoms.some((symptom) => {
          const translated = t(`symptoms.${symptom}`).toLowerCase()
          return (
            translated.includes(query) || symptom.toLowerCase().includes(query)
          )
        }),
      ),
    )
  }, [search, t])

  const toggleSymptom = (symptom: string) => {
    if (value.includes(symptom)) {
      onChange(value.filter((s) => s !== symptom))
    } else if (value.length < max) {
      onChange([...value, symptom])
    }
  }

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', borderRadius: 2 }}
      >
        <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
        <InputBase
          fullWidth
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ fontSize: 14 }}
        />
      </Paper>

      {value.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
            Selected ({value.length}/{max})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {value.map((symptom) => (
              <Chip
                key={symptom}
                label={t(`symptoms.${symptom}`)}
                size="small"
                color="primary"
                onDelete={() => toggleSymptom(symptom)}
              />
            ))}
          </Box>
        </Box>
      )}

      {Object.entries(filteredSymptoms)
        .filter(([, symptoms]) => symptoms.length > 0)
        .map(([category, symptoms]) => {
          const categoryInfo = SYMPTOM_CATEGORIES.find(
            (c) => c.key === category,
          )
          const selectedCount = symptoms.filter((s) => value.includes(s)).length
          return (
            <Box key={category} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: categoryInfo?.color,
                    mr: 1,
                  }}
                />
                <Typography fontSize={13} fontWeight={600}>
                  {t(`symptoms.${category}`)}
                </Typography>
                {selectedCount > 0 && (
                  <Typography
                    fontSize={11}
                    color="primary"
                    sx={{ ml: 1, fontWeight: 600 }}
                  >
                    {selectedCount} selected
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {symptoms.map((symptom) => {
                  const selected = value.includes(symptom)
                  return (
                    <Chip
                      key={symptom}
                      label={t(`symptoms.${symptom}`)}
                      onClick={() => toggleSymptom(symptom)}
                      icon={
                        selected ? (
                          <CheckCircleIcon />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )
                      }
                      sx={{
                        bgcolor: selected
                          ? alpha(categoryInfo?.color || '#6366f1', 0.15)
                          : theme.palette.background.default,
                        border: 1,
                        borderColor: selected
                          ? categoryInfo?.color || '#6366f1'
                          : theme.palette.divider,
                        color: selected
                          ? categoryInfo?.color || '#6366f1'
                          : 'text.primary',
                        fontWeight: selected ? 600 : 400,
                        '& .MuiChip-label': { fontSize: 12 },
                        '& .MuiChip-icon': {
                          color: categoryInfo?.color || '#6366f1',
                        },
                        '&:hover': {
                          borderColor: categoryInfo?.color || '#6366f1',
                        },
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
          )
        })}
    </Box>
  )
}