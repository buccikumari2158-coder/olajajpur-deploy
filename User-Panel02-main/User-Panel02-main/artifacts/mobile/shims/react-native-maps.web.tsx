import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  useContext,
  type ReactNode,
  type CSSProperties,
} from "react";

/**
 * Real Google Maps web shim for react-native-maps.
 *
 * The default stub just rendered a grey View on web, which is why the map
 * wasn't showing in the Replit preview. This implementation loads the Google
 * Maps JS SDK on demand and exposes a `MapView` + `Marker` API close enough
 * to react-native-maps that home.tsx works unchanged on both web and native.
 */

const GOOGLE_MAPS_API_KEY = "AIzaSyBJBVLaN1gepg-gsp5jgNkmQqCIqs18m04";

interface GoogleMapsGlobal {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
    Marker: new (opts: Record<string, unknown>) => GMarker;
    Polyline: new (opts: Record<string, unknown>) => GPolyline;
    LatLng: new (lat: number, lng: number) => unknown;
    Animation?: { DROP: number };
  };
}
interface GMap {
  panTo(latLng: { lat: number; lng: number }): void;
  setZoom(z: number): void;
  setOptions(opts: Record<string, unknown>): void;
}
interface GMarker {
  setMap(map: GMap | null): void;
  setPosition(p: { lat: number; lng: number }): void;
}
interface GPolyline {
  setMap(map: GMap | null): void;
}

let scriptLoadPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { google?: GoogleMapsGlobal };
  if (w.google?.maps) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly`;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-google-maps", "true");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}
interface Coord {
  latitude: number;
  longitude: number;
}

interface MapViewContextValue {
  map: GMap | null;
}
const MapViewContext = React.createContext<MapViewContextValue>({ map: null });

interface MapViewProps {
  style?: Record<string, unknown> | Record<string, unknown>[];
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  customMapStyle?: unknown[];
  provider?: unknown;
  children?: ReactNode;
}

function flattenStyle(style?: Record<string, unknown> | Record<string, unknown>[]): Record<string, unknown> {
  if (!style) return {};
  return Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
}

const MapView = React.forwardRef<{ animateToRegion: (r: Region) => void }, MapViewProps>(
  ({ style, initialRegion, region, customMapStyle, children }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<GMap | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      loadGoogleMaps()
        .then(() => {
          if (cancelled || !divRef.current) return;
          const g = (window as unknown as { google: GoogleMapsGlobal }).google;
          const center = region || initialRegion || { latitude: 20.8522, longitude: 86.0 };
          const m = new g.maps.Map(divRef.current, {
            center: { lat: center.latitude, lng: center.longitude },
            zoom: center.latitudeDelta && center.latitudeDelta < 0.05 ? 15 : 13,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
            styles: customMapStyle,
            backgroundColor: "#1a1a1a",
          });
          setMap(m);
        })
        .catch((e: Error) => {
          // eslint-disable-next-line no-console
          console.error("[maps shim]", e);
          setError(e.message);
        });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (map && region) {
        map.panTo({ lat: region.latitude, lng: region.longitude });
      }
    }, [map, region?.latitude, region?.longitude]);

    useEffect(() => {
      if (map && customMapStyle) {
        map.setOptions({ styles: customMapStyle });
      }
    }, [map, customMapStyle]);

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion: (r: Region) => {
          if (map) map.panTo({ lat: r.latitude, lng: r.longitude });
        },
      }),
      [map]
    );

    const flat = flattenStyle(style);
    const cssStyle: CSSProperties = {
      position: (flat["position"] as CSSProperties["position"]) || "relative",
      width: (flat["width"] as number | string) ?? "100%",
      height: (flat["height"] as number | string) ?? "100%",
      top: flat["top"] as number,
      left: flat["left"] as number,
      right: flat["right"] as number,
      bottom: flat["bottom"] as number,
      backgroundColor: "#1a1a1a",
      overflow: "hidden",
    };

    return (
      <div style={cssStyle}>
        <div ref={divRef} style={{ width: "100%", height: "100%" }} />
        <MapViewContext.Provider value={{ map }}>{children}</MapViewContext.Provider>
        {error && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(0,0,0,0.75)",
              color: "#FF6B6B",
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Map failed to load: {error}
          </div>
        )}
      </div>
    );
  }
);
MapView.displayName = "MapView";

export default MapView;

interface MarkerProps {
  coordinate: Coord;
  title?: string;
  children?: ReactNode;
}

export function Marker({ coordinate, title }: MarkerProps) {
  const { map } = useContext(MapViewContext);
  useEffect(() => {
    if (!map) return;
    const g = (window as unknown as { google: GoogleMapsGlobal }).google;
    const m = new g.maps.Marker({
      position: { lat: coordinate.latitude, lng: coordinate.longitude },
      map,
      title,
    });
    return () => {
      m.setMap(null);
    };
  }, [map, coordinate.latitude, coordinate.longitude, title]);
  return null;
}

interface PolylineProps {
  coordinates: Coord[];
  strokeColor?: string;
  strokeWidth?: number;
}

export function Polyline({ coordinates, strokeColor = "#32FF7E", strokeWidth = 4 }: PolylineProps) {
  const { map } = useContext(MapViewContext);
  useEffect(() => {
    if (!map) return;
    const g = (window as unknown as { google: GoogleMapsGlobal }).google;
    const p = new g.maps.Polyline({
      path: coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude })),
      geodesic: true,
      strokeColor,
      strokeOpacity: 1.0,
      strokeWeight: strokeWidth,
      map,
    });
    return () => {
      p.setMap(null);
    };
  }, [map, coordinates, strokeColor, strokeWidth]);
  return null;
}

export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;
