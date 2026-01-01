"use client";

import { RouteWithStops, ActiveSession } from "@/types/distribution";
import { getRouteColor, MINUTES_PER_STOP } from "@/lib/constants/routes";
import { MapPin, Clock, ChevronLeft, Navigation } from "lucide-react";

interface ScheduleCardProps {
    route: RouteWithStops;
    onClick: () => void;
    isRunningNow?: boolean;
}

export function ScheduleCard({ route, onClick, isRunningNow }: ScheduleCardProps) {
    const routeColor = getRouteColor(route.name);

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-4 rounded-xl transition-all bg-white hover:bg-gray-50 shadow"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${routeColor.bg}`} />
                        <h3 className="font-semibold text-gray-900">
                            {route.name}
                        </h3>
                        {isRunningNow && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-500 text-white rounded-full animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>

                    {/* Stops count */}
                    <div className="mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{route.stops.length} stops</span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}

// ETA calculation based on stop numbers
function calculateETA(currentStopNumber: number | undefined, targetStopNumber: number): number {
    if (!currentStopNumber) return targetStopNumber * MINUTES_PER_STOP;
    const stopsAway = targetStopNumber - currentStopNumber;
    return Math.max(0, stopsAway * MINUTES_PER_STOP);
}

interface ScheduleGridProps {
    routes: RouteWithStops[];
    selectedRouteId: string | null;
    onSelectRoute: (routeId: string | null) => void;
    activeRouteIds: string[];
    activeSessions: ActiveSession[];
}

export function ScheduleGrid({ routes, selectedRouteId, onSelectRoute, activeRouteIds, activeSessions }: ScheduleGridProps) {
    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    const routeColor = selectedRoute ? getRouteColor(selectedRoute.name) : null;
    const activeSession = selectedRoute ? activeSessions.find(s => s.routeId === selectedRoute.id) : null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Routes</h2>
            </div>

            {/* Regular Schedule - only show when no route selected */}
            {!selectedRouteId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900">Regular Schedule</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Routes at <strong>Monday, Wednesday at 6:00 PM</strong> and{" "}
                                <strong>Saturday at 5:00 PM</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Route Cards or Selected Route Details */}
            {!selectedRouteId ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {routes.map((route) => (
                        <ScheduleCard
                            key={route.id}
                            route={route}
                            onClick={() => onSelectRoute(route.id)}
                            isRunningNow={activeRouteIds.includes(route.id)}
                        />
                    ))}
                </div>
            ) : selectedRoute && routeColor && (
                <div className="space-y-3">
                    {/* Selected Route Header */}
                    <div className={`bg-gradient-to-r ${routeColor.gradient} text-white rounded-xl p-4`}>
                        <button
                            onClick={() => onSelectRoute(null)}
                            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-2 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to all routes
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white" />
                            <h3 className="font-semibold text-lg">{selectedRoute.name}</h3>
                            {activeRouteIds.includes(selectedRoute.id) && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full animate-pulse">
                                    LIVE
                                </span>
                            )}
                        </div>
                        <p className="text-white/80 text-sm mt-1">{selectedRoute.stops.length} stops</p>
                    </div>

                    {/* Stops List */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {selectedRoute.stops
                                .sort((a, b) => a.stopNumber - b.stopNumber)
                                .map((stop) => {
                                    const isCurrentStop = activeSession?.currentStopId === stop.id;
                                    const isPastStop = activeSession &&
                                        activeSession.currentStopNumber &&
                                        stop.stopNumber < activeSession.currentStopNumber;
                                    const etaMinutes = activeSession
                                        ? calculateETA(activeSession.currentStopNumber, stop.stopNumber)
                                        : undefined;

                                    return (
                                        <div
                                            key={stop.id}
                                            className={`flex items-start gap-3 p-4 ${
                                                isCurrentStop
                                                    ? "bg-green-50"
                                                    : isPastStop
                                                    ? "bg-gray-50 opacity-60"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                                    isCurrentStop
                                                        ? "bg-green-500 text-white"
                                                        : isPastStop
                                                        ? "bg-gray-300 text-gray-500"
                                                        : `${routeColor.bg} text-white`
                                                }`}
                                            >
                                                {stop.stopNumber}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium text-gray-900">
                                                        {stop.name}
                                                    </p>
                                                    {isCurrentStop && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                                                            Van here
                                                        </span>
                                                    )}
                                                </div>
                                                {stop.locationDescription && (
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {stop.locationDescription}
                                                    </p>
                                                )}
                                                {activeSession && !isPastStop && !isCurrentStop && etaMinutes !== undefined && (
                                                    <p className="text-sm text-blue-600 mt-0.5">
                                                        ~{etaMinutes} min until arrival
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
                                                    window.open(url, "_blank");
                                                }}
                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap flex-shrink-0"
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Directions</span>
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
