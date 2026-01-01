import { createClient } from "@/lib/supabase/client";
import {
    RouteStop,
    ActiveSession,
    DistributionSession,
    VanLocation,
} from "@/types/distribution";

const supabase = createClient();

// ==========================================
// ACTIVE SESSIONS (PUBLIC - FIND US PAGE)
// ==========================================

export async function fetchActiveDistributionSessions(): Promise<ActiveSession[]> {
    const { data: sessions } = await supabase
        .from('distribution_session')
        .select(`
            id,
            route_id,
            started_at,
            ended_at,
            current_stop_id,
            is_active,
            route:route_id (id, name)
        `)
        .eq('is_active', true);

    if (!sessions || sessions.length === 0) return [];

    const activeSessions: ActiveSession[] = [];

    for (const session of sessions) {
        const routeData = session.route as unknown as { id: string; name: string };

        // Get route stops
        const { data: stops } = await supabase
            .from('route_stop')
            .select(`
                id,
                name,
                location_description,
                latitude,
                longitude,
                stop_number
            `)
            .eq('route_id', routeData.id)
            .order('stop_number');

        // Get latest van location
        const { data: locations } = await supabase
            .from('van_location')
            .select('id, latitude, longitude, recorded_at')
            .eq('session_id', session.id)
            .order('recorded_at', { ascending: false })
            .limit(1);

        const routeStops: RouteStop[] = (stops || []).map(s => ({
            id: s.id,
            name: s.name,
            locationDescription: s.location_description,
            latitude: parseFloat(s.latitude),
            longitude: parseFloat(s.longitude),
            stopNumber: s.stop_number,
            routeId: routeData.id,
            routeName: routeData.name,
        }));

        const currentStop = routeStops.find(s => s.id === session.current_stop_id);
        const nextStop = currentStop
            ? routeStops.find(s => s.stopNumber === currentStop.stopNumber + 1)
            : routeStops[0];

        activeSessions.push({
            id: session.id,
            routeId: routeData.id,
            routeName: routeData.name,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            currentStopId: session.current_stop_id,
            currentStopNumber: currentStop?.stopNumber,
            isActive: session.is_active,
            route: {
                id: routeData.id,
                name: routeData.name,
                stops: routeStops,
            },
            currentLocation: locations?.[0] ? {
                id: locations[0].id,
                sessionId: session.id,
                latitude: parseFloat(locations[0].latitude),
                longitude: parseFloat(locations[0].longitude),
                recordedAt: locations[0].recorded_at,
            } : undefined,
            nextStop,
        });
    }

    return activeSessions;
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function startDistributionSession(routeId: string): Promise<string | null> {
    // End any existing active sessions for this route
    await supabase
        .from('distribution_session')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('route_id', routeId)
        .eq('is_active', true);

    // Create new session
    const { data, error } = await supabase
        .from('distribution_session')
        .insert({
            route_id: routeId,
            is_active: true,
        })
        .select('id')
        .single();

    if (error || !data) return null;
    return data.id;
}

export async function endDistributionSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
        .from('distribution_session')
        .update({
            is_active: false,
            ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

    return !error;
}

export async function updateSessionCurrentStop(
    sessionId: string,
    stopId: string | null
): Promise<boolean> {
    const { error } = await supabase
        .from('distribution_session')
        .update({ current_stop_id: stopId })
        .eq('id', sessionId);

    return !error;
}

export async function getActiveSessionForRoute(routeId: string): Promise<DistributionSession | null> {
    const { data } = await supabase
        .from('distribution_session')
        .select('id, route_id, started_at, ended_at, current_stop_id, is_active')
        .eq('route_id', routeId)
        .eq('is_active', true)
        .single();

    if (!data) return null;

    return {
        id: data.id,
        routeId: data.route_id,
        startedAt: data.started_at,
        endedAt: data.ended_at,
        currentStopId: data.current_stop_id,
        isActive: data.is_active,
    };
}

// ==========================================
// VAN LOCATION TRACKING
// ==========================================

export async function recordVanLocation(
    sessionId: string,
    latitude: number,
    longitude: number
): Promise<string | null> {
    const { data, error } = await supabase
        .from('van_location')
        .insert({
            session_id: sessionId,
            latitude,
            longitude,
        })
        .select('id')
        .single();

    if (error || !data) return null;
    return data.id;
}

export async function getLatestVanLocation(sessionId: string): Promise<VanLocation | null> {
    const { data } = await supabase
        .from('van_location')
        .select('id, session_id, latitude, longitude, recorded_at')
        .eq('session_id', sessionId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

    if (!data) return null;

    return {
        id: data.id,
        sessionId: data.session_id,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        recordedAt: data.recorded_at,
    };
}
