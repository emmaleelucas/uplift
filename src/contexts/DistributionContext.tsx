"use client";

import { createContext, useContext, ReactNode } from "react";
import { RouteStop, Route } from "@/types/distribution";
import { useRouteStops } from "@/hooks/distribution/useRouteStops";

interface DistributionContextType {
    // Routes and stops
    routes: Route[];
    routeStops: RouteStop[];
    loadingRoutes: boolean;

    // Current stop
    currentStop: RouteStop | null;
    stopConfirmed: boolean;
    routeStopId: string | null;

    // Actions
    confirmStop: (stop: RouteStop) => void;
    changeStop: () => void;
}

const DistributionContext = createContext<DistributionContextType | null>(null);

export function DistributionProvider({ children }: { children: ReactNode }) {
    const {
        routes,
        routeStops,
        currentStop,
        stopConfirmed,
        routeStopId,
        loadingRoutes,
        confirmStop,
        changeStop,
    } = useRouteStops();

    return (
        <DistributionContext.Provider
            value={{
                routes,
                routeStops,
                loadingRoutes,
                currentStop,
                stopConfirmed,
                routeStopId,
                confirmStop,
                changeStop,
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
