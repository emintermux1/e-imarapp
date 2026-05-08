import pyproj

class CoordinateTransform:
    def __init__(self):
        # Define coordinate systems
        self.wgs84 = pyproj.CRS('EPSG:4326')  # WGS84
        self.ed50 = pyproj.CRS('EPSG:4230')   # ED50
        self.itrf96 = pyproj.CRS('EPSG:4978') # ITRF96
        
        # Create transformers
        self.wgs84_to_ed50 = pyproj.Transformer.from_crs(self.wgs84, self.ed50, always_xy=True)
        self.ed50_to_wgs84 = pyproj.Transformer.from_crs(self.ed50, self.wgs84, always_xy=True)
        self.wgs84_to_itrf96 = pyproj.Transformer.from_crs(self.wgs84, self.itrf96, always_xy=True)
        self.itrf96_to_wgs84 = pyproj.Transformer.from_crs(self.itrf96, self.wgs84, always_xy=True)
    
    def transform_wgs84_to_ed50(self, lon, lat):
        """
        Transform coordinates from WGS84 to ED50.
        """
        return self.wgs84_to_ed50.transform(lon, lat)
    
    def transform_ed50_to_wgs84(self, lon, lat):
        """
        Transform coordinates from ED50 to WGS84.
        """
        return self.ed50_to_wgs84.transform(lon, lat)
    
    def transform_wgs84_to_itrf96(self, lon, lat):
        """
        Transform coordinates from WGS84 to ITRF96.
        """
        return self.wgs84_to_itrf96.transform(lon, lat)
    
    def transform_itrf96_to_wgs84(self, x, y, z):
        """
        Transform coordinates from ITRF96 to WGS84.
        """
        return self.itrf96_to_wgs84.transform(x, y, z)