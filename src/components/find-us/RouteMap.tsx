"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RouteWithStops, ActiveSession, Coordinates } from "@/types/distribution";
import { UPLIFT_HQ, MINUTES_PER_STOP } from "@/lib/constants/routes";

// Calculate ETA in minutes based on current stop and target stop
function calculateETA(currentStopNumber: number | undefined, targetStopNumber: number): number {
    if (!currentStopNumber) return targetStopNumber * MINUTES_PER_STOP;
    const stopsAway = targetStopNumber - currentStopNumber;
    return Math.max(0, stopsAway * MINUTES_PER_STOP);
}

// Format estimated arrival time
function formatEstimatedTime(minutesFromNow: number): string {
    const arrival = new Date(Date.now() + minutesFromNow * 60 * 1000);
    return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Route colors (hex values for MapBox)
const ROUTE_COLORS: Record<string, string> = {
    "West Route": "#15803d",      // green-700
    "Central Route": "#9d174d",   // pink-800 (muted/dusty pink)
    "Midtown Route": "#c2410c",   // orange-700 (burnt orange)
    "East Route": "#14b8a6",      // teal-500
};

interface RouteMapProps {
    routes: RouteWithStops[];
    activeSessions: ActiveSession[];
    selectedRouteId: string | null;
    accessToken: string;
}

export function RouteMap({ routes, activeSessions, selectedRouteId, accessToken }: RouteMapProps) {
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
            const sourceIds = [
                `route-${route.id}`,
                `route-${route.id}-completed`,
                `route-${route.id}-remaining`,
            ];
            sourceIds.forEach((sourceId) => {
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
        });

        // Filter routes if one is selected
        const displayRoutes = selectedRouteId
            ? routes.filter((r) => r.id === selectedRouteId)
            : routes;

        // Add route lines (starting and ending at Uplift HQ)
        displayRoutes.forEach((route) => {
            if (route.stops.length === 0) return;

            const sortedStops = [...route.stops].sort((a, b) => a.stopNumber - b.stopNumber);
            const activeSession = activeSessions.find((s) => s.routeId === route.id);
            const currentStopNumber = activeSession?.currentStopNumber;
            const color = ROUTE_COLORS[route.name] || "#6b7280";

            if (activeSession && currentStopNumber) {
                // Split into completed (grey) and remaining (colored) portions
                const completedStops = sortedStops.filter(s => s.stopNumber < currentStopNumber);
                const currentAndRemainingStops = sortedStops.filter(s => s.stopNumber >= currentStopNumber);

                // Completed portion: HQ -> completed stops -> current stop
                if (completedStops.length > 0 || currentStopNumber > 1) {
                    const completedCoords: [number, number][] = [
                        [UPLIFT_HQ.lng, UPLIFT_HQ.lat],
                        ...completedStops.map((stop) => [stop.longitude, stop.latitude] as [number, number]),
                        ...(currentAndRemainingStops.length > 0 ? [[currentAndRemainingStops[0].longitude, currentAndRemainingStops[0].latitude] as [number, number]] : []),
                    ];

                    const completedSourceId = `route-${route.id}-completed`;
                    map.current?.addSource(completedSourceId, {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            properties: {},
                            geometry: { type: "LineString", coordinates: completedCoords },
                        },
                    });

                    map.current?.addLayer({
                        id: completedSourceId,
                        type: "line",
                        source: completedSourceId,
                        layout: { "line-join": "round", "line-cap": "round" },
                        paint: { "line-color": "#9ca3af", "line-width": 4, "line-opacity": 0.5 },
                    });
                }

                // Remaining portion: current stop -> remaining stops -> HQ
                if (currentAndRemainingStops.length > 0) {
                    const remainingCoords: [number, number][] = [
                        ...currentAndRemainingStops.map((stop) => [stop.longitude, stop.latitude] as [number, number]),
                        [UPLIFT_HQ.lng, UPLIFT_HQ.lat],
                    ];

                    const remainingSourceId = `route-${route.id}-remaining`;
                    map.current?.addSource(remainingSourceId, {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            properties: {},
                            geometry: { type: "LineString", coordinates: remainingCoords },
                        },
                    });

                    map.current?.addLayer({
                        id: remainingSourceId,
                        type: "line",
                        source: remainingSourceId,
                        layout: { "line-join": "round", "line-cap": "round" },
                        paint: { "line-color": color, "line-width": 4, "line-opacity": 0.7 },
                    });
                }
            } else {
                // No active session - draw full route in color
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
            }
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
            const activeSession = activeSessions.find((s) => s.routeId === route.id);

            route.stops.forEach((stop) => {
                const isCurrentStop = activeSession?.currentStopId === stop.id;
                const isPastStop = activeSession && activeSession.currentStopNumber && stop.stopNumber < activeSession.currentStopNumber;
                const isFutureStop = activeSession && activeSession.currentStopNumber && stop.stopNumber > activeSession.currentStopNumber;

                // Calculate ETA for future stops
                const etaMinutes = activeSession && isFutureStop
                    ? calculateETA(activeSession.currentStopNumber, stop.stopNumber)
                    : null;

                // Create marker element
                const el = document.createElement("div");
                el.className = "stop-marker";
                el.style.cssText = `
                    width: 28px;
                    height: 28px;
                    background: ${isPastStop ? "#9ca3af" : color};
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
                    ${isPastStop ? "opacity: 0.6;" : ""}
                `;
                el.textContent = String(stop.stopNumber);

                if (isCurrentStop) {
                    el.style.border = "3px solid #22c55e";
                    el.style.boxShadow = "0 0 0 3px rgba(34, 197, 94, 0.4)";
                    el.style.background = color;
                    el.style.opacity = "1";
                }

                // Calculate remaining stops info
                const totalStops = route.stops.length;
                const sortedStops = [...route.stops].sort((a, b) => a.stopNumber - b.stopNumber);
                const remainingStops = activeSession
                    ? sortedStops.filter(s => s.stopNumber > (activeSession.currentStopNumber || 0))
                    : [];
                const stopsUntilThis = activeSession && !isPastStop && !isCurrentStop
                    ? sortedStops.filter(s => s.stopNumber > (activeSession.currentStopNumber || 0) && s.stopNumber < stop.stopNumber)
                    : [];

                // Build ETA text
                let etaText = "";
                if (isCurrentStop) {
                    const stopsLeft = remainingStops.length;
                    etaText = `
                        <p style="font-size: 12px; color: #16a34a; font-weight: 500; margin: 8px 0 0 0;">🚐 Van is here!</p>
                        <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">${stopsLeft} stop${stopsLeft !== 1 ? 's' : ''} remaining after this</p>
                    `;
                } else if (isPastStop) {
                    etaText = `<p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">✓ Completed</p>`;
                } else if (etaMinutes !== null) {
                    const estimatedTime = formatEstimatedTime(etaMinutes);
                    const stopsAway = stopsUntilThis.length + 1;
                    const stopsAfter = remainingStops.length - stopsAway;
                    etaText = `
                        <p style="font-size: 12px; color: #3b82f6; font-weight: 500; margin: 8px 0 0 0;">⏱ ~${etaMinutes} min (~${estimatedTime})</p>
                        <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">${stopsAway} stop${stopsAway !== 1 ? 's' : ''} away${stopsAfter > 0 ? ` · ${stopsAfter} more after` : ' · Last stop'}</p>
                    `;
                }

                // Create popup
                const popup = new mapboxgl.Popup({ offset: 25, className: "uplift-popup" }).setHTML(`
                    <div style="padding: 8px;">
                        <p style="font-weight: 600; font-size: 14px; margin: 0;">${stop.name}</p>
                        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
                            ${route.name} - Stop ${stop.stopNumber} of ${totalStops}
                        </p>
                        ${stop.locationDescription ? `<p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">${stop.locationDescription}</p>` : ""}
                        ${etaText}
                    </div>
                `);

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([stop.longitude, stop.latitude])
                    .setPopup(popup)
                    .addTo(map.current!);

                markersRef.current.push(marker);
            });
        });

        // Add van markers
        activeSessions.forEach((session) => {
            if (!session.currentLocation) return;

            // Filter out if route not in display
            if (selectedRouteId && session.routeId !== selectedRouteId) return;

            const el = document.createElement("div");
            el.className = "van-marker";
            el.style.cssText = `
                width: 36px;
                height: 36px;
                background: #3b82f6;
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                cursor: pointer;
            `;
            el.textContent = "🚐";

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                    <p style="font-weight: 600; font-size: 14px; margin: 0;">${session.routeName}</p>
                    <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
                        Currently at Stop ${session.currentStopNumber || 1}
                    </p>
                    ${session.nextStop ? `<p style="font-size: 12px; color: #3b82f6; margin: 4px 0 0 0;">Next: ${session.nextStop.name}</p>` : ""}
                </div>
            `);

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([session.currentLocation.longitude, session.currentLocation.latitude])
                .setPopup(popup)
                .addTo(map.current!);

            markersRef.current.push(marker);
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
    }, [routes, activeSessions, selectedRouteId, styleLoaded]);

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
