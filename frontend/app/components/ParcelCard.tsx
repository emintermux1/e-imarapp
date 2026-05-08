'use client'

import { useState } from 'react'
import { Parcel } from '@/lib/types'

export default function ParcelCard({ parcel }: { parcel: Parcel }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="card mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-heading text-lg">
          {parcel.ilce} / {parcel.ada}-{parcel.parsel}
        </h3>
        <span className="text-accent">
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-2">
          <p><span className="font-medium">Mahalle:</span> {parcel.mahalle}</p>
          <p><span className="font-medium">İmar Durumu:</span> {parcel.imarDurumu}</p>
          <p><span className="font-medium">Plan Sayısı:</span> {parcel.planlar.length}</p>
          <button className="btn-primary mt-2">
            Detayları Gör
          </button>
        </div>
      )}
    </div>
  )
}