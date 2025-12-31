"use client";

import { Navigation, MapPin, Check, X } from "lucide-react";
import { RouteStop } from "@/types/distribution";
import { getRouteColor } from "@/lib/constants/routes";

interface StopHeaderProps {
    currentStop: RouteStop;
    nextStop: RouteStop | null;
    newStopDetected?: RouteStop | null;
    onChangeStop: () => void;
    onConfirmNewStop?: () => void;
    onDismissNewStop?: () => void;
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
    onDismissNewStop,
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
                    {!newStopDetected && (
                        <button
                            onClick={onChangeStop}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Change
                        </button>
                    )}
                </div>

                {/* Navigate to Next Stop */}
                {nextStop && !newStopDetected && (
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
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-4 border-2 border-white/20">
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

// New Stop Detected Modal - Blocks UI until user responds
interface NewStopModalProps {
    newStop: RouteStop;
    currentStop: RouteStop;
    onConfirm: () => void;
    onStayAtCurrent: () => void;
    onSelectDifferent: () => void;
}

export function NewStopDetectedModal({
    newStop,
    currentStop,
    onConfirm,
    onStayAtCurrent,
    onSelectDifferent,
}: NewStopModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-blue-500 text-white p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">New Location Detected</h2>
                    <p className="text-blue-100">It looks like you've moved to a new stop</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* New Stop */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-xl p-4">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">DETECTED STOP</p>
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-7 h-7 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center">
                                {newStop.stopNumber}
                            </span>
                            {newStop.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{newStop.routeName}</p>
                    </div>

                    {/* Current Stop */}
                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">CURRENT STOP</p>
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-7 h-7 bg-slate-400 text-white rounded-full text-sm flex items-center justify-center">
                                {currentStop.stopNumber}
                            </span>
                            {currentStop.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentStop.routeName}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Switch to {newStop.name}
                    </button>
                    <button
                        onClick={onStayAtCurrent}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Stay at {currentStop.name}
                    </button>
                    <button
                        onClick={onSelectDifferent}
                        className="w-full py-2 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                        Select a different stop
                    </button>
                </div>
            </div>
        </div>
    );
}
