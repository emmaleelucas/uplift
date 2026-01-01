"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RouteWithStops, ActiveSession } from "@/types/distribution";
import { fetchRoutesWithStops, fetchActiveDistributionSessions } from "@/db/actions";
import { ScheduleGrid, ActiveSessionCard } from "@/components/find-us";
import { MapPin, RefreshCw } from "lucide-react";
import { MINUTES_PER_STOP } from "@/lib/constants/routes";

// MapBox access token from environment
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Dynamically import map to avoid SSR issues with MapBox
const RouteMap = dynamic(
    () => import("@/components/find-us/RouteMap").then((mod) => mod.RouteMap),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading map...</div>
            </div>
        ),
    }
);

export default function FindUsPage() {
    const [routes, setRoutes] = useState<RouteWithStops[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [routesData, sessionsData] = await Promise.all([
            fetchRoutesWithStops(),
            fetchActiveDistributionSessions(),
        ]);
        setRoutes(routesData);
        setActiveSessions(sessionsData);
        setLastRefresh(new Date());
        setLoading(false);
    };

    useEffect(() => {
        loadData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadData();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const activeRouteIds = activeSessions.map((s) => s.routeId);
    const hasActiveSessions = activeSessions.length > 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-blue-600" />
                                Find Us
                            </h1>
                            <p className="text-gray-600 mt-1">
                                See where our vans are and when they&apos;ll arrive
                            </p>
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Active sessions banner */}
                {hasActiveSessions && (
                    <div className="rounded-xl p-4 bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                            <div className="w-3 h-3 rounded-full animate-pulse bg-green-500" />
                            <span className="font-medium">
                                {activeSessions.length} van{activeSessions.length > 1 ? "s" : ""} currently on route!
                            </span>
                        </div>
                        <p className="text-sm mt-1 text-green-600">
                            Last updated: {lastRefresh?.toLocaleTimeString() || "..."}
                        </p>
                    </div>
                )}

                {/* Map */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Route Map</h2>
                        {selectedRouteId && (
                            <button
                                onClick={() => setSelectedRouteId(null)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Show all routes
                            </button>
                        )}
                    </div>
                    {MAPBOX_ACCESS_TOKEN ? (
                        <RouteMap
                            routes={routes}
                            activeSessions={activeSessions}
                            selectedRouteId={selectedRouteId}
                            accessToken={MAPBOX_ACCESS_TOKEN}
                        />
                    ) : (
                        <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
                            <p className="text-gray-500">Map unavailable - MapBox token not configured</p>
                        </div>
                    )}
                </div>

                {/* Active session cards */}
                {hasActiveSessions && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Active Routes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeSessions.map((session) => {
                                const etaMinutes = session.nextStop
                                    ? (session.currentStopNumber && session.nextStop.stopNumber
                                        ? Math.max(0, (session.nextStop.stopNumber - session.currentStopNumber) * MINUTES_PER_STOP)
                                        : session.nextStop.stopNumber * MINUTES_PER_STOP)
                                    : undefined;
                                return (
                                    <ActiveSessionCard
                                        key={session.id}
                                        session={session}
                                        estimatedArrivalMinutes={etaMinutes}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Routes */}
                <ScheduleGrid
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    activeRouteIds={activeRouteIds}
                    activeSessions={activeSessions}
                />

                {/* Loading state */}
                {loading && routes.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>
        </div>
    );
}
