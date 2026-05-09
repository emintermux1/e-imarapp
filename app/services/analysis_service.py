from typing import Dict, List, Optional
from shapely.geometry import shape, mapping, Polygon
from shapely.ops import unary_union
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np
from app.schemas.analysis import (
    MergeableParcelsRequest, AreaValueRequest, 
    ImarChangesRequest, PlanLegendRequest
)
from app.models.parcel import Parcel


class AnalysisService:
    async def find_mergeable_parcels(self, request: MergeableParcelsRequest, db: AsyncSession) -> Dict:
        """Birleşebilir parsel önerisi — komşu, aynı ada, benzer nitelik."""
        parcel_ids = request.parcel_ids
        
        # In a real implementation, we would:
        # 1. Query the database for the specified parcels
        # 2. Find neighboring parcels
        # 3. Check if they share the same ada (block)
        # 4. Compare attributes for similarity
        # 5. Return mergeable combinations
        
        # For this implementation, we'll create mock results
        mergeable_parcels = []
        
        # Mock logic: if we have more than one parcel, suggest merging the first two
        if len(parcel_ids) > 1:
            mergeable_parcels.append({
                "parcel_group": [parcel_ids[0], parcel_ids[1]],
                "merge_score": 0.85,  # Confidence score
                "combined_area_m2": 1500,  # Combined area
                "common_attributes": {
                    "ada": "1234",
                    "neighborhood": "Sample Neighborhood",
                    "zone_type": "residential"
                }
            })
        
        return {
            "parcel_ids": parcel_ids,
            "mergeable_combinations": mergeable_parcels,
            "total_combinations": len(mergeable_parcels)
        }
    
    async def estimate_area_value(self, request: AreaValueRequest, db: AsyncSession) -> Dict:
        """Çevrenin emlak değeri tahmini (opsiyonel ML)."""
        parcel_id = request.parcel_id
        
        # In a real implementation, we would:
        # 1. Get parcel details from database
        # 2. Analyze surrounding parcels and their values
        # 3. Apply ML model for value estimation
        # 4. Return estimated value with confidence
        
        # For this implementation, we'll create mock results
        estimated_value = 750000  # Turkish Lira
        confidence = 0.78  # 78% confidence
        
        # Mock comparable sales
        comparables = [
            {
                "parcel_id": "comp_1",
                "distance_m": 150,
                "area_m2": 200,
                "sale_price": 700000,
                "sale_date": "2023-06-15"
            },
            {
                "parcel_id": "comp_2",
                "distance_m": 300,
                "area_m2": 250,
                "sale_price": 850000,
                "sale_date": "2023-09-22"
            }
        ]
        
        return {
            "parcel_id": parcel_id,
            "estimated_value_try": estimated_value,
            "confidence": confidence,
            "currency": "TRY",
            "comparables": comparables,
            "valuation_date": "2023-12-01",
            "factors": {
                "location_score": 0.85,
                "infrastructure_score": 0.75,
                "proximity_to_amenities": 0.80
            }
        }
    
    async def detect_imar_changes(self, request: ImarChangesRequest) -> Dict:
        """İmar değişikliği algılama — emsal/gabari değişikliği."""
        old_plan = request.old_plan
        new_plan = request.new_plan
        
        # Parse geometries
        old_geom = shape(old_plan["geometry"])
        new_geom = shape(new_plan["geometry"])
        
        # Extract plan parameters
        old_emsal = old_plan.get("emsal", 0)
        new_emsal = new_plan.get("emsal", 0)
        
        old_gabari = old_plan.get("gabari", 0)
        new_gabari = new_plan.get("gabari", 0)
        
        old_hmax = old_plan.get("hmax", 0)
        new_hmax = new_plan.get("hmax", 0)
        
        # Calculate differences
        emsal_change = new_emsal - old_emsal
        gabari_change = new_gabari - old_gabari
        hmax_change = new_hmax - old_hmax
        
        # Determine change significance
        significant_changes = []
        if abs(emsal_change) > 0.1:  # 10% threshold
            significant_changes.append({
                "parameter": "emsal",
                "old_value": old_emsal,
                "new_value": new_emsal,
                "change": emsal_change,
                "percentage_change": (emsal_change / old_emsal * 100) if old_emsal != 0 else 0
            })
        
        if abs(gabari_change) > 1:  # 1 meter threshold
            significant_changes.append({
                "parameter": "gabari",
                "old_value": old_gabari,
                "new_value": new_gabari,
                "change": gabari_change,
                "percentage_change": (gabari_change / old_gabari * 100) if old_gabari != 0 else 0
            })
        
        if abs(hmax_change) > 1:  # 1 meter threshold
            significant_changes.append({
                "parameter": "hmax",
                "old_value": old_hmax,
                "new_value": new_hmax,
                "change": hmax_change,
                "percentage_change": (hmax_change / old_hmax * 100) if old_hmax != 0 else 0
            })
        
        return {
            "plan_id": request.plan_id,
            "changes_detected": len(significant_changes) > 0,
            "significant_changes": significant_changes,
            "geometric_overlap": old_geom.intersection(new_geom).area / old_geom.area if old_geom.area > 0 else 0,
            "analysis_date": "2023-12-01"
        }
    
    async def parse_plan_legend(self, request: PlanLegendRequest) -> Dict:
        """Plan renk kodlarının anlamı (lejant) otomatik okuma."""
        pdf_url = request.pdf_url
        
        # In a real implementation, we would:
        # 1. Download the PDF
        # 2. Extract images and text
        # 3. Use computer vision to identify color codes and their meanings
        # 4. Parse legend information
        
        # For this implementation, we'll create mock results
        legend_entries = [
            {
                "color_code": "#FF0000",
                "category": "residential",
                "description": "Konut Alanı",
                "building_limit": "KAKS 1.5",
                "height_limit": "15m"
            },
            {
                "color_code": "#00FF00",
                "category": "commercial",
                "description": "Ticari Alan",
                "building_limit": "KAKS 2.0",
                "height_limit": "25m"
            },
            {
                "color_code": "#0000FF",
                "category": "green_area",
                "description": "Yeşil Alan",
                "building_limit": "KAKS 0.0",
                "height_limit": "0m"
            }
        ]
        
        return {
            "pdf_url": pdf_url,
            "legend_entries": legend_entries,
            "total_categories": len(legend_entries),
            "parse_confidence": 0.92,
            "extraction_date": "2023-12-01"
        }