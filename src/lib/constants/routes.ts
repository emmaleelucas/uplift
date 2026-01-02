// Uplift Organization HQ - 1516 Prospect Ave, Kansas City, MO 64127
// All routes start and end here
export const UPLIFT_HQ = {
    name: "Uplift HQ",
    address: "1516 Prospect Ave, Kansas City, MO 64127",
    lat: 39.094293167474206,
    lng: -94.55208461807936,
};

// ETA calculation: minutes spent at each stop
export const MINUTES_PER_STOP = 30;

// Route color mapping and configuration

export interface RouteColorConfig {
    bg: string;
    gradient: string;
}

export const ROUTE_COLORS: Record<string, RouteColorConfig> = {
    'West Route': {
        bg: 'bg-green-700',
        gradient: 'from-green-700 to-green-800',
    },
    'Central Route': {
        bg: 'bg-pink-800',
        gradient: 'from-pink-800 to-pink-900',
    },
    'Midtown Route': {
        bg: 'bg-orange-700',
        gradient: 'from-orange-700 to-orange-800',
    },
    'East Route': {
        bg: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600',
    },
};

const DEFAULT_ROUTE_COLOR = ROUTE_COLORS['West Route'];

export const getRouteColor = (routeName: string | undefined): RouteColorConfig => {
    if (!routeName) return DEFAULT_ROUTE_COLOR;
    return ROUTE_COLORS[routeName] || DEFAULT_ROUTE_COLOR;
};
