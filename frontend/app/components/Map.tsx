'use client'

import { useState, useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Parcel } from '@/lib/types'

export default function Map({ 
  onParcelSelect 
}: { 
  onParcelSelect: (parcel: Parcel) => void 
}) {
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  
  useEffect(() => {
    const mapInstance = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [32.8543, 39.9199], // Ankara
      zoom: 10,
    })
    
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right')
    
    mapInstance.on('load', () => {
      // Add parcel layer (example)
      mapInstance.addSource('parcels', {
        type: 'vector',
        url: 'http://localhost:7800/services/postgis/public.parsel/{z}/{x}/{y}.pbf'
      })
      
      mapInstance.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        'source-layer': 'public.parsel',
        paint: {
          'fill-color': '#c9a227',
          'fill-opacity': 0.3
        }
      })
      
      mapInstance.addLayer({
        id: 'parcels-border',
        type: 'line',
        source: 'parcels',
        'source-layer': 'public.parsel',
        paint: {
          'line-color': '#c9a227',
          'line-width': 1
        }
      })
      
      // Click handler
      mapInstance.on('click', 'parcels-fill', (e) => {
        const feature = e.features?.[0]
        if (feature) {
          // In a real app, you would fetch parcel details from the API
          const parcel: Parcel = {
            id: feature.id as string,
            ada: feature.properties?.ada,
            parsel: feature.properties?.parsel,
            il: feature.properties?.il,
            ilce: feature.properties?.ilce,
            mahalle: feature.properties?.mahalle,
            geometri: feature,
            imarDurumu: 'Kırmızı Alan',
            planlar: []
          }
          onParcelSelect(parcel)
        }
      })
    })
    
    setMap(mapInstance)
    
    return () => {
      mapInstance.remove()
    }
  }, [onParcelSelect])
  
  return (
    <div id="map" className="w-full h-full rounded-lg" />
  )
}