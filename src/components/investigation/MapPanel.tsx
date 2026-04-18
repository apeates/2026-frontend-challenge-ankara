import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { RouteLayer } from "./RouteLayer";
import {
  type InvestigationRecord,
  type RouteStop,
} from "../../types/investigation";
import { normalizeCoordinates } from "../../utils/coordinates";
import { formatTime } from "../../utils/date";

type MapPanelProps = {
  records: InvestigationRecord[];
  selectedEvent: InvestigationRecord | null;
  route: RouteStop[];
  onSelectEvent: (record: InvestigationRecord) => void;
};

type PlottedRecord = {
  record: InvestigationRecord;
  coordinates: { lat: number; lng: number };
  routeSequence: number | undefined;
};

const DEFAULT_CENTER: [number, number] = [32.8597, 39.9334];
const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function buildMarkerElement(
  record: InvestigationRecord,
  isSelected: boolean,
  routeSequence?: number,
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `map-marker type-${record.type} ${isSelected ? "is-selected" : ""}`;
  element.setAttribute("aria-label", `${record.title} at ${record.location ?? "unknown location"}`);
  element.innerHTML = routeSequence
    ? `<span class="map-marker-core map-marker-numbered">${routeSequence}</span>`
    : `<span class="map-marker-core"></span>`;
  return element;
}

export function MapPanel({
  records,
  selectedEvent,
  route,
  onSelectEvent,
}: MapPanelProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const hasFitBoundsRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const routeSequenceByRecordId = useMemo(
    () => new Map(route.map((stop) => [stop.recordId, stop.sequence])),
    [route],
  );
  const plottedRecords = useMemo<PlottedRecord[]>(
    () =>
      records.reduce<PlottedRecord[]>((accumulator, record) => {
        const coordinates = normalizeCoordinates(record.coordinates);

        if (!coordinates) {
          return accumulator;
        }

        accumulator.push({
          record,
          coordinates,
          routeSequence: routeSequenceByRecordId.get(record.id),
        });

        return accumulator;
      }, []),
    [records, routeSequenceByRecordId],
  );

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapNodeRef.current,
      style: DARK_MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: 11.3,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;
    setMapInstance(map);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());

    markersRef.current = plottedRecords.map(({ record, coordinates, routeSequence }) => {
        const markerElement = buildMarkerElement(record, record.id === selectedEvent?.id, routeSequence);
        markerElement.addEventListener("click", () => onSelectEvent(record));

        return new maplibregl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map);
      });
  }, [onSelectEvent, plottedRecords, selectedEvent]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !plottedRecords.length) {
      return;
    }
    const firstRecord = plottedRecords[0];

    if (!firstRecord) {
      return;
    }

    const bounds = new maplibregl.LngLatBounds(
      [firstRecord.coordinates.lng, firstRecord.coordinates.lat],
      [firstRecord.coordinates.lng, firstRecord.coordinates.lat],
    );

    plottedRecords.forEach(({ coordinates }) => {
      bounds.extend([coordinates.lng, coordinates.lat]);
    });

    if (!hasFitBoundsRef.current) {
      map.fitBounds(bounds, {
        padding: 84,
        duration: 0,
        maxZoom: 13.4,
      });
      hasFitBoundsRef.current = true;
      return;
    }

    map.fitBounds(bounds, {
      padding: 84,
      duration: 600,
      maxZoom: 13.4,
    });
  }, [plottedRecords]);

  useEffect(() => {
    const map = mapRef.current;
    const coordinates = normalizeCoordinates(selectedEvent?.coordinates);

    if (!map || !selectedEvent || !coordinates) {
      return;
    }

    map.easeTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: Math.max(map.getZoom(), 12.6),
      duration: 500,
    });
  }, [selectedEvent]);

  const selectedRouteSeq = selectedEvent ? routeSequenceByRecordId.get(selectedEvent.id) : undefined;

  return (
    <section className="panel map-panel">
      <div className="map-stage">
        <div ref={mapNodeRef} className="map-canvas" />
        <RouteLayer map={mapInstance} route={route} />

        {/* Legend */}
        <div className="map-overlay top-left">
          <div className="legend-chip">
            <span className="legend-swatch route" />
            Podo route
          </div>
        </div>

        {selectedEvent ? (
          <div className="map-event-panel">
            <div className="map-event-panel-meta">
              <span className={`record-pill type-${selectedEvent.type}`}>{selectedEvent.type}</span>
              {selectedRouteSeq !== undefined ? <span className="map-event-seq">#{selectedRouteSeq}</span> : null}
              <span className="map-event-time">{formatTime(selectedEvent.timestamp)}</span>
            </div>
            <h3 className="map-event-title">{selectedEvent.title}</h3>
            <p className="map-event-desc">{selectedEvent.description}</p>
            <div className="map-event-grid">
              <div>
                <dt>Location</dt>
                <dd>{selectedEvent.location ?? "Unknown location"}</dd>
              </div>
              <div>
                <dt>People</dt>
                <dd>{selectedEvent.people.join(", ")}</dd>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
