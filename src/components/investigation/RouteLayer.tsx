import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import { type RouteStop } from "../../types/investigation";

type RouteLayerProps = {
  map: maplibregl.Map | null;
  route: RouteStop[];
};

const FULL_ROUTE_SOURCE_ID = "investigation-route";
const FULL_ROUTE_LAYER_ID = "investigation-route-line";

function toFeatureCollection(route: RouteStop[]) {
  return {
    type: "FeatureCollection" as const,
    features: route.length >= 2
      ? [
          {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: route.map((stop) => [stop.lng, stop.lat] as [number, number]),
            },
            properties: {},
          },
        ]
      : [],
  };
}

export function RouteLayer({ map, route }: RouteLayerProps) {
  useEffect(() => {
    if (!map) {
      return;
    }

    const ensureSource = (sourceId: string, sourceData: ReturnType<typeof toFeatureCollection>) => {
      const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

      if (existingSource) {
        existingSource.setData(sourceData);
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data: sourceData,
      });
    };

    const ensureLayer = (
      layerId: string,
      sourceId: string,
      paint: Record<string, string | number>,
      layout?: Record<string, string | number>,
    ) => {
      if (map.getLayer(layerId)) {
        return;
      }

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint,
        layout,
      });
    };

    const syncLayers = () => {
      ensureSource(FULL_ROUTE_SOURCE_ID, toFeatureCollection(route));

      ensureLayer(FULL_ROUTE_LAYER_ID, FULL_ROUTE_SOURCE_ID, {
        "line-color": "#38bdf8",
        "line-width": 4,
        "line-opacity": 0.78,
      }, {
        "line-cap": "round",
        "line-join": "round",
      });
    };

    if (map.isStyleLoaded()) {
      syncLayers();
      return;
    }

    map.once("load", syncLayers);

    return () => {
      map.off("load", syncLayers);
    };
  }, [map, route]);

  return null;
}
