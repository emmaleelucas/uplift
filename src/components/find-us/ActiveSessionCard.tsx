"use client";

import { ActiveSession } from "@/types/distribution";
import { getRouteColor, MINUTES_PER_STOP } from "@/lib/constants/routes";
import { Navigation, Clock, MapPin } from "lucide-react";

interface ActiveSessionCardProps {
    session: ActiveSession;
    estimatedArrivalMinutes?: number;
}

// Format estimated arrival time
function formatEstimatedTime(minutesFromNow: number): string {
    const arrival = new Date(Date.now() + minutesFromNow * 60 * 1000);
    return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ActiveSessionCard({ session, estimatedArrivalMinutes }: ActiveSessionCardProps) {
    const routeColor = getRouteColor(session.routeName);
    const sortedStops = [...session.route.stops].sort((a, b) => a.stopNumber - b.stopNumber);
    const currentStop = sortedStops.find(s => s.id === session.currentStopId);
    const nextStop = session.nextStop;

    // Calculate progress info
    const totalStops = sortedStops.length;
    const completedStops = currentStop ? currentStop.stopNumber - 1 : 0;
    const remainingStops = sortedStops.filter(s => !currentStop || s.stopNumber > currentStop.stopNumber);
    const remainingMinutes = remainingStops.length * MINUTES_PER_STOP;
    const estimatedFinishTime = formatEstimatedTime(remainingMinutes);

    const handleNavigate = () => {
        if (nextStop) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${nextStop.latitude},${nextStop.longitude}`;
            window.open(url, "_blank");
        } else if (currentStop) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}`;
            window.open(url, "_blank");
        }
    };

    return (
        <div className={`bg-gradient-to-r ${routeColor.gradient} text-white rounded-xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🚐</span>
                    <div>
                        <h3 className="font-semibold">{session.routeName}</h3>
                        <p className="text-xs text-white/80">Van is on route!</p>
                    </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-white/20 rounded-full animate-pulse">
                    LIVE
                </span>
            </div>

            {/* Current position */}
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
                {currentStop && (
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-white/70">Currently at</p>
                            <p className="font-medium">Stop {currentStop.stopNumber}: {currentStop.name}</p>
                        </div>
                    </div>
                )}

                {nextStop && (
                    <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-white/70">Next stop</p>
                            <p className="font-medium">Stop {nextStop.stopNumber}: {nextStop.name}</p>
                            {estimatedArrivalMinutes !== undefined && (
                                <div className="flex items-center gap-1 mt-1 text-sm text-white/90">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>~{estimatedArrivalMinutes} min away</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Get directions button */}
            <button
                onClick={handleNavigate}
                className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Navigation className="w-4 h-4" />
                <span>Get Directions to {nextStop ? "Next Stop" : "Van"}</span>
            </button>

            {/* Progress and remaining stops */}
            <div className="mt-3 pt-3 border-t border-white/20">
                {/* Progress summary */}
                <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-white/70">
                        <span className="font-medium text-white">{completedStops}</span> of {totalStops} stops completed
                    </div>
                    <div className="text-xs text-white/70">
                        ~{remainingMinutes} min left · Done ~{estimatedFinishTime}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-white/20 rounded-full mb-3">
                    <div
                        className="h-full bg-white/80 rounded-full transition-all"
                        style={{ width: `${(completedStops / totalStops) * 100}%` }}
                    />
                </div>

                {/* Remaining stops list */}
                <p className="text-xs text-white/70 mb-2">{remainingStops.length} stop{remainingStops.length !== 1 ? 's' : ''} remaining:</p>
                <div className="flex flex-wrap gap-1.5">
                    {remainingStops
                        .slice(0, 5)
                        .map(stop => (
                            <span
                                key={stop.id}
                                className="px-2 py-0.5 text-xs bg-white/20 rounded-full"
                            >
                                {stop.stopNumber}. {stop.name}
                            </span>
                        ))}
                    {remainingStops.length > 5 && (
                        <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full">
                            +{remainingStops.length - 5} more
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
