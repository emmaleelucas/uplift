"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RouteWithStops, Coordinates } from "@/types/distribution";
import { UPLIFT_HQ } from "@/lib/constants/routes";

// Route colors (hex values for MapBox)
const ROUTE_COLORS: Record<string, string> = {
    "West Route": "#15803d",      // green-700
    "Central Route": "#9d174d",   // pink-800 (muted/dusty pink)
    "Midtown Route": "#c2410c",   // orange-700 (burnt orange)
    "East Route": "#14b8a6",      // teal-500
};

interface RouteMapProps {
    routes: RouteWithStops[];
    selectedRouteId: string | null;
    accessToken: string;
}

export function RouteMap({ routes, selectedRouteId, accessToken }: RouteMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [styleLoaded, setStyleLoaded] = useState(false);
    const hasInitialized = useRef(false);
    const prevSelectedRouteRef = useRef<string | null>(null);

    // Calculate bounds from routes
    const calculateBounds = useCallback(() => {
        const allCoords: { lat: number; lng: number }[] = [];

        // Add HQ
        allCoords.push({ lat: UPLIFT_HQ.lat, lng: UPLIFT_HQ.lng });

        // Add all route stops
        routes.forEach((route) => {
            route.stops.forEach((stop) => {
                allCoords.push({ lat: stop.latitude, lng: stop.longitude });
            });
        });

        if (allCoords.length === 0) return null;

        const bounds = new mapboxgl.LngLatBounds();
        allCoords.forEach((coord) => bounds.extend([coord.lng, coord.lat]));
        return bounds;
    }, [routes]);

    // Initialize map only when we have routes
    useEffect(() => {
        if (!mapContainer.current || hasInitialized.current) return;
        if (routes.length === 0) return; // Wait for routes

        hasInitialized.current = true;
        mapboxgl.accessToken = accessToken;

        // Calculate initial bounds from routes
        const bounds = calculateBounds();

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            bounds: bounds || undefined,
            fitBoundsOptions: { padding: 50 },
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Wait for map to be fully loaded
        map.current.on("load", () => {
            setStyleLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
            setStyleLoaded(false);
            hasInitialized.current = false;
        };
    }, [accessToken, routes, calculateBounds]);

    // Update markers and routes when data changes
    useEffect(() => {
        if (!map.current || !styleLoaded || !map.current.isStyleLoaded()) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Remove existing route layers and sources safely
        routes.forEach((route) => {
            const sourceId = `route-${route.id}`;
            try {
                if (map.current?.getLayer(sourceId)) {
                    map.current.removeLayer(sourceId);
                }
                if (map.current?.getSource(sourceId)) {
                    map.current.removeSource(sourceId);
                }
            } catch {
                // Ignore errors when removing layers/sources
            }
        });

        // Filter routes if one is selected
        const displayRoutes = selectedRouteId
            ? routes.filter((r) => r.id === selectedRouteId)
            : routes;

        // Add route lines (starting and ending at Uplift HQ)
        displayRoutes.forEach((route) => {
            if (route.stops.length === 0) return;

            const sortedStops = [...route.stops].sort((a, b) => a.stopNumber - b.stopNumber);
            const color = ROUTE_COLORS[route.name] || "#6b7280";

            // Draw full route in color
            const coordinates: [number, number][] = [
                [UPLIFT_HQ.lng, UPLIFT_HQ.lat],
                ...sortedStops.map((stop) => [stop.longitude, stop.latitude] as [number, number]),
                [UPLIFT_HQ.lng, UPLIFT_HQ.lat],
            ];

            const sourceId = `route-${route.id}`;
            map.current?.addSource(sourceId, {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates },
                },
            });

            map.current?.addLayer({
                id: sourceId,
                type: "line",
                source: sourceId,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": color, "line-width": 4, "line-opacity": 0.7 },
            });
        });

        // Add Uplift HQ marker (neutral slate color)
        const hqEl = document.createElement("div");
        hqEl.className = "hq-marker";
        hqEl.style.cssText = `
            width: 32px;
            height: 32px;
            background: #64748b;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        hqEl.textContent = "U";

        const hqPopup = new mapboxgl.Popup({ offset: 25, className: "uplift-popup" }).setHTML(`
            <div style="padding: 8px;">
                <p style="font-weight: 600; font-size: 14px; margin: 0;">Uplift HQ</p>
                <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
                    ${UPLIFT_HQ.address}
                </p>
                <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">
                    All routes start and end here
                </p>
            </div>
        `);

        const hqMarker = new mapboxgl.Marker({ element: hqEl })
            .setLngLat([UPLIFT_HQ.lng, UPLIFT_HQ.lat])
            .setPopup(hqPopup)
            .addTo(map.current!);

        markersRef.current.push(hqMarker);

        // Add stop markers
        displayRoutes.forEach((route) => {
            const color = ROUTE_COLORS[route.name] || "#6b7280";
            const totalStops = route.stops.length;

            route.stops.forEach((stop) => {
                // Create marker element
                const el = document.createElement("div");
                el.className = "stop-marker";
                el.style.cssText = `
                    width: 28px;
                    height: 28px;
                    background: ${color};
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    cursor: pointer;
                `;
                el.textContent = String(stop.stopNumber);

                // Create popup
                const popup = new mapboxgl.Popup({ offset: 25, className: "uplift-popup" }).setHTML(`
                    <div style="padding: 8px;">
                        <p style="font-weight: 600; font-size: 14px; margin: 0;">${stop.name}</p>
                        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
                            ${route.name} - Stop ${stop.stopNumber} of ${totalStops}
                        </p>
                        ${stop.locationDescription ? `<p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">${stop.locationDescription}</p>` : ""}
                    </div>
                `);

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([stop.longitude, stop.latitude])
                    .setPopup(popup)
                    .addTo(map.current!);

                markersRef.current.push(marker);
            });
        });

        // Fit bounds only when route selection changes
        const routeSelectionChanged = prevSelectedRouteRef.current !== selectedRouteId;
        if (routeSelectionChanged) {
            prevSelectedRouteRef.current = selectedRouteId;

            const allCoordinates: Coordinates[] = [
                { lat: UPLIFT_HQ.lat, lng: UPLIFT_HQ.lng },
            ];
            displayRoutes.forEach((route) => {
                route.stops.forEach((stop) => {
                    allCoordinates.push({ lat: stop.latitude, lng: stop.longitude });
                });
            });

            if (allCoordinates.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                allCoordinates.forEach((coord) => {
                    bounds.extend([coord.lng, coord.lat]);
                });
                map.current?.fitBounds(bounds, { padding: 50, animate: true });
            }
        }
    }, [routes, selectedRouteId, styleLoaded]);

    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg relative">
            <style>{`
                .mapboxgl-popup-close-button {
                    font-size: 20px;
                    padding: 4px 8px;
                    color: #6b7280;
                    font-weight: bold;
                    right: 4px;
                    top: 4px;
                }
                .mapboxgl-popup-close-button:hover {
                    color: #1f2937;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                }
                .mapboxgl-popup-content {
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 12px;
                }
            `}</style>
            {/* Show loading state while waiting for routes */}
            {routes.length === 0 && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="animate-pulse text-gray-500">Loading map...</div>
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
