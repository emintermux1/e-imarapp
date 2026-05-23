export type LayerSource = 'tucbs' | 'municipal' | 'eplan' | 'custom';
export type LayerCategory = 'parsel' | 'imar' | 'idari' | 'risk' | 'ulasim' | 'aski';

export interface LayerCatalogItem {
  id: string;
  label: string;
  category: LayerCategory;
  categoryLabel: string;
  enabled: boolean;
  opacity: number;
  source: LayerSource;
  description: string;
}

export type MapStyleName = 'streets' | 'satellite' | 'terrain';
