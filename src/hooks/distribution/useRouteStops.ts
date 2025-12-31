"use client";

import { useState, useEffect } from "react";
import { Route, RouteStop, Coordinates } from "@/types/distribution";
import { STOP_DETECTION_RADIUS } from "@/lib/constants/routes";
import { getDistanceInMeters } from "./useLocation";
import { fetchRoutes, fetchRouteStops } from "@/db/actions";

interface UseRouteStopsProps {
    currentLocation: Coordinates | null;
}

export function useRouteStops({ currentLocation }: UseRouteStopsProps) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
    const [detectedStop, setDetectedStop] = useState<RouteStop | null>(null);
    const [stopConfirmed, setStopConfirmed] = useState(false);
    const [routeStopId, setRouteStopId] = useState<string | null>(null);

    // Fetch routes and route stops
    useEffect(() => {
        const loadRoutesAndStops = async () => {
            const [routesData, stopsData] = await Promise.all([
                fetchRoutes(),
                fetchRouteStops()
            ]);

            setRoutes(routesData);
            setRouteStops(stopsData);
        };
        loadRoutesAndStops();
    }, []);

    // Detect current stop based on location
    useEffect(() => {
        // If stop is already confirmed, don't change detection
        if (stopConfirmed) return;

        // Otherwise try GPS detection
        if (!currentLocation || routeStops.length === 0) {
            setDetectedStop(null);
            return;
        }

        // Find the nearest stop within detection radius
        let nearestStop: RouteStop | null = null;
        let nearestDistance = Infinity;

        for (const stop of routeStops) {
            const distance = getDistanceInMeters(
                currentLocation.lat,
                currentLocation.lng,
                stop.latitude,
                stop.longitude
            );
            if (distance <= STOP_DETECTION_RADIUS && distance < nearestDistance) {
                nearestStop = stop;
                nearestDistance = distance;
            }
        }

        setDetectedStop(nearestStop);
    }, [currentLocation, routeStops, stopConfirmed]);

    // Confirm the detected or selected stop
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
        detectedStop,
        stopConfirmed,
        routeStopId,
        confirmStop,
        changeStop,
    };
}
