"use client";

import { Navigation, MapPin, Check } from "lucide-react";
import { RouteStop } from "@/types/distribution";
import { getRouteColor } from "@/lib/constants/routes";

interface StopHeaderProps {
    currentStop: RouteStop;
    nextStop: RouteStop | null;
    newStopDetected?: RouteStop | null;
    onChangeStop: () => void;
    onConfirmNewStop?: () => void;
}

// Generate Google Maps navigation URL
function getGoogleMapsUrl(stop: RouteStop): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
}

export function StopHeader({
    currentStop,
    nextStop,
    newStopDetected,
    onChangeStop,
    onConfirmNewStop,
}: StopHeaderProps) {
    const routeColor = getRouteColor(currentStop.routeName);

    const handleNavigate = () => {
        if (nextStop) {
            window.open(getGoogleMapsUrl(nextStop), '_blank');
        }
    };

    // If new stop detected, show only the detection banner
    if (newStopDetected && onConfirmNewStop) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500 rounded-xl p-4 animate-pulse-subtle">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                New location detected
                            </p>
                            <p className="text-blue-600 dark:text-blue-300 font-semibold">
                                Stop {newStopDetected.stopNumber}: {newStopDetected.name}
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                                {newStopDetected.routeName}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onConfirmNewStop}
                        className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirm Location
                    </button>

                    <button
                        onClick={onChangeStop}
                        className="w-full mt-2 py-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                        Select a different stop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
            {/* Current Stop Card */}
            <div className={`bg-gradient-to-r ${routeColor.gradient} text-white rounded-xl px-4 py-3 border-2 border-white/20`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white/70">{currentStop.routeName}</p>
                        <p className="font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 bg-white/20 rounded-full text-sm flex items-center justify-center">
                                {currentStop.stopNumber}
                            </span>
                            {currentStop.name}
                        </p>
                    </div>
                    <button
                        onClick={onChangeStop}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                        Change
                    </button>
                </div>

                {/* Navigate to Next Stop */}
                {nextStop && (
                    <button
                        onClick={handleNavigate}
                        className="mt-3 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-4 h-4" />
                        Navigate to Stop {nextStop.stopNumber}: {nextStop.name}
                    </button>
                )}
            </div>
        </div>
    );
}

// In Transit Header - Shown when user has left a stop and is heading to next
interface InTransitHeaderProps {
    lastStop: RouteStop;
    nextStop: RouteStop | null;
    onChangeStop: () => void;
}

export function InTransitHeader({ lastStop, nextStop, onChangeStop }: InTransitHeaderProps) {
    const handleNavigate = () => {
        if (nextStop) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${nextStop.latitude},${nextStop.longitude}`, '_blank');
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl px-4 py-4 border-2 border-white/20">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Navigation className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white/80">In Transit</p>
                        <p className="font-semibold">
                            {nextStop
                                ? `Heading to Stop ${nextStop.stopNumber}: ${nextStop.name}`
                                : `Left Stop ${lastStop.stopNumber}: ${lastStop.name}`
                            }
                        </p>
                    </div>
                </div>

                {nextStop ? (
                    <button
                        onClick={handleNavigate}
                        className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-4 h-4" />
                        Navigate to {nextStop.name}
                    </button>
                ) : (
                    <button
                        onClick={onChangeStop}
                        className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                        Select a Stop
                    </button>
                )}

                <p className="text-xs text-white/60 text-center mt-3">
                    Check-ins paused until you arrive at a stop
                </p>
            </div>
        </div>
    );
}

