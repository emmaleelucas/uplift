"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { RouteStop, Route, Coordinates, DistributionSession } from "@/types/distribution";
import { useLocation } from "@/hooks/distribution/useLocation";
import { useRouteStops } from "@/hooks/distribution/useRouteStops";
import { useSessionTracking } from "@/hooks/distribution/useSessionTracking";

interface DistributionContextType {
    // Location
    currentLocation: Coordinates | null;

    // Routes and stops
    routes: Route[];
    routeStops: RouteStop[];
    loadingRoutes: boolean;

    // Current/detected stop
    currentStop: RouteStop | null;
    detectedStop: RouteStop | null;
    stopConfirmed: boolean;
    routeStopId: string | null;

    // Computed states
    newStopDetected: RouteStop | null;
    inTransit: boolean; // User left stop area, no stop detected

    // Session tracking
    session: DistributionSession | null;

    // Actions
    confirmStop: (stop: RouteStop) => void;
    changeStop: () => void;
    dismissNewStop: () => void;
}

const DistributionContext = createContext<DistributionContextType | null>(null);

export function DistributionProvider({ children }: { children: ReactNode }) {
    const { currentLocation } = useLocation();
    const {
        routes,
        routeStops,
        currentStop,
        detectedStop,
        stopConfirmed,
        routeStopId,
        loadingRoutes,
        confirmStop,
        changeStop,
    } = useRouteStops({ currentLocation });

    // Session tracking for van location
    const { session } = useSessionTracking({
        currentLocation,
        routeId: currentStop?.routeId ?? null,
        currentStopId: currentStop?.id ?? null,
        isActive: stopConfirmed,
    });

    // Track dismissed stop ID to prevent re-showing modal for same stop
    const [dismissedStopId, setDismissedStopId] = useState<string | null>(null);

    // Reset dismissed stop when current stop changes
    useEffect(() => {
        setDismissedStopId(null);
    }, [currentStop?.id]);

    // Check if a new stop is detected (different from confirmed stop and not dismissed)
    const newStopDetected = stopConfirmed && detectedStop && currentStop
        && detectedStop.id !== currentStop.id
        && detectedStop.id !== dismissedStopId
        ? detectedStop
        : null;

    // Check if user is in transit (confirmed a stop but no longer near any stop)
    const inTransit = stopConfirmed && currentStop !== null && detectedStop === null && currentLocation !== null;

    // Dismiss the new stop detection (stay at current stop)
    const dismissNewStop = () => {
        if (detectedStop) {
            setDismissedStopId(detectedStop.id);
        }
    };

    return (
        <DistributionContext.Provider
            value={{
                currentLocation,
                routes,
                routeStops,
                loadingRoutes,
                currentStop,
                detectedStop,
                stopConfirmed,
                routeStopId,
                newStopDetected,
                inTransit,
                session,
                confirmStop,
                changeStop,
                dismissNewStop,
            }}
        >
            {children}
        </DistributionContext.Provider>
    );
}

export function useDistribution() {
    const context = useContext(DistributionContext);
    if (!context) {
        throw new Error("useDistribution must be used within a DistributionProvider");
    }
    return context;
}
