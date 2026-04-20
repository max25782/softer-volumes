'use client'

import { useRef, useEffect, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { categoryConfig } from '@/lib/utils'
import type { Guide, Place } from '@/lib/types'

// Set your Mapbox token in .env.local
// NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

interface GuideMapProps {
  places: Place[]
  selectedPlace: Place | null
  onSelectPlace: (place: Place) => void
  guide: Guide
}

// Luxury light map style — customize in Mapbox Studio
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11'

export function GuideMap({
  places,
  selectedPlace,
  onSelectPlace,
  guide,
}: GuideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Default center per city
    const centers: Record<string, [number, number]> = {
      seoul:     [126.9780, 37.5665],
      tokyo:     [139.6917, 35.6895],
      bangkok:   [100.5018, 13.7563],
      bali:      [115.1889, -8.4095],
      singapore: [103.8198, 1.3521],
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: centers[guide.slug] ?? [126.9780, 37.5665],
      zoom: 12.5,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [guide.slug])

  // Sync markers when places change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const addMarkers = () => {
      // Remove old markers not in new places
      const newIds = new Set(places.map((p) => p.id))
      markersRef.current.forEach((marker, id) => {
        if (!newIds.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
        }
      })

      // Add new markers
      places.forEach((place) => {
        if (markersRef.current.has(place.id)) return

        const config = categoryConfig[place.category]

        // Custom marker element
        const el = document.createElement('div')
        el.className = 'guide-marker'
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: #f4efe5;
          border: 1.5px solid #b8965a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(10,9,6,0.15);
        `
        el.innerHTML = config.icon
        el.title = place.name

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.background = '#b8965a'
          el.style.zIndex = '10'
        })
        el.addEventListener('mouseleave', () => {
          if (selectedPlace?.id !== place.id) {
            el.style.transform = 'scale(1)'
            el.style.background = '#f4efe5'
          }
        })

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([place.lng, place.lat])
          .addTo(map)

        marker.getElement().addEventListener('click', () => {
          onSelectPlace(place)
        })

        markersRef.current.set(place.id, marker)
      })
    }

    if (map.isStyleLoaded()) {
      addMarkers()
    } else {
      map.once('load', addMarkers)
    }
  }, [places, onSelectPlace, selectedPlace?.id])

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      if (id === selectedPlace?.id) {
        el.style.transform = 'scale(1.3)'
        el.style.background = '#b8965a'
        el.style.borderColor = '#b8965a'
        el.style.zIndex = '20'
      } else {
        el.style.transform = 'scale(1)'
        el.style.background = '#f4efe5'
        el.style.borderColor = '#b8965a'
        el.style.zIndex = '1'
      }
    })

    // Fly to selected
    if (selectedPlace && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedPlace.lng, selectedPlace.lat],
        zoom: 15,
        duration: 800,
        essential: true,
      })

      // Show popup
      popupRef.current?.remove()
      popupRef.current = new mapboxgl.Popup({
        offset: 20,
        closeButton: false,
        className: 'guide-popup',
        maxWidth: '220px',
      })
        .setLngLat([selectedPlace.lng, selectedPlace.lat])
        .setHTML(`
          <div style="font-family: var(--font-josefin, sans-serif); padding: 4px;">
            <p style="font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #b8965a; margin-bottom: 4px;">
              ${categoryConfig[selectedPlace.category].label}
            </p>
            <p style="font-size: 15px; font-family: var(--font-cormorant, serif); font-weight: 400; color: #0a0906; margin-bottom: 4px;">
              ${selectedPlace.name}
            </p>
            <p style="font-size: 10px; color: #9e9488; letter-spacing: 0.05em;">
              ${selectedPlace.district}
            </p>
          </div>
        `)
        .addTo(mapRef.current)
    }
  }, [selectedPlace])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Map attribution */}
      <div className="absolute bottom-2 left-2">
        <span className="text-[8px] tracking-[0.1em] text-mist/40">
          © Mapbox © OpenStreetMap
        </span>
      </div>
    </div>
  )
}
