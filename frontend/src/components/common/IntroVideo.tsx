import { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@mui/material'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'

export default function IntroVideo({ onFinished }: { onFinished: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [closing, setClosing] = useState(false)
  const finishedRef = useRef(false)

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setClosing(true)
    window.setTimeout(onFinished, 700)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onError = () => window.setTimeout(finish, 400)
    video.addEventListener('error', onError)
    return () => video.removeEventListener('error', onError)
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        bgcolor: '#000',
        pointerEvents: closing ? 'none' : 'auto',
        animation: closing ? 'intro-fadeout 0.7s ease forwards' : 'none',
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted={muted}
        playsInline
        onEnded={finish}
        onError={() => window.setTimeout(finish, 400)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <IconButton
        aria-label={muted ? 'Unmute intro' : 'Mute intro'}
        onClick={() => setMuted((m) => !m)}
        sx={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          color: '#fff',
          bgcolor: 'rgba(0,0,0,0.45)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
        }}
      >
        {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </IconButton>
    </Box>
  )
}