'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Establishment, SearchResult, WebsiteStatus } from '@/app/types/establishment'

const STATUS_COLOR: Record<WebsiteStatus, string> = {
  none:        '#f97316', // orange
  unreachable: '#9ca3af', // gray
  outdated:    '#f59e0b', // amber
  active:      '#22c55e', // green
  blocked:     '#a855f7', // purple
}

const STATUS_LABEL: Record<WebsiteStatus, string> = {
  none:        'Pas de site',
  unreachable: 'Site injoignable',
  outdated:    'Site obsolète',
  active:      'Site actif',
  blocked:     'Bloqué anti-bot',
}

function getZoom(radiusMeters: number): number {
  if (radiusMeters <=  1000) return 15
  if (radiusMeters <=  2000) return 14
  if (radiusMeters <=  5000) return 13
  if (radiusMeters <= 10000) return 12
  if (radiusMeters <= 25000) return 11
  return 10
}

const STATUS_SYMBOL: Record<WebsiteStatus, string> = {
  none:        '!',
  unreachable: '?',
  outdated:    '~',
  active:      '✓',
  blocked:     '⛔',
}

function dotIcon(color: string, status: WebsiteStatus) {
  const symbol = STATUS_SYMBOL[status]
  return L.divIcon({
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 1px 5px rgba(0,0,0,.35);
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#fff;line-height:1;
    " role="img" aria-label="${STATUS_LABEL[status]}">${symbol}</div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
    className:  '',
  })
}

export default function Map({
  data, establishments, fullHeight = false,
}: {
  data: SearchResult
  establishments?: Establishment[]
  fullHeight?: boolean
}) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<L.Map | null>(null)
  const markersRef       = useRef<L.LayerGroup | null>(null)
  const shown = establishments ?? data.establishments

  // Initialisation de la carte (centre, cercle de rayon) — une seule fois par recherche
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [data.center.lat, data.center.lng],
      getZoom(data.radius)
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Cercle du rayon de recherche
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#10b981'
    const circle = L.circle([data.center.lat, data.center.lng], {
      radius:      data.radius,
      color:       accentColor,
      fillColor:   accentColor,
      fillOpacity: 0.05,
      weight:      1.5,
      dashArray:   '6 4',
    }).addTo(map)

    // Marqueur central
    L.circleMarker([data.center.lat, data.center.lng], {
      radius:      5,
      color:       '#fff',
      fillColor:   accentColor,
      fillOpacity: 1,
      weight:      2,
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)

    // Ajuste la vue sur le cercle de recherche
    map.fitBounds(circle.getBounds().pad(0.1))

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [data])

  // Marqueurs des établissements — recréés à chaque changement de filtre, sans toucher au zoom/pan
  useEffect(() => {
    const layer = markersRef.current
    if (!layer) return
    layer.clearLayers()

    shown.forEach(e => {
      const color = STATUS_COLOR[e.websiteStatus]
      const label = STATUS_LABEL[e.websiteStatus]

      // Le popup Leaflet a toujours un fond blanc, quel que soit le thème de l'app
      const popupText = '#1a1a1a'
      const popupMuted = '#666'
      const popupBtnBg = '#1a1a1a'
      const popupBtnFg = '#fff'

      L.marker([e.lat, e.lng], { icon: dotIcon(color, e.websiteStatus) })
        .bindPopup(
          `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:170px;padding:2px 0">
            <p style="margin:0 0 2px;font-weight:700;font-size:13px;color:${popupText}">${e.name || 'Sans nom'}</p>
            <p style="margin:0 0 8px;font-size:11px;color:${popupMuted}">${e.type.replace(/_/g,' ')}</p>
            <span style="
              display:inline-block;padding:2px 8px;border-radius:9999px;
              font-size:11px;font-weight:600;
              background:${color}18;color:${color};
            ">${label}</span>
            <div style="margin-top:10px">
              <a href="/results/${e.id}" style="
                display:inline-block;padding:5px 12px;border-radius:7px;
                background:${popupBtnBg};color:${popupBtnFg};font-size:11px;font-weight:600;
                text-decoration:none;
              ">Voir la fiche →</a>
            </div>
          </div>`,
          { minWidth: 180, closeButton: true }
        )
        .addTo(layer)
    })
  }, [shown])

  return (
    <div className={fullHeight ? 'relative h-full' : 'relative'}>
      <div
        ref={containerRef}
        role="img"
        aria-label="Carte des résultats de recherche"
        className={fullHeight
          ? 'h-full w-full overflow-hidden'
          : 'h-56 sm:h-80 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700'}
      />
      {/* Légende */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600 dark:text-slate-300 shadow-sm border border-gray-100 dark:border-slate-700">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full flex-shrink-0 block" />
            {STATUS_LABEL[status as WebsiteStatus]}
          </div>
        ))}
      </div>
    </div>
  )
}
