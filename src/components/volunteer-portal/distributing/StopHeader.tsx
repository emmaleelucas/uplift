"use client";

import { RouteStop } from "@/types/distribution";
import { getRouteColor } from "@/lib/constants/routes";

interface StopHeaderProps {
    currentStop: RouteStop;
    onChangeStop: () => void;
}

export function StopHeader({ currentStop, onChangeStop }: StopHeaderProps) {
    const routeColor = getRouteColor(currentStop.routeName);

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <div className={`bg-gradient-to-r ${routeColor.gradient} text-white rounded-xl px-4 py-3`}>
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
            </div>
        </div>
    );
}
