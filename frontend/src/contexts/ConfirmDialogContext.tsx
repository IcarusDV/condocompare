'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  severity?: 'error' | 'warning' | 'info'
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

const severityConfig = {
  error: {
    icon: ErrorOutlineIcon,
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    buttonColor: '#dc2626',
    buttonHover: '#b91c1c',
  },
  warning: {
    icon: WarningAmberIcon,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    buttonColor: '#d97706',
    buttonHover: '#b45309',
  },
  info: {
    icon: InfoOutlinedIcon,
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    buttonColor: '#2563eb',
    buttonHover: '#1d4ed8',
  },
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: '',
    message: '',
  })

  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts)
    setOpen(true)

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(true)
    resolveRef.current = null
  }, [])

  const severity = options.severity || 'warning'
  const config = severityConfig[severity]
  const SeverityIcon = config.icon

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 1,
            fontWeight: 700,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SeverityIcon sx={{ color: config.color, fontSize: 22 }} />
          </Box>
          {options.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: 'text.secondary',
              fontSize: '0.925rem',
              lineHeight: 1.6,
            }}
          >
            {options.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderColor: '#e2e8f0',
              color: 'text.secondary',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
              },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {options.cancelText || 'Cancelar'}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            autoFocus
            sx={{
              bgcolor: severity === 'error' ? config.buttonColor : config.buttonColor,
              '&:hover': {
                bgcolor: config.buttonHover,
              },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: 'none',
              '&:active': { boxShadow: 'none' },
            }}
          >
            {options.confirmText || 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider')
  }
  return context
}
