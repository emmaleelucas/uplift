"use client";

import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Route, RouteStop, Coordinates } from "@/types/distribution";
import { getRouteColor } from "@/lib/constants/routes";

interface StopSelectorProps {
    routes: Route[];
    routeStops: RouteStop[];
    detectedStop: RouteStop | null;
    currentLocation: Coordinates | null;
    loading?: boolean;
    onConfirmStop: (stop: RouteStop) => void;
}

export function StopSelector({
    routes,
    routeStops,
    detectedStop,
    currentLocation,
    loading = false,
    onConfirmStop,
}: StopSelectorProps) {
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Confirm Your Location
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {detectedStop
                            ? "We detected you're near a stop. Please confirm or select a different one."
                            : "Select your current stop to begin check-ins."}
                    </p>
                </div>

                {/* Detected Stop or No Detection Message */}
                {detectedStop ? (
                    <div className="mb-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Detected stop:</p>
                        <div className="bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-400 dark:border-slate-500 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white">
                                        {detectedStop.stopNumber}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {detectedStop.name}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {detectedStop.routeName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onConfirmStop(detectedStop)}
                                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                ) : currentLocation && (
                    <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-5 h-5" />
                            <p className="text-sm">No stop detected nearby. Please select your stop below.</p>
                        </div>
                    </div>
                )}

                {/* Select Different Stop - Two Step: Route then Stop */}
                <div>
                    {!selectedRouteId && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            {detectedStop ? "Or select a different stop:" : "Select your stop:"}
                        </p>
                    )}

                    {loading ? (
                        /* Loading State */
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : !selectedRouteId ? (
                        /* Step 1: Select Route */
                        <div className="space-y-2">
                            {routes.map(route => {
                                const colors = getRouteColor(route.name);
                                return (
                                    <button
                                        key={route.id}
                                        onClick={() => setSelectedRouteId(route.id)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                                            <span className="text-slate-900 dark:text-white font-medium">
                                                {route.name}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Step 2: Select Stop from chosen route */
                        <div>
                            {(() => {
                                const selectedRoute = routes.find(r => r.id === selectedRouteId);
                                const colors = getRouteColor(selectedRoute?.name);
                                return (
                                    <button
                                        onClick={() => setSelectedRouteId(null)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                                        {selectedRoute?.name}
                                    </button>
                                );
                            })()}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Select your stop:</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {routeStops
                                    .filter(s => s.routeId === selectedRouteId)
                                    .sort((a, b) => a.stopNumber - b.stopNumber)
                                    .map(stop => (
                                        <button
                                            key={stop.id}
                                            onClick={() => {
                                                onConfirmStop(stop);
                                                setSelectedRouteId(null);
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                                detectedStop?.id === stop.id
                                                    ? 'bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-400 dark:border-slate-500'
                                                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                detectedStop?.id === stop.id
                                                    ? 'bg-slate-600 text-white'
                                                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                {stop.stopNumber}
                                            </div>
                                            <span className="text-slate-900 dark:text-white font-medium">
                                                {stop.name}
                                            </span>
                                            {detectedStop?.id === stop.id && (
                                                <span className="ml-auto text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    GPS detected
                                                </span>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
