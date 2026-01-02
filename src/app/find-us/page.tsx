"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RouteWithStops } from "@/types/distribution";
import { fetchRoutesWithStops } from "@/db/actions";
import { ScheduleGrid } from "@/components/find-us/ScheduleCard";
import { MapPin, RefreshCw } from "lucide-react";

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
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const routesData = await fetchRoutesWithStops();
        setRoutes(routesData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

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
                            selectedRouteId={selectedRouteId}
                            accessToken={MAPBOX_ACCESS_TOKEN}
                        />
                    ) : (
                        <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
                            <p className="text-gray-500">Map unavailable - MapBox token not configured</p>
                        </div>
                    )}
                </div>

                {/* Routes */}
                <ScheduleGrid
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
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
