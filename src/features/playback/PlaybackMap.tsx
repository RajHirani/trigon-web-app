import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { AttributionControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { ATTRIBUTION, GOOGLE_SUBDOMAINS, markerIcon, TILES } from '@/features/liveTrack/LiveMap'
import { vehicleKindOf } from '@/features/liveTrack/vehicleIcons'
import type { MapLayer } from '@/features/liveTrack/types'
import { useThemeStore } from '@/store/themeStore'
import { sampleAt, type Sample } from './analyze'
import { MarkerCard } from './MarkerCard'
import type { MarkerSelection, PlaybackPoint, TripAnalysis } from './types'

type LL = [number, number]
// Keep a popup clear of the floating UI: the panel (left, ~420px), the header (top) and the player bar (bottom).
const POPUP_PAD_WIDE = { topLeft: [440, 110] as LL, bottomRight: [90, 180] as LL }
// Phones stack the header and panel at the top, so the whole top part is reserved.
const POPUP_PAD_NARROW = { topLeft: [16, 290] as LL, bottomRight: [70, 200] as LL }
const POPUP_OFFSET: LL = [0, -16]

/** Round numbered / lettered marker. Colours are tokens so it follows the theme. */
function badge(html: string, o: { bg: string; fg: string; border?: string; size?: number; halo?: boolean }) {
  const size = o.size ?? 26
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="box-sizing:border-box;width:${size}px;height:${size}px;border-radius:50%;background:${o.bg};color:${o.fg};border:3px solid ${o.border ?? 'var(--surface)'};box-shadow:${o.halo ? '0 0 0 7px color-mix(in srgb, var(--primary) 28%, transparent),' : ''}0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font:600 11px/1 Poppins,system-ui,sans-serif">${html}</div>`,
  })
}

const START_ICON = badge('S', { bg: 'var(--moving)', fg: '#fff' })
const END_ICON = badge('E', { bg: 'var(--surface)', fg: 'var(--text-primary)', border: 'var(--text-primary)' })

/** Keeps the vehicle in view while Follow is on: re-centres only once it leaves the middle of the map. */
function FollowController({ lat, lng, follow, onUserMove }: { lat: number; lng: number; follow: boolean; onUserMove: () => void }) {
  const map = useMap()
  useMapEvents({ dragstart: onUserMove })
  useEffect(() => {
    if (follow && !map.getBounds().pad(-0.3).contains([lat, lng])) map.panTo([lat, lng], { animate: false })
  }, [map, follow, lat, lng])
  return null
}

/** Shows the whole route (clear of the panel and the controls) whenever a new route arrives. */
function FitRoute({ latlngs }: { latlngs: LL[] }) {
  const map = useMap()
  useEffect(() => {
    if (latlngs.length < 2) return
    const wide = map.getSize().x >= 1000
    map.fitBounds(L.latLngBounds(latlngs), {
      paddingTopLeft: wide ? [460, 110] : [40, 130],
      paddingBottomRight: wide ? [90, 180] : [70, 180],
      animate: false,
    })
  }, [map, latlngs])
  return null
}

type NumberMarkerProps = {
  kind: MarkerSelection['kind']
  n: number
  lat: number
  lng: number
  /** Stops the vehicle has not reached yet are drawn grey. */
  reached: boolean
  chosen: boolean
  onSelect: (s: MarkerSelection) => void
}

/** Numbered stop (dark, grey until reached) or red "!" over-speed marker. The icon is rebuilt only when its look changes. */
function NumberMarker({ kind, n, lat, lng, reached, chosen, onSelect }: NumberMarkerProps) {
  const icon = useMemo(
    () =>
      kind === 'stop'
        ? badge(String(n), { bg: reached ? 'var(--text-primary)' : 'var(--text-muted)', fg: 'var(--surface)', halo: chosen })
        : badge('!', { bg: 'var(--stopped)', fg: '#fff', size: 24, halo: chosen }),
    [kind, n, reached, chosen],
  )
  const position = useMemo<LL>(() => [lat, lng], [lat, lng])
  const events = useMemo(() => ({ click: () => onSelect({ kind, n }) }), [kind, n, onSelect])
  return <Marker position={position} icon={icon} zIndexOffset={kind === 'stop' ? 600 : 700} keyboard={false} eventHandlers={events} />
}

function ClickAway({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

type Props = {
  points: PlaybackPoint[]
  analysis: TripAnalysis
  /** Vehicle type text ("Truck"), picks the top-down icon as in Live Track. */
  vehicleType: string
  pos: number
  layer: MapLayer
  follow: boolean
  selection: MarkerSelection | null
  onUserMove: () => void
  onReady: (map: L.Map) => void
  onSelect: (s: MarkerSelection | null) => void
  onPlayFrom: (idx: number) => void
}

/** Full-screen map of the route. Figma: Playback / Desktop / Light. Pass an empty `points` for the no-route states. */
export function PlaybackMap({ points, analysis, vehicleType, pos, layer, follow, selection, onUserMove, onReady, onSelect, onPlayFrom }: Props) {
  const mode = useThemeStore((s) => s.mode)
  const latlngs = useMemo<LL[]>(() => points.map((p) => [p.lat, p.lng]), [points])
  const hasRoute = points.length > 1
  const cur = hasRoute ? sampleAt(points, pos) : null
  const whole = Math.floor(pos)
  const kind = vehicleKindOf(vehicleType)
  const moving = (cur?.speed ?? 0) >= 1
  const heading = Math.round(cur?.heading ?? 0)
  const vehicle = useMemo(() => markerIcon(moving ? 'moving' : 'stopped', kind, heading), [moving, kind, heading])

  const primary = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#0a66c2',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  )
  const danger = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue('--stopped').trim() || '#dc2626',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  )
  const casing = layer !== 'street' ? 'rgba(0,0,0,0.45)' : mode === 'dark' ? 'rgba(0,0,0,0.5)' : '#ffffff'

  const travelled = useMemo<LL[]>(
    () => (cur ? [...latlngs.slice(0, whole + 1), [cur.lat, cur.lng]] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latlngs, whole, cur?.lat, cur?.lng],
  )

  const lastIdx = points.length - 1
  const fastSegments = useMemo(
    () => analysis.overSpeed.map((e) => ({ n: e.n, positions: latlngs.slice(e.startIdx, Math.min(lastIdx, e.endIdx + 1) + 1) })),
    [analysis.overSpeed, latlngs, lastIdx],
  )

  const stop = selection?.kind === 'stop' ? analysis.stops.find((s) => s.n === selection.n) : undefined
  const event = selection?.kind === 'overSpeed' ? analysis.overSpeed.find((e) => e.n === selection.n) : undefined
  const tappedAt = selection?.kind === 'vehicle' ? (selection.pos ?? 0) : null
  const tapped = useMemo<Sample | undefined>(
    () => (tappedAt !== null && points.length > 1 ? sampleAt(points, tappedAt) : undefined),
    [points, tappedAt],
  )
  const anchor = stop ?? event ?? tapped
  // Stable props: a new array every tick would make the popup close and reopen about 20 times a second.
  const anchorPos = useMemo<LL | null>(() => (anchor ? [anchor.lat, anchor.lng] : null), [anchor?.lat, anchor?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  const pad = typeof window !== 'undefined' && window.innerWidth >= 768 ? POPUP_PAD_WIDE : POPUP_PAD_NARROW
  const popupEvents = useMemo(() => ({ remove: () => onSelect(null) }), [onSelect])

  const start = latlngs[0] ?? ([22.98, 72.59] as LL)
  return (
    <MapContainer
      ref={(m) => {
        if (m) onReady(m)
      }}
      center={start}
      zoom={12}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full bg-app"
    >
      <AttributionControl position="bottomright" prefix={false} />
      <TileLayer
        key={layer}
        className={layer === 'street' && mode === 'dark' ? 'dark-tiles' : undefined}
        url={TILES[layer].url}
        subdomains={GOOGLE_SUBDOMAINS}
        attribution={ATTRIBUTION}
        maxZoom={20}
      />
      <ClickAway onClick={() => onSelect(null)} />

      {hasRoute && cur && (
        <>
          <FitRoute latlngs={latlngs} />
          <Polyline positions={latlngs} pathOptions={{ color: casing, weight: 10, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={latlngs} pathOptions={{ color: primary, weight: 6, opacity: 0.32, lineCap: 'round', lineJoin: 'round' }} />
          {fastSegments.map((s) => (
            <Polyline key={`ahead-${s.n}`} positions={s.positions} pathOptions={{ color: danger, weight: 6, opacity: 0.45, lineCap: 'butt' }} />
          ))}
          <Polyline positions={travelled} pathOptions={{ color: primary, weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          {analysis.overSpeed.map((e) => {
            if (pos <= e.startIdx) return null
            const upTo = Math.min(pos, e.endIdx + 1)
            const end = sampleAt(points, upTo)
            const positions: LL[] = [...latlngs.slice(e.startIdx, Math.floor(upTo) + 1), [end.lat, end.lng]]
            return <Polyline key={`done-${e.n}`} positions={positions} pathOptions={{ color: danger, weight: 6, opacity: 1, lineCap: 'butt' }} />
          })}

          <Marker position={latlngs[0]!} icon={START_ICON} keyboard={false} zIndexOffset={400} />
          <Marker position={latlngs[lastIdx]!} icon={END_ICON} keyboard={false} zIndexOffset={400} />

          {analysis.stops.map((s) => (
            <NumberMarker
              key={`stop-${s.n}`}
              kind="stop"
              n={s.n}
              lat={s.lat}
              lng={s.lng}
              reached={pos >= s.idx}
              chosen={selection?.kind === 'stop' && selection.n === s.n}
              onSelect={onSelect}
            />
          ))}
          {analysis.overSpeed.map((e) => (
            <NumberMarker
              key={`fast-${e.n}`}
              kind="overSpeed"
              n={e.n}
              lat={e.lat}
              lng={e.lng}
              reached
              chosen={selection?.kind === 'overSpeed' && selection.n === e.n}
              onSelect={onSelect}
            />
          ))}

          <Marker
            position={[cur.lat, cur.lng]}
            icon={vehicle}
            keyboard={false}
            zIndexOffset={1000}
            eventHandlers={{ click: () => onSelect({ kind: 'vehicle', n: 0, pos }) }}
          />
          <FollowController lat={cur.lat} lng={cur.lng} follow={follow} onUserMove={onUserMove} />
        </>
      )}

      {selection && anchor && anchorPos && (
        <Popup
          key={`${selection.kind}-${selection.n}-${selection.pos ?? ''}`}
          position={anchorPos}
          className="pb-popup"
          closeButton={false}
          autoPanPaddingTopLeft={pad.topLeft}
          autoPanPaddingBottomRight={pad.bottomRight}
          offset={POPUP_OFFSET}
          minWidth={296}
          maxWidth={296}
          eventHandlers={popupEvents}
        >
          <MarkerCard
            selection={selection}
            stop={stop}
            event={event}
            vehicle={tapped}
            playIdx={stop ? stop.idx : event ? event.startIdx : (tappedAt ?? 0)}
            onClose={() => onSelect(null)}
            onPlayFrom={onPlayFrom}
          />
        </Popup>
      )}
    </MapContainer>
  )
}
