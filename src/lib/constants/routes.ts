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

// Location/GPS configuration
export const USE_MOCK_LOCATION = true;

// Mock location sequence (for testing movement between stops)
export const MOCK_LOCATION_SEQUENCE = [
    { lat: 39.095412, lng: -94.565530, delay: 0 },      // Midtown Stop 1: St Stephens
    { lat: 39.070000, lng: -94.570000, delay: 30000 },  // In transit - not near any stop (after 30s)
    { lat: 39.039341, lng: -94.578715, delay: 60000 },  // Midtown Stop 2: Rockhill & Voelker (after 60s)
];

// Default mock coordinates (first in sequence)
export const MOCK_COORDINATES = MOCK_LOCATION_SEQUENCE[0];

// Stop detection radius in meters (volunteer must be within this distance to detect a stop)
export const STOP_DETECTION_RADIUS = 350;

// Mock active session for find-us page testing
export const USE_MOCK_ACTIVE_SESSION = true;
