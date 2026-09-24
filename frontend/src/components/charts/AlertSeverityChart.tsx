import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../common/LoadingSpinner'
import { getSeverityColor } from '../../utils/helpers'

export interface SeverityDatum {
  severity: 'critical' | 'high' | 'medium' | 'low'
  count: number
}

interface AlertSeverityChartProps {
  data: SeverityDatum[]
  loading?: boolean
  height?: number
  title?: string
}

export default function AlertSeverityChart({
  data = [],
  loading = false,
  height = 280,
  title,
}: AlertSeverityChartProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <LoadingSpinner />
      </Paper>
    )
  }

  const chartData = ['critical', 'high', 'medium', 'low'].map((level) => {
    const match = data.find((item) => item.severity === level)
    return {
      severity: level,
      count: match?.count ?? 0,
    }
  })

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography fontWeight={600} fontSize={15} mb={1}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            vertical={false}
          />
          <XAxis
            dataKey="severity"
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => t(`status.${value}`)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number) => [value, t('common.count')]}
            labelFormatter={(label) => t(`status.${label}`)}
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              fontSize: 13,
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {chartData.map((entry) => (
              <Cell
                key={entry.severity}
                fill={getSeverityColor(entry.severity as 'critical' | 'high' | 'medium' | 'low')}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}