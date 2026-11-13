import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { AttributionControl, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { VehicleStatus } from '@/features/dashboard/types'
import { useThemeStore } from '@/store/themeStore'
import type { LiveTrack, MapLayer } from './types'
import { VEHICLE_ICON_SCALE, VEHICLE_ICONS, vehicleKindOf, type VehicleKind } from './vehicleIcons'

// Google tiles straight from Google's tile servers, as requested. NOTE: Google's terms only allow its tiles
// through the Google Maps Platform (Maps JavaScript API / Map Tiles API with a billing key); direct tile URLs
// can be blocked or rate-limited without notice. TODO(prod): switch to the Map Tiles API (same layer types,
// needs an API key) before launch. Dark mode re-colours the Map layer with a CSS filter (`.dark-tiles`).
export const GOOGLE_SUBDOMAINS = ['0', '1', '2', '3']
const googleUrl = (lyrs: string) => `https://mt{s}.google.com/vt/lyrs=${lyrs}&hl=en&x={x}&y={y}&z={z}`
export const TILES: Record<MapLayer, { url: string }> = {
  street: { url: googleUrl('m') },
  satellite: { url: googleUrl('s') },
  hybrid: { url: googleUrl('y') },
}
export const ATTRIBUTION = 'Map data &copy; Google'

/** The mobile app's top-down vehicle, tinted with the status colour and turned to its heading. */
export function markerIcon(status: VehicleStatus, kind: VehicleKind, heading: number) {
  const { svg, width, height } = VEHICLE_ICONS[kind]
  const w = Math.round(width * VEHICLE_ICON_SCALE)
  const h = Math.round(height * VEHICLE_ICON_SCALE)
  const sized = svg.replace(/<svg([^>]*?)\swidth="\d+"\s+height="\d+"/, `<svg$1 width="${w}" height="${h}"`)
  const side = Math.ceil(Math.hypot(w, h))
  return L.divIcon({
    className: '',
    iconSize: [side, side],
    iconAnchor: [side / 2, side / 2],
    html: `<div style="width:${side}px;height:${side}px;display:flex;align-items:center;justify-content:center;transform:rotate(${Math.round(heading)}deg);color:var(--${status});filter:drop-shadow(0 1px 3px rgba(0,0,0,.45))">${sized}</div>`,
  })
}

/** Keeps the vehicle centred while Follow is on; panning the map by hand turns Follow off. */
function FollowController({ position, follow, onUserMove }: { position: [number, number]; follow: boolean; onUserMove: () => void }) {
  const map = useMap()
  useMapEvents({ dragstart: onUserMove })
  useEffect(() => {
    if (follow) map.panTo(position, { animate: true, duration: 0.8 })
  }, [map, follow, position])
  return null
}

type Props = {
  track: LiveTrack
  status: VehicleStatus
  vehicleType: string
  layer: MapLayer
  follow: boolean
  showPath: boolean
  onUserMove: () => void
  onReady: (map: L.Map) => void
}

export function LiveMap({ track, status, vehicleType, layer, follow, showPath, onUserMove, onReady }: Props) {
  const mode = useThemeStore((s) => s.mode)
  const position = useMemo<[number, number]>(() => [track.lat, track.lng], [track.lat, track.lng])
  const kind = vehicleKindOf(vehicleType)
  const heading = Math.round(track.headingDeg)
  const icon = useMemo(() => markerIcon(status, kind, heading), [status, kind, heading])
  // Leaflet writes SVG attributes, so resolve the token to a real colour per theme.
  const primary = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#0a66c2',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  )
  const casing = layer !== 'street' ? 'rgba(0,0,0,0.45)' : mode === 'dark' ? 'rgba(0,0,0,0.5)' : '#ffffff'
  const tiles = TILES[layer]

  return (
    <MapContainer
      ref={(m) => {
        if (m) onReady(m)
      }}
      center={position}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full bg-app"
    >
      <AttributionControl position="bottomright" prefix={false} />
      <TileLayer
        key={layer}
        className={layer === 'street' && mode === 'dark' ? 'dark-tiles' : undefined}
        url={tiles.url}
        subdomains={GOOGLE_SUBDOMAINS}
        attribution={ATTRIBUTION}
        maxZoom={20}
      />
      {showPath && track.path.length > 1 && (
        <>
          <Polyline positions={track.path} pathOptions={{ color: casing, weight: 10, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={track.path} pathOptions={{ color: primary, weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
        </>
      )}
      <Marker position={position} icon={icon} keyboard={false} zIndexOffset={1000} />
      <FollowController position={position} follow={follow} onUserMove={onUserMove} />
    </MapContainer>
  )
}
