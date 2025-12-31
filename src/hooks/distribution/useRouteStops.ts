"use client";

import { useState, useEffect, useRef } from "react";
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
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    // Refs to access current values without adding to dependency array
    const stopConfirmedRef = useRef(stopConfirmed);
    const currentStopRef = useRef(currentStop);
    const routeStopsRef = useRef(routeStops);

    // Keep refs in sync
    useEffect(() => {
        stopConfirmedRef.current = stopConfirmed;
        currentStopRef.current = currentStop;
        routeStopsRef.current = routeStops;
    }, [stopConfirmed, currentStop, routeStops]);

    // Reset stop selection on mount (ensures fresh state on every page visit)
    useEffect(() => {
        setCurrentStop(null);
        setDetectedStop(null);
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

    // Detect current stop based on location (always runs, even when confirmed)
    // Re-runs when location changes OR when routes finish loading
    useEffect(() => {
        const stops = routeStopsRef.current;

        if (!currentLocation || stops.length === 0) {
            setDetectedStop(null);
            return;
        }

        // Find the nearest stop within detection radius
        let nearestStop: RouteStop | null = null;
        let nearestDistance = Infinity;

        for (const stop of stops) {
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
    }, [currentLocation, loadingRoutes]);

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
        loadingRoutes,
        confirmStop,
        changeStop,
    };
}
