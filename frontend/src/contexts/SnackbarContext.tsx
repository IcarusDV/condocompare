'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material'

// --- Types ---

interface SnackbarItem {
  id: number
  message: string
  severity: AlertColor
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity: AlertColor) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

// --- Context ---

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

// --- Transition ---

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />
}

// --- Counter for unique IDs ---

let nextId = 0

// --- Provider ---

const AUTO_HIDE_DURATION = 4000

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SnackbarItem[]>([])
  const [current, setCurrent] = useState<SnackbarItem | null>(null)
  const [open, setOpen] = useState(false)

  const processQueue = useCallback((items: SnackbarItem[]) => {
    if (items.length > 0) {
      const [next, ...rest] = items
      setCurrent(next)
      setQueue(rest)
      setOpen(true)
    }
  }, [])

  const showSnackbar = useCallback(
    (message: string, severity: AlertColor) => {
      const newItem: SnackbarItem = {
        id: nextId++,
        message,
        severity,
      }

      if (current === null) {
        // No notification currently showing, display immediately
        setCurrent(newItem)
        setOpen(true)
      } else {
        // Add to queue
        setQueue((prev) => [...prev, newItem])
      }
    },
    [current]
  )

  const showSuccess = useCallback(
    (message: string) => showSnackbar(message, 'success'),
    [showSnackbar]
  )

  const showError = useCallback(
    (message: string) => showSnackbar(message, 'error'),
    [showSnackbar]
  )

  const showWarning = useCallback(
    (message: string) => showSnackbar(message, 'warning'),
    [showSnackbar]
  )

  const showInfo = useCallback(
    (message: string) => showSnackbar(message, 'info'),
    [showSnackbar]
  )

  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return
      }
      setOpen(false)
    },
    []
  )

  const handleExited = useCallback(() => {
    // After the exit animation completes, process the next item in the queue
    setCurrent(null)
    setQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        const [next, ...rest] = prevQueue
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          setCurrent(next)
          setOpen(true)
        }, 150)
        return rest
      }
      return prevQueue
    })
  }, [])

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}

      <Snackbar
        key={current?.id}
        open={open}
        autoHideDuration={AUTO_HIDE_DURATION}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
          },
        }}
      >
        {current ? (
          <Alert
            onClose={handleClose}
            severity={current.severity}
            variant="filled"
            elevation={6}
            sx={{
              width: '100%',
              minWidth: 300,
              borderRadius: 2,
              fontWeight: 500,
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '& .MuiAlert-icon': {
                fontSize: 22,
              },
            }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

// --- Hook ---

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext)
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}
