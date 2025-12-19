/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { useMemo } from "react";
import { Types, Primitives, useDataBinding } from "@a2ui/react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import "./GoogleMap.css";

// Use the same mapId as Angular for consistent styling
const MAP_ID = "4506f1f5f5e6e8e2";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const DEFAULT_CENTER = { lat: 34.0626, lng: -118.3759 };
const DEFAULT_ZOOM = 10;

interface GoogleMapProperties {
  title?: Primitives.StringValue;
  center?: { path: string };
  zoom?: Primitives.NumberValue;
  pins?: { path: string };
}

interface GoogleMapProps {
  node: Types.AnyComponentNode & { properties: GoogleMapProperties };
  surfaceId: string;
}

interface PinData {
  lat: number;
  lng: number;
  name: string;
  description?: string;
  background?: string;
  borderColor?: string;
  glyphColor?: string;
}

export function GoogleMapComponent({ node, surfaceId }: GoogleMapProps) {
  const { resolveString, getValue } = useDataBinding(node, surfaceId);

  const properties = node.properties;
  const title = resolveString(properties.title ?? null);

  const center = useMemo(() => {
    const centerPath = properties.center?.path;
    if (!centerPath) return DEFAULT_CENTER;

    const lat = getValue(`${centerPath}.lat`);
    const lng = getValue(`${centerPath}.lng`);

    if (lat === null || lng === null) return DEFAULT_CENTER;

    return { lat: Number(lat), lng: Number(lng) };
  }, [properties.center?.path, getValue]);

  const zoom = useMemo(() => {
    const zoomPath = properties.zoom;
    if (!zoomPath) return DEFAULT_ZOOM;

    if ("path" in zoomPath && zoomPath.path) {
      const zoomValue = getValue(zoomPath.path);
      return zoomValue !== null ? Number(zoomValue) : DEFAULT_ZOOM;
    }
    if ("literalNumber" in zoomPath) {
      return zoomPath.literalNumber;
    }

    return DEFAULT_ZOOM;
  }, [properties.zoom, getValue]);

  const pins = useMemo(() => {
    const pinsPath = properties.pins?.path;
    if (!pinsPath) return [];

    const pinList: PinData[] = [];
    const maxPins = 100;

    for (let index = 0; index < maxPins; index++) {
      const pinPrefix = `${pinsPath}[${index}]`;
      const lat = getValue(`${pinPrefix}.lat`);
      const lng = getValue(`${pinPrefix}.lng`);
      const name = getValue(`${pinPrefix}.name`);

      if (lat === null || lng === null || name === null) break;

      pinList.push({
        lat: Number(lat),
        lng: Number(lng),
        name: String(name),
        description: getValue(`${pinPrefix}.description`) as string | undefined,
        background: getValue(`${pinPrefix}.background`) as string | undefined,
        borderColor: getValue(`${pinPrefix}.borderColor`) as string | undefined,
        glyphColor: getValue(`${pinPrefix}.glyphColor`) as string | undefined,
      });
    }

    return pinList;
  }, [properties.pins?.path, getValue]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-box-container">
        <div className="map-header">
          <h2>{title ?? "Map"}</h2>
        </div>
        <div className="map-container">
          <div className="map-placeholder">
            <p>Google Maps API key not configured.</p>
            <p className="map-hint">
              Set VITE_GOOGLE_MAPS_API_KEY in your environment.
            </p>
            {pins.length > 0 && (
              <div className="pin-list">
                <h3>Locations ({pins.length})</h3>
                <ul>
                  {pins.map((pin, index) => (
                    <li key={index}>
                      <strong>{pin.name}</strong>
                      {pin.description && <span> - {pin.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-box-container">
      <div className="map-header">
        <div>
          <h2>{title ?? "Map"}</h2>
        </div>
        <div className="map-actions">
          <button className="icon-button" title="Download">
            <DownloadIcon />
          </button>
          <button className="icon-button" title="Share">
            <ShareIcon />
          </button>
        </div>
      </div>
      <div className="map-container">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            mapId={MAP_ID}
            defaultCenter={center}
            defaultZoom={zoom}
            style={{ width: "100%", height: "500px" }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {pins.map((pin, index) => (
              <AdvancedMarker
                key={index}
                position={{ lat: pin.lat, lng: pin.lng }}
                title={pin.name}
              >
                <Pin
                  background={pin.background || "#4285F4"}
                  borderColor={pin.borderColor || "#1a73e8"}
                  glyphColor={pin.glyphColor || "#ffffff"}
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}
