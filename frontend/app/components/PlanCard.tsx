'use client'

import { useState } from 'react'
import { Plan } from '@/lib/types'

export default function PlanCard({ plan }: { plan: Plan }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="card mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-heading text-lg">
          {plan.adi}
        </h3>
        <span className="text-accent">
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-2">
          <p><span className="font-medium">Tip:</span> {plan.tipi}</p>
          <p><span className="font-medium">Durum:</span> {plan.durum}</p>
          <p><span className="font-medium">Tarih:</span> {plan.tarih}</p>
          <p><span className="font-medium">Belediye:</span> {plan.belediye.adi}</p>
          <button className="btn-primary mt-2">
            Planı Görüntüle
          </button>
        </div>
      )}
    </div>
  )
}