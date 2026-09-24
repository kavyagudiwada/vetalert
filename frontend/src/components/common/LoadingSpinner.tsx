import { Box, CircularProgress, Skeleton } from '@mui/material'

interface LoadingSpinnerProps {
  size?: number
  variant?: 'spinner' | 'skeleton'
  rows?: number
}

export default function LoadingSpinner({
  size = 40,
  variant = 'spinner',
  rows = 5,
}: LoadingSpinnerProps) {
  if (variant === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={48}
            sx={{ mb: 1, borderRadius: 2, bgcolor: 'divider' }}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 6,
        width: '100%',
      }}
    >
      <CircularProgress size={size} thickness={4} />
    </Box>
  )
}