import { useCallback, useEffect, useState } from 'react'
import type { GeoLocation } from '../types'

interface GeolocationState {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  supported: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    supported: 'geolocation' in navigator,
  })

  const getPosition = useCallback(
    (highAccuracy = true): Promise<GeoLocation> =>
      new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation not supported'))
          return
        }
        const fail = (error: GeolocationPositionError) => {
          const message =
            error.code === error.PERMISSION_DENIED
              ? 'Location permission denied'
              : error.code === error.POSITION_UNAVAILABLE
                ? 'Location unavailable'
                : 'Location request timed out'
          setState({ location: null, loading: false, error: message, supported: true })
          reject(new Error(message))
        }
        const attempt = (accuracy: boolean) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }
              setState({
                location,
                loading: false,
                error: null,
                supported: true,
              })
              resolve(location)
            },
            (error) => {
              if (accuracy) {
                attempt(false)
              } else {
                fail(error)
              }
            },
            {
              enableHighAccuracy: accuracy,
              timeout: accuracy ? 5000 : 15000,
              maximumAge: 0,
            },
          )
        }
        attempt(highAccuracy)
      }),
    [],
  )

  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const location = await getPosition()
      return location
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get location',
      }))
      throw error
    }
  }, [getPosition])

  useEffect(() => {
    if ('geolocation' in navigator) {
      getPosition().catch(() => {
        // Ignore initial location fetch failure
      })
    }
  }, [getPosition])

  return {
    ...state,
    requestLocation,
  }
}
