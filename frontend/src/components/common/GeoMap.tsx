import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Typography } from '@mui/material'
import type { GeoLocation } from '../../types'
import { getSeverityColor } from '../../utils/helpers'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface MapMarker {
  id: string
  position: GeoLocation
  title?: string
  description?: string
  color?: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface MapPolygon {
  id: string
  positions: [number, number][]
  color?: string
  fillOpacity?: number
  label?: string
}

export interface MapCircle {
  id: string
  center: GeoLocation
  radiusMeters: number
  color?: string
  label?: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface HeatPoint {
  position: GeoLocation
  intensity: number
  title?: string
}

interface GeoMapProps {
  markers?: MapMarker[]
  polygons?: MapPolygon[]
  circles?: MapCircle[]
  heatPoints?: HeatPoint[]
  center?: GeoLocation
  zoom?: number
  height?: number | string
  onMarkerClick?: (marker: MapMarker) => void
  onMapClick?: (location: GeoLocation) => void
  interactive?: boolean
}

function MapRecenter({
  center,
  zoom,
}: {
  center: GeoLocation | undefined
  zoom: number | undefined
}) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo([center.latitude, center.longitude], zoom ?? map.getZoom())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.latitude, center?.longitude])
  return null
}

function createSeverityIcon(severity: string): L.DivIcon {
  const color = getSeverityColor(severity as 'critical' | 'high' | 'medium' | 'low')
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    "><div style="
      width: 10px; height: 10px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
  })
}

function defaultIcon(color?: string): L.DivIcon {
  const bg = color || '#4f46e5'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 22px; height: 22px;
      background: ${bg};
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  })
}

function heatStyle(color: string): L.DivIcon {
  return L.divIcon({
    className: 'pulse-dot',
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 0 12px ${color};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const defaultCenter: GeoLocation = {
  latitude: 20.593684,
  longitude: 78.96288,
}

export default function GeoMap({
  markers = [],
  polygons = [],
  circles = [],
  heatPoints = [],
  center,
  zoom = 5,
  height = 400,
  onMarkerClick,
  onMapClick,
  interactive = true,
}: GeoMapProps) {
  const mapCenter = center || {
    latitude:
      markers[0]?.position.latitude ??
      circles[0]?.center.latitude ??
      heatPoints[0]?.position.latitude ??
      defaultCenter.latitude,
    longitude:
      markers[0]?.position.longitude ??
      circles[0]?.center.longitude ??
      heatPoints[0]?.position.longitude ??
      defaultCenter.longitude,
  }
  const mapZoom =
    markers.length === 1 || circles.length === 1
      ? Math.max(zoom, 10)
      : zoom

  return (
    <Box
      sx={{
        width: '100%',
        height,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 0,
      }}
    >
      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={mapZoom}
        scrollWheelZoom={interactive}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} zoom={zoom} />

        {heatPoints.map((heat, index) => {
          const intensity = Math.min(Math.max(heat.intensity, 0), 1)
          const color =
            intensity > 0.7
              ? '#dc2626'
              : intensity > 0.4
                ? '#f59e0b'
                : '#10b981'
          return (
            <Marker
              key={`heat-${index}`}
              position={[heat.position.latitude, heat.position.longitude]}
              icon={heatStyle(color)}
            >
              {heat.title && (
                <Popup>
                  <Typography fontSize={13} fontWeight={600}>
                    {heat.title}
                  </Typography>
                  <Typography fontSize={12}>
                    Risk: {Math.round(intensity * 100)}%
                  </Typography>
                </Popup>
              )}
            </Marker>
          )
        })}

        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.positions}
            pathOptions={{
              color: polygon.color || '#4f46e5',
              fillColor: polygon.color || '#4f46e5',
              fillOpacity: polygon.fillOpacity ?? 0.25,
              weight: 2,
            }}
          >
            {polygon.label && (
              <Popup>
                <Typography fontSize={13}>{polygon.label}</Typography>
              </Popup>
            )}
          </Polygon>
        ))}

        {circles.map((circle) => (
          <Circle
            key={circle.id}
            center={[circle.center.latitude, circle.center.longitude]}
            radius={circle.radiusMeters}
            pathOptions={{
              color: circle.color || '#f59e0b',
              fillColor: circle.color || '#f59e0b',
              fillOpacity: 0.15,
              weight: 2,
            }}
          >
            {circle.label && (
              <Popup>
                <Typography fontSize={13}>{circle.label}</Typography>
              </Popup>
            )}
          </Circle>
        ))}

        {markers.map((marker) => {
          const icon = marker.severity
            ? createSeverityIcon(marker.severity)
            : defaultIcon(marker.color)
          return (
            <Marker
              key={marker.id}
              position={[marker.position.latitude, marker.position.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(marker),
              }}
            >
              {(marker.title || marker.description) && (
                <Popup>
                  {marker.title && (
                    <Typography fontSize={13} fontWeight={600}>
                      {marker.title}
                    </Typography>
                  )}
                  {marker.description && (
                    <Typography fontSize={12} color="text.secondary">
                      {marker.description}
                    </Typography>
                  )}
                </Popup>
              )}
            </Marker>
          )
        })}

        {onMapClick && interactive && (
          <MapClickHandler onMapClick={onMapClick} />
        )}
      </MapContainer>
    </Box>
  )
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (location: GeoLocation) => void
}) {
  const map = useMap()
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, onMapClick])
  return null
}