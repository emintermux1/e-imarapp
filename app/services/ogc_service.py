from owslib.wms import WebMapService
from owslib.wfs import WebFeatureService

class OGCService:
    def __init__(self, wms_url: str = None, wfs_url: str = None):
        self.wms_url = wms_url
        self.wfs_url = wfs_url
        self.wms = None
        self.wfs = None
        
        if self.wms_url:
            self.wms = WebMapService(self.wms_url, version='1.3.0')
            
        if self.wfs_url:
            self.wfs = WebFeatureService(self.wfs_url, version='2.0.0')
    
    def get_wms_layers(self):
        """
        Get list of available WMS layers.
        """
        if not self.wms:
            return []
            
        layers = []
        for layer_name in self.wms.contents:
            layer = self.wms[layer_name]
            layers.append({
                'name': layer_name,
                'title': layer.title,
                'abstract': layer.abstract
            })
        return layers
    
    def get_wfs_layers(self):
        """
        Get list of available WFS layers.
        """
        if not self.wfs:
            return []
            
        layers = []
        for layer_name in self.wfs.contents:
            layer = self.wfs[layer_name]
            layers.append({
                'name': layer_name,
                'title': layer.title,
                'abstract': layer.abstract
            })
        return layers