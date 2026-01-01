import { createClient } from "@/lib/supabase/client";
import {
    Route,
    RouteStop,
    RouteWithStops,
    RouteSchedule,
} from "@/types/distribution";

const supabase = createClient();

export async function fetchRoutes(): Promise<Route[]> {
    const { data } = await supabase
        .from('route')
        .select('id, name')
        .order('name');

    return data || [];
}

export async function fetchRouteStops(): Promise<RouteStop[]> {
    const { data: stops } = await supabase
        .from('route_stop')
        .select(`
            id,
            name,
            location_description,
            latitude,
            longitude,
            stop_number,
            route_id,
            route:route_id (name)
        `)
        .order('stop_number');

    if (!stops || stops.length === 0) return [];

    return stops.map(s => ({
        id: s.id,
        name: s.name,
        locationDescription: s.location_description,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        stopNumber: s.stop_number,
        routeId: s.route_id,
        routeName: (s.route as unknown as { name: string } | null)?.name
    }));
}

export async function fetchRoutesWithStops(): Promise<RouteWithStops[]> {
    const { data: routes } = await supabase
        .from('route')
        .select('id, name')
        .order('name');

    if (!routes) return [];

    const routesWithStops: RouteWithStops[] = [];

    for (const route of routes) {
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
            .eq('route_id', route.id)
            .order('stop_number');

        const { data: schedules } = await supabase
            .from('route_schedule')
            .select('id, day_of_week, start_time')
            .eq('route_id', route.id);

        routesWithStops.push({
            id: route.id,
            name: route.name,
            stops: (stops || []).map(s => ({
                id: s.id,
                name: s.name,
                locationDescription: s.location_description,
                latitude: parseFloat(s.latitude),
                longitude: parseFloat(s.longitude),
                stopNumber: s.stop_number,
                routeId: route.id,
                routeName: route.name,
            })),
            schedules: (schedules || []).map(s => ({
                id: s.id,
                routeId: route.id,
                dayOfWeek: s.day_of_week,
                startTime: s.start_time,
            })),
        });
    }

    return routesWithStops;
}

export async function fetchRouteSchedules(): Promise<RouteSchedule[]> {
    const { data } = await supabase
        .from('route_schedule')
        .select('id, route_id, day_of_week, start_time')
        .order('day_of_week');

    return (data || []).map(s => ({
        id: s.id,
        routeId: s.route_id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
    }));
}
