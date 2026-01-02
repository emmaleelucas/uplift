"use client";

import { Navigation } from "lucide-react";
import { RouteStop } from "@/types/distribution";
import { getRouteColor } from "@/lib/constants/routes";

interface StopHeaderProps {
    currentStop: RouteStop;
    nextStop: RouteStop | null;
    onChangeStop: () => void;
    onMoveToNextStop?: () => void;
}

// Generate Google Maps navigation URL
function getGoogleMapsUrl(stop: RouteStop): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
}

export function StopHeader({
    currentStop,
    nextStop,
    onChangeStop,
    onMoveToNextStop,
}: StopHeaderProps) {
    const routeColor = getRouteColor(currentStop.routeName);

    const handleNavigate = () => {
        if (nextStop) {
            window.open(getGoogleMapsUrl(nextStop), '_blank');
        }
    };

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
                    <>
                        <button
                            onClick={handleNavigate}
                            className="mt-3 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-4 h-4" />
                            Navigate to Stop {nextStop.stopNumber}: {nextStop.name}
                        </button>
                        {onMoveToNextStop && (
                            <button
                                onClick={onMoveToNextStop}
                                className="mt-2 w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-sm font-medium transition-colors"
                            >
                                Move to Stop {nextStop.stopNumber}: {nextStop.name}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
