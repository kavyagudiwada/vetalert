import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
  }
}

export default function GoogleSignIn({
  onCredential,
}: {
  onCredential: (idToken: string) => void
}) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return

    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response?.credential) callbackRef.current(response.credential)
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        logo_alignment: 'left',
      })
    }

    if (window.google?.accounts?.id) {
      render()
      return
    }
    if (document.getElementById('google-gsi-script')) {
      const existing = document.getElementById('google-gsi-script')
      existing?.addEventListener('load', render)
      return () => existing?.removeEventListener('load', render)
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', render)
    document.body.appendChild(script)
    return () => script.removeEventListener('load', render)
  }, [])

  if (!CLIENT_ID) {
    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Typography fontSize={12} color="text.secondary">
          Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in the
          frontend .env file.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
      <div ref={buttonRef} />
    </Box>
  )
}