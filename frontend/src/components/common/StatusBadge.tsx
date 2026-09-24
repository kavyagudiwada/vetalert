import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  getSeverityColor,
  getSeverityBg,
  getStatusColor,
  getStatusBg,
  getLabStatusKey,
} from '../../utils/helpers'
import type { SeverityLevel, ReportStatus, LabSampleStatus } from '../../types'

interface StatusBadgeProps {
  status: SeverityLevel | ReportStatus | LabSampleStatus | string
  type?: 'severity' | 'status' | 'lab'
  size?: 'small' | 'medium'
  label?: string
}

export default function StatusBadge({
  status,
  type = 'severity',
  size = 'small',
  label,
}: StatusBadgeProps) {
  const { t } = useTranslation()

  const color =
    type === 'severity'
      ? getSeverityColor(status as SeverityLevel)
      : type === 'lab'
        ? getStatusColor(status as LabSampleStatus)
        : getStatusColor(status as ReportStatus)

  const bg =
    type === 'severity'
      ? getSeverityBg(status as SeverityLevel)
      : type === 'lab'
        ? getStatusBg(status as LabSampleStatus)
        : getStatusBg(status as ReportStatus)

  const display =
    label || (type === 'lab' ? getLabStatusKey(status) : `status.${status}`)

  return (
    <Chip
      size={size}
      label={t(display)}
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 600,
        fontSize: size === 'small' ? 11 : 13,
        borderRadius: 6,
        textTransform: 'none',
        height: size === 'small' ? 22 : 28,
        '& .MuiChip-label': {
          px: size === 'small' ? 1.5 : 2,
        },
      }}
    />
  )
}