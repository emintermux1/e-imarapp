import Map from '@/app/components/Map'
import ParcelCard from '@/app/components/ParcelCard'
import PlanCard from '@/app/components/PlanCard'
import { Parcel, Plan } from '@/lib/types'

export default function Dashboard() {
  // In a real app, these would come from API calls
  const mockParcels: Parcel[] = [
    {
      id: '1',
      ada: '123',
      parsel: '45',
      il: 'Ankara',
      ilce: 'Çankaya',
      mahalle: 'Öveçler',
      geometri: {} as any,
      imarDurumu: 'Kırmızı Alan',
      planlar: []
    }
  ]
  
  const mockPlans: Plan[] = [
    {
      id: '1',
      adi: 'Öveçler Mahallesi İmar Planı',
      tipi: 'Uygulama Planı',
      durum: 'Onaylandı',
      tarih: '2026-01-15',
      belediye: {
        id: '1',
        adi: 'Çankaya Belediyesi',
        slug: 'cankaya',
        il: 'Ankara',
        ilce: 'Çankaya'
      }
    }
  ]
  
  const handleParcelSelect = (parcel: Parcel) => {
    console.log('Selected parcel:', parcel)
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        <div className="lg:col-span-2 card h-[600px]">
          <Map onParcelSelect={handleParcelSelect} />
        </div>
        
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-heading mb-4">Parseller</h2>
            {mockParcels.map(parcel => (
              <ParcelCard key={parcel.id} parcel={parcel} />
            ))}
          </div>
          
          <div className="card">
            <h2 className="text-xl font-heading mb-4">Planlar</h2>
            {mockPlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}