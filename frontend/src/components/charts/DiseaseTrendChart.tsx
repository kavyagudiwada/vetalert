import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../common/LoadingSpinner'

export interface TrendPoint {
  date: string
  [key: string]: string | number
}

interface DiseaseTrendChartProps {
  data: TrendPoint[]
  loading?: boolean
  series?: { key: string; color: string }[]
  height?: number
  title?: string
}

export default function DiseaseTrendChart({
  data = [],
  loading = false,
  series = [
    { key: 'cases', color: '#6366f1' },
    { key: 'confirmed', color: '#ef4444' },
  ],
  height = 300,
  title,
}: DiseaseTrendChartProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <LoadingSpinner />
      </Paper>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography fontWeight={600} fontSize={15} mb={1}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={t(`dashboard.${s.key}`)}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}