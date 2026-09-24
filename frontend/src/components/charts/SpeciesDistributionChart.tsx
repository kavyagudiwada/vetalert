import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../common/LoadingSpinner'

export interface SpeciesDatum {
  species: string
  value: number
}

const SPECIES_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
]

interface SpeciesDistributionChartProps {
  data: SpeciesDatum[]
  loading?: boolean
  height?: number
  title?: string
}

export default function SpeciesDistributionChart({
  data = [],
  loading = false,
  height = 300,
  title,
}: SpeciesDistributionChartProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <LoadingSpinner />
      </Paper>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography fontWeight={600} fontSize={15} mb={1}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="species"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            cornerRadius={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.species}
                fill={SPECIES_COLORS[index % SPECIES_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              t(`animals.${name}`),
            ]}
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              fontSize: 13,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => t(`animals.${value}`)}
          />
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>
        {total.toLocaleString()} total animals
      </Box>
    </Box>
  )
}