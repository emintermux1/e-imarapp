import SearchBar from '@/app/components/SearchBar'
import ParcelCard from '@/app/components/ParcelCard'
import PlanCard from '@/app/components/PlanCard'
import { Parcel, Plan } from '@/lib/types'

export default function SearchPage() {
  // In a real app, these would come from API calls
  const mockResults: { parcels: Parcel[], plans: Plan[] } = {
    parcels: [
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
      },
      {
        id: '2',
        ada: '124',
        parsel: '12',
        il: 'Ankara',
        ilce: 'Çankaya',
        mahalle: 'Ulus',
        geometri: {} as any,
        imarDurumu: 'Yeşil Alan',
        planlar: []
      }
    ],
    plans: [
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
      },
      {
        id: '2',
        adi: 'Ulus Bölge Planı',
        tipi: 'Nazım Plan',
        durum: 'Taslak',
        tarih: '2026-03-22',
        belediye: {
          id: '1',
          adi: 'Çankaya Belediyesi',
          slug: 'cankaya',
          il: 'Ankara',
          ilce: 'Çankaya'
        }
      }
    ]
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-heading mb-8 text-center">Gelişmiş Arama</h1>
        
        <div className="mb-12">
          <SearchBar />
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-heading mb-4">Parsel Sonuçları</h2>
            {mockResults.parcels.map(parcel => (
              <ParcelCard key={parcel.id} parcel={parcel} />
            ))}
          </div>
          
          <div>
            <h2 className="text-2xl font-heading mb-4">Plan Sonuçları</h2>
            {mockResults.plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}