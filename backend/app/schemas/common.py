from typing import Any

from geoalchemy2 import WKBElement
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping


def wkb_to_geojson(geom: Any) -> Any:
    if geom is None or isinstance(geom, (str, dict)):
        return geom
    try:
        if isinstance(geom, WKBElement):
            return mapping(to_shape(geom))
    except Exception:
        pass
    return None