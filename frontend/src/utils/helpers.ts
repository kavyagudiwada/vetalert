import { format, isValid, parseISO } from 'date-fns'
import type { SeverityLevel, ReportStatus, LabSampleStatus } from '../types'

export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'MMM d, yyyy',
): string {
  if (!date) return '-'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '-'
  return format(parsed, pattern)
}

export function formatDateTime(
  date: string | Date | null | undefined,
  pattern = 'MMM d, yyyy h:mm a',
): string {
  return formatDate(date, pattern)
}

export function timeAgo(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return formatDate(parsed)
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'
    case 'high':
      return '#ef4444'
    case 'medium':
      return '#f59e0b'
    case 'low':
      return '#10b981'
    default:
      return '#6b7280'
  }
}

export function getSeverityBg(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return '#fef2f2'
    case 'high':
      return '#fee2e2'
    case 'medium':
      return '#fffbeb'
    case 'low':
      return '#ecfdf5'
    default:
      return '#f3f4f6'
  }
}

export function getStatusColor(status: ReportStatus | string): string {
  switch (status) {
    case 'reported':
      return '#3b82f6'
    case 'triaged':
      return '#8b5cf6'
    case 'confirmed':
      return '#ec4899'
    case 'resolved':
      return '#10b981'
    case 'under_investigation':
      return '#f59e0b'
    case 'closed':
      return '#6b7280'
    default:
      return '#6b7280'
  }
}

export function getStatusBg(status: ReportStatus | string): string {
  switch (status) {
    case 'reported':
      return '#eff6ff'
    case 'triaged':
      return '#f5f3ff'
    case 'confirmed':
      return '#fdf2f8'
    case 'resolved':
      return '#ecfdf5'
    case 'under_investigation':
      return '#fffbeb'
    case 'closed':
      return '#f3f4f6'
    default:
      return '#f3f4f6'
  }
}

export function getLabStatusColor(status: LabSampleStatus | string): string {
  switch (status) {
    case 'collected':
      return '#3b82f6'
    case 'received':
      return '#8b5cf6'
    case 'testing':
      return '#f59e0b'
    case 'ready':
      return '#10b981'
    case 'disposed':
      return '#6b7280'
    default:
      return '#6b7280'
  }
}

export function getLabStatusKey(status: LabSampleStatus | string): string {
  switch (status) {
    case 'collected':
      return 'labs.sampleCollected'
    case 'received':
      return 'labs.sampleReceived'
    case 'testing':
      return 'labs.testingInProgress'
    case 'ready':
      return 'labs.resultReady'
    default:
      return `status.${status}`
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(1)}L`
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function capitalize(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}