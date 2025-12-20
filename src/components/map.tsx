"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import { MapPin } from "lucide-react";

// Fix for default marker icon in Next.js
const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

// Create custom colored marker icons with softer design
const createColoredIcon = (color: string, isHovered: boolean = false) => {
    const scale = isHovered ? 1.2 : 1;
    const opacity = isHovered ? 1 : 0.9;

    const svgIcon = `
        <svg width="${28 * scale}" height="${44 * scale}" viewBox="0 0 28 44" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <path d="M14 0C6.3 0 0 6.3 0 14c0 9.5 14 30 14 30s14-20.5 14-30C28 6.3 21.7 0 14 0z" 
                  fill="${color}" 
                  filter="url(#shadow)"
                  opacity="${opacity}"/>
            <circle cx="14" cy="14" r="5" fill="white" opacity="0.95"/>
        </svg>
    `;

    return new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
        iconSize: [28 * scale, 44 * scale],
        iconAnchor: [14 * scale, 44 * scale],
        popupAnchor: [0, -44 * scale],
    });
};

// Component to handle map centering with bounds
function MapCenterController({
    selectedRoute,
    routes,
    hubCoordinates
}: {
    selectedRoute: number | null,
    routes: Route[],
    hubCoordinates?: [number, number]
}) {
    const map = useMap();

    useEffect(() => {
        // Ensure map is ready before making changes
        if (!map || !map.getContainer()) return;

        // Small delay to ensure map is fully initialized
        const timer = setTimeout(() => {
            try {
                if (selectedRoute !== null && routes[selectedRoute]) {
                    const route = routes[selectedRoute];
                    const validStops = route.stops.filter(s =>
                        s.coordinates && (s.coordinates[0] !== 0 || s.coordinates[1] !== 0)
                    );

                    if (validStops.length > 0) {
                        // Create bounds that include all stops and the hub
                        const bounds = L.latLngBounds(
                            validStops.map(s => s.coordinates as [number, number])
                        );

                        // Add hub to bounds if it exists
                        if (hubCoordinates) {
                            bounds.extend(hubCoordinates);
                        }

                        // Fit bounds with padding to prevent cutoff
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 13,
                            animate: true,
                            duration: 0.5
                        });
                    }
                } else {
                    // Show all routes - create bounds for all stops across all routes
                    const allStops: [number, number][] = [];

                    routes.forEach(route => {
                        route.stops.forEach(stop => {
                            if (stop.coordinates && (stop.coordinates[0] !== 0 || stop.coordinates[1] !== 0)) {
                                allStops.push(stop.coordinates);
                            }
                        });
                    });

                    if (allStops.length > 0) {
                        const bounds = L.latLngBounds(allStops);

                        // Add hub to bounds if it exists
                        if (hubCoordinates) {
                            bounds.extend(hubCoordinates);
                        }

                        // Fit bounds with padding
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 12,
                            animate: true,
                            duration: 0.5
                        });
                    } else {
                        // Fallback if no valid coordinates
                        map.setView([39.095, -94.5786], 12, { animate: true, duration: 0.5 });
                    }
                }
            } catch (error) {
                console.warn('Map centering error:', error);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedRoute, routes, hubCoordinates, map]);

    return null;
}

interface Stop {
    number: number;
    name: string;
    location?: string;
    coordinates?: [number, number];
    notes?: string;
    state?: string;
}

interface Route {
    name: string;
    color: string;
    hexColor?: string;
    bg?: string;
    border?: string;
    iconColor?: string;
    stops: Stop[];
}

export interface MapProps {
    routes: Route[];
    hubCoordinates?: [number, number];
}

export default function Map({ routes, hubCoordinates }: MapProps) {
    const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
    const [hoveredStop, setHoveredStop] = useState<string | null>(null);

    useEffect(() => {
        fixLeafletIcon();
    }, []);

    const displayedRoutes = selectedRoute !== null ? [routes[selectedRoute]] : routes;

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - Route Selector & Details */}
            <div className="space-y-6">
                {/* Route Selector Tabs */}
                <div className="grid grid-cols-2 gap-3">
                    {routes.map((route, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedRoute(selectedRoute === idx ? null : idx)}
                            className={`
                                px-3 py-2 rounded-xl transition-all duration-300 border-2
                                ${selectedRoute === idx
                                    ? `bg-gradient-to-br ${route.color} text-white border-transparent shadow-lg`
                                    : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md`
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-300 ${selectedRoute === idx ? 'scale-110' : ''}`}
                                    style={{ backgroundColor: route.hexColor }}
                                />
                                <h3 className={`font-semibold text-sm transition-colors ${selectedRoute === idx ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {route.name}
                                </h3>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Route Stops List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden h-[500px] flex flex-col">
                    {selectedRoute !== null ? (
                        // Single route view
                        <>
                            <div className={`p-4 bg-gradient-to-r ${routes[selectedRoute].color} text-white flex-shrink-0`}>
                                <h3 className="text-xl font-bold">{routes[selectedRoute].name}</h3>
                                <p className="text-xs opacity-90 mt-1">{routes[selectedRoute].stops.length} stops</p>
                            </div>

                            <div className="p-4 space-y-2 overflow-y-auto flex-1">
                                {routes[selectedRoute].stops.map((stop, i) => {
                                    const stopKey = `${routes[selectedRoute].name}-${i}`;
                                    const isHovered = hoveredStop === stopKey;

                                    return (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setHoveredStop(stopKey)}
                                            onMouseLeave={() => setHoveredStop(null)}
                                            className={`p-4 rounded-xl ${routes[selectedRoute].bg} border ${routes[selectedRoute].border} transition-all duration-300 cursor-pointer ${isHovered ? 'shadow-lg scale-[1.02] border-current' : 'hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs ${routes[selectedRoute].iconColor} transition-transform ${isHovered ? 'scale-110' : ''
                                                        }`}>
                                                        {stop.number}
                                                    </span>
                                                    {stop.name}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${routes[selectedRoute].bg} ${routes[selectedRoute].iconColor} border ${routes[selectedRoute].border}`}>
                                                    {stop.state}
                                                </span>
                                            </div>

                                            <div className="text-sm text-muted-foreground pl-9">
                                                {stop.location && (
                                                    <p className="font-medium">
                                                        {stop.location}
                                                        {stop.notes && <span className="text-xs italic ml-1">({stop.notes})</span>}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        // All routes view - List layout
                        <>
                            <div className="p-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex-shrink-0">
                                <h3 className="text-xl font-bold">All Routes</h3>
                                <p className="text-xs opacity-90 mt-1">Select a route above to focus on specific stops</p>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                {routes.map((route, routeIdx) => (
                                    <div key={routeIdx}>
                                        <div className={`p-2 rounded-xl bg-gradient-to-r ${route.color} text-white mb-2`}>
                                            <h4 className="font-bold text-sm">{route.name}</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            {route.stops.map((stop, i) => (
                                                <div
                                                    key={i}
                                                    className={`p-2 rounded-lg ${route.bg} border ${route.border} hover:shadow-sm transition-all duration-300`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="font-semibold text-sm flex items-center gap-2">
                                                            <span className={`w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs ${route.iconColor}`}>
                                                                {stop.number}
                                                            </span>
                                                            {stop.name}
                                                        </div>
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${route.bg} ${route.iconColor} border ${route.border}`}>
                                                            {stop.state}
                                                        </span>
                                                    </div>
                                                    {stop.location && (
                                                        <p className="text-xs text-muted-foreground pl-7 mt-0.5">
                                                            {stop.location}
                                                            {stop.notes && <span className="italic ml-1">({stop.notes})</span>}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Side - Map */}
            <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 lg:sticky lg:top-24">
                    <MapContainer
                        center={[39.095, -94.5786]}
                        zoom={12}
                        scrollWheelZoom={true}
                        className="h-[600px] lg:h-[700px] w-full z-0"
                        style={{ background: '#f1f5f9' }}
                    >
                        <MapCenterController
                            selectedRoute={selectedRoute}
                            routes={routes}
                            hubCoordinates={hubCoordinates}
                        />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            subdomains="abcd"
                            maxZoom={20}
                        />

                        {/* Draw Route Lines */}
                        {displayedRoutes.map((route, idx) => {
                            if (!route.hexColor || !hubCoordinates) return null;

                            const stopCoords = route.stops
                                .filter((s: Stop) => s.coordinates && (s.coordinates[0] !== 0 || s.coordinates[1] !== 0))
                                .map((s: Stop) => s.coordinates as [number, number]);

                            if (stopCoords.length === 0) return null;

                            const positions = [hubCoordinates, ...stopCoords, hubCoordinates];

                            return (
                                <Polyline
                                    key={`line-${idx}`}
                                    positions={positions}
                                    pathOptions={{
                                        color: route.hexColor,
                                        weight: 4,
                                        opacity: 0.7,
                                        lineJoin: 'round',
                                        lineCap: 'round'
                                    }}
                                />
                            );
                        })}

                        {/* Draw Hub Marker */}
                        {hubCoordinates && (
                            <Marker
                                position={hubCoordinates}
                                icon={createColoredIcon('#1e293b', false)}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-3">
                                        <h3 className="font-bold text-base mb-1">Uplift Warehouse</h3>
                                        <p className="text-sm text-slate-600">1516 Prospect Ave</p>
                                        <p className="text-xs text-slate-500 mt-1">All routes start & end here</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Draw Stop Markers */}
                        {displayedRoutes.map((route) =>
                            route.stops.map((stop: Stop, idx: number) => {
                                if (!stop.coordinates || (stop.coordinates[0] === 0 && stop.coordinates[1] === 0)) {
                                    return null;
                                }

                                const stopKey = `${route.name}-${idx}`;
                                const isHovered = hoveredStop === stopKey;

                                return (
                                    <Marker
                                        key={stopKey}
                                        position={stop.coordinates}
                                        icon={createColoredIcon(route.hexColor || '#64748b', isHovered)}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-3 min-w-[200px]">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-3 bg-gradient-to-r ${route.color}`}>
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                    {route.name}
                                                </div>
                                                <h3 className="font-bold text-base mb-2">
                                                    {stop.number}. {stop.name}
                                                </h3>
                                                {stop.location && (
                                                    <p className="text-sm text-slate-600 mb-1">
                                                        {stop.location}
                                                    </p>
                                                )}
                                                <p className="text-sm font-medium text-slate-500">Kansas City, {stop.state}</p>
                                                {stop.notes && (
                                                    <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">
                                                        {stop.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })
                        )}
                    </MapContainer>

                    {/* Disclaimer - positioned inside map container */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-4 py-2 z-[1000]">
                        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
                            * Map locations are approximate. Please refer to the address descriptions for exact locations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
