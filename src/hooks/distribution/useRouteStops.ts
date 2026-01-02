"use client";

import { useState, useEffect } from "react";
import { Route, RouteStop } from "@/types/distribution";
import { fetchRoutes, fetchRouteStops } from "@/db/actions";

export function useRouteStops() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
    const [stopConfirmed, setStopConfirmed] = useState(false);
    const [routeStopId, setRouteStopId] = useState<string | null>(null);
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    // Reset stop selection on mount (ensures fresh state on every page visit)
    useEffect(() => {
        setCurrentStop(null);
        setStopConfirmed(false);
        setRouteStopId(null);
    }, []);

    // Fetch routes and route stops
    useEffect(() => {
        const loadRoutesAndStops = async () => {
            setLoadingRoutes(true);
            const [routesData, stopsData] = await Promise.all([
                fetchRoutes(),
                fetchRouteStops()
            ]);

            setRoutes(routesData);
            setRouteStops(stopsData);
            setLoadingRoutes(false);
        };
        loadRoutesAndStops();
    }, []);

    // Confirm the selected stop
    const confirmStop = (stop: RouteStop) => {
        setCurrentStop(stop);
        setRouteStopId(stop.id);
        setStopConfirmed(true);
    };

    // Change stop (reset confirmation)
    const changeStop = () => {
        setStopConfirmed(false);
        setCurrentStop(null);
        setRouteStopId(null);
    };

    return {
        routes,
        routeStops,
        currentStop,
        stopConfirmed,
        routeStopId,
        loadingRoutes,
        confirmStop,
        changeStop,
    };
}
