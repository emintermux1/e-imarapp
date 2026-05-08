from typing import Dict, List, Optional, Tuple
from shapely.geometry import Polygon, Point, mapping, shape
from shapely.ops import unary_union
import math
import json
from geojson import Feature, FeatureCollection
from app.schemas.simulation import BuildingVolumeRequest, ShadowAnalysisRequest, NeighborVisibilityRequest, ComplianceRequest, CesiumTilesetRequest


class BuildingSimulationService:
    """
    3D bina simülasyonu için geometrik analiz backend'i.
    Cesium.js frontend ile entegre edilecek.
    """
    
    def calculate_building_volume(self, request: BuildingVolumeRequest) -> Dict:
        """
        Bina hacmi ve 3D bounding box hesapla.
        footprint: GeoJSON Polygon (parsel/bina footprint)
        """
        # Parse GeoJSON footprint
        footprint_geom = shape(request.footprint_geojson)
        
        # Calculate base area (m²)
        base_area = footprint_geom.area
        
        # Volume = base_area * floors * floor_height
        total_floor_area = base_area * request.floors
        volume = total_floor_area * request.floor_height
        height = request.floors * request.floor_height
        
        # Calculate bounding box
        bounds = footprint_geom.bounds  # (minx, miny, maxx, maxy)
        
        cesium_bounding_box = {
            "west": bounds[0],
            "south": bounds[1],
            "east": bounds[2],
            "north": bounds[3],
            "minimumHeight": 0,
            "maximumHeight": height
        }
        
        # Return Cesium-ready 3D data
        return {
            "base_area_m2": round(base_area, 2),
            "total_floor_area_m2": round(total_floor_area, 2),
            "volume_m3": round(volume, 2),
            "height_m": round(height, 2),
            "cesium_bounding_box": cesium_bounding_box,
            "building_geometry": mapping(footprint_geom)
        }
    
    def calculate_shadow_analysis(self, request: ShadowAnalysisRequest) -> Dict:
        """
        Güneş açısına göre gölge analizi.
        sun_azimuth: derece (0=kuzey, 90=doğu)
        sun_elevation: derece (0=ufuk, 90=zenit)
        """
        building_geom = shape(request.building_geometry)
        sun_azimuth = request.sun_azimuth
        sun_elevation = request.sun_elevation
        building_height = request.building_height
        
        # Convert angles to radians
        azimuth_rad = math.radians(sun_azimuth)
        elevation_rad = math.radians(sun_elevation)
        
        # Calculate shadow length
        if math.tan(elevation_rad) != 0:
            shadow_length = building_height / math.tan(elevation_rad)
        else:
            shadow_length = float('inf')  # Sun at zenith, no shadow
        
        # Calculate shadow direction vector from azimuth
        # In geo coordinates: x = east-west, y = north-south
        dx = shadow_length * math.sin(azimuth_rad)  # positive = east
        dy = shadow_length * math.cos(azimuth_rad)  # positive = north
        
        # Create shadow polygon by translating the building footprint
        shadow_geom = None
        if shadow_length != float('inf'):
            shadow_geom = Polygon([(x + dx, y + dy) for x, y in building_geom.exterior.coords])
        
        # Return shadow polygon as GeoJSON
        return {
            "shadow_length_m": round(shadow_length, 2) if shadow_length != float('inf') else None,
            "shadow_direction": {
                "dx": round(dx, 2),
                "dy": round(dy, 2)
            },
            "shadow_polygon": mapping(shadow_geom) if shadow_geom else None,
            "building_height": building_height
        }
    
    def calculate_neighbor_visibility(self, request: NeighborVisibilityRequest) -> Dict:
        """
        Komşu binaların görüş açısı analizi.
        """
        target_building = shape(request.target_building)
        neighbor_buildings = [shape(building) for building in request.neighbor_buildings]
        
        # Calculate centroid of target building
        target_centroid = target_building.centroid
        target_height = request.target_height
        
        visibility_results = []
        
        for i, neighbor in enumerate(neighbor_buildings):
            neighbor_centroid = neighbor.centroid
            neighbor_height = request.neighbor_heights[i] if i < len(request.neighbor_heights) else 0
            
            # Calculate distance between centroids
            distance = target_centroid.distance(neighbor_centroid)
            
            # Calculate angle of view
            height_diff = neighbor_height - target_height
            if distance > 0:
                angle_deg = math.degrees(math.atan2(height_diff, distance))
            else:
                angle_deg = 90 if height_diff > 0 else -90
            
            # Determine visibility
            is_visible = angle_deg > 0  # Positive angle means neighbor is above target
            
            visibility_results.append({
                "neighbor_id": i,
                "distance_m": round(distance, 2),
                "height_difference_m": round(height_diff, 2),
                "view_angle_deg": round(angle_deg, 2),
                "is_visible": is_visible
            })
        
        return {
            "target_building_id": request.target_building_id,
            "visibility_results": visibility_results
        }
    
    def check_emsal_gabari_compliance(self, request: ComplianceRequest) -> Dict:
        """
        Emsal, gabari ve hmax kurallarına uygunluk kontrolü.
        """
        parcel_geom = shape(request.parcel_geometry)
        building_geom = shape(request.building_geometry)
        
        parcel_area = parcel_geom.area
        building_base_area = building_geom.area
        
        # Calculate emsal = (total_floor_area) / (parcel_area)
        total_floor_area = building_base_area * request.floors
        calculated_emsal = total_floor_area / parcel_area if parcel_area > 0 else 0
        
        # Calculate gabari (max height)
        calculated_gabari = request.floors * request.floor_height
        
        # Check compliance
        emsal_compliant = calculated_emsal <= request.max_emsal
        gabari_compliant = calculated_gabari <= request.max_gabari
        height_compliant = calculated_gabari <= request.max_height
        
        return {
            "emsal_analysis": {
                "calculated_emsal": round(calculated_emsal, 4),
                "max_allowed_emsal": request.max_emsal,
                "is_compliant": emsal_compliant
            },
            "gabari_analysis": {
                "calculated_gabari": round(calculated_gabari, 2),
                "max_allowed_gabari": request.max_gabari,
                "is_compliant": gabari_compliant
            },
            "height_analysis": {
                "calculated_height": round(calculated_gabari, 2),
                "max_allowed_height": request.max_height,
                "is_compliant": height_compliant
            },
            "overall_compliance": emsal_compliant and gabari_compliant and height_compliant
        }
    
    def generate_cesium_tileset(self, request: CesiumTilesetRequest) -> Dict:
        """
        Cesium 3D Tiles tileset.json üret.
        https://github.com/CesiumGS/3d-tiles
        """
        buildings = request.buildings
        
        # Create bounding volume for the entire tileset
        all_geoms = [shape(building["geometry"]) for building in buildings]
        union_geom = unary_union(all_geoms)
        bounds = union_geom.bounds  # (minx, miny, maxx, maxy)
        
        # Calculate center and half-size for box bounding volume
        center_x = (bounds[0] + bounds[2]) / 2
        center_y = (bounds[1] + bounds[3]) / 2
        center_z = request.default_height / 2 if request.default_height else 0
        
        half_x = (bounds[2] - bounds[0]) / 2
        half_y = (bounds[3] - bounds[1]) / 2
        half_z = request.default_height / 2 if request.default_height else 10
        
        # Create tileset.json structure
        tileset = {
            "asset": {
                "version": "1.0"
            },
            "properties": {
                "height": {
                    "minimum": 0,
                    "maximum": request.default_height * 50 if request.default_height else 150
                }
            },
            "geometricError": 1000,
            "root": {
                "boundingVolume": {
                    "box": [
                        center_x, center_y, center_z,
                        half_x, 0, 0,
                        0, half_y, 0,
                        0, 0, half_z
                    ]
                },
                "geometricError": 100,
                "refine": "ADD",
                "content": {
                    "uri": "buildings.b3dm"
                },
                "children": []
            }
        }
        
        # Add individual buildings as children
        for building in buildings:
            building_geom = shape(building["geometry"])
            building_bounds = building_geom.bounds
            building_center_x = (building_bounds[0] + building_bounds[2]) / 2
            building_center_y = (building_bounds[1] + building_bounds[3]) / 2
            building_height = building.get("height", request.default_height or 10)
            
            building_half_x = (building_bounds[2] - building_bounds[0]) / 2
            building_half_y = (building_bounds[3] - building_bounds[1]) / 2
            building_half_z = building_height / 2
            
            tileset["root"]["children"].append({
                "boundingVolume": {
                    "box": [
                        building_center_x, building_center_y, building_half_z,
                        building_half_x, 0, 0,
                        0, building_half_y, 0,
                        0, 0, building_half_z
                    ]
                },
                "geometricError": 0,
                "properties": {
                    "height": building_height,
                    "area": building_geom.area
                }
            })
        
        return tileset