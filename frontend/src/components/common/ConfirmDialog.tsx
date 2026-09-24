import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  severity?: 'warning' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  severity = 'warning',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  const isDanger = severity === 'danger'

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <Box sx={{ display: 'flex', p: 2, pb: 0 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDanger
              ? 'error.light'
              : 'warning.light',
            color: isDanger ? 'error.main' : 'warning.main',
            mr: 2,
            flexShrink: 0,
          }}
        >
          {isDanger ? <DeleteOutlineIcon /> : <WarningAmberIcon />}
        </Box>
        <Box>
          <DialogTitle sx={{ p: 0, pb: 1, fontSize: 17 }}>
            {title || t('common.confirm')}
          </DialogTitle>
        </Box>
      </Box>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14 }}>
          {message || 'Are you sure you want to continue?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {cancelText || t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color={isDanger ? 'error' : 'warning'}
          onClick={onConfirm}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}