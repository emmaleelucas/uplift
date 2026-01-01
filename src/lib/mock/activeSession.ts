import { ActiveSession, RouteWithStops } from "@/types/distribution";

// Generate a mock active session for testing
export function generateMockActiveSession(route: RouteWithStops, stopIndex?: number): ActiveSession {
    // Simulate being at a specific stop (default to stop 2, or first stop if only one)
    const currentStopIndex = stopIndex ?? Math.min(1, route.stops.length - 1);
    const sortedStops = [...route.stops].sort((a, b) => a.stopNumber - b.stopNumber);
    const currentStop = sortedStops[currentStopIndex];
    const nextStop = sortedStops[currentStopIndex + 1];

    // Generate location near current stop (with slight offset to simulate movement)
    const latOffset = (Math.random() - 0.5) * 0.002; // ~200m variance
    const lngOffset = (Math.random() - 0.5) * 0.002;

    return {
        id: `mock-session-${route.id}`,
        routeId: route.id,
        routeName: route.name,
        startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Started 45 min ago
        endedAt: null,
        currentStopId: currentStop?.id || null,
        currentStopNumber: currentStop?.stopNumber,
        isActive: true,
        route: route,
        currentLocation: currentStop ? {
            id: `mock-location-${route.id}`,
            sessionId: `mock-session-${route.id}`,
            latitude: currentStop.latitude + latOffset,
            longitude: currentStop.longitude + lngOffset,
            recordedAt: new Date().toISOString(),
        } : undefined,
        nextStop,
    };
}

// Generate mock sessions for all routes (simulating active distribution night)
export function getMockActiveSessions(routes: RouteWithStops[]): ActiveSession[] {
    // Generate active sessions for all routes with stops
    return routes
        .filter(route => route.stops.length > 0)
        .map((route, index) => {
            // Vary which stop each route is at for more realistic testing
            const stopIndex = Math.min(index, route.stops.length - 1);
            return generateMockActiveSession(route, stopIndex);
        });
}
