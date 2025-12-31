// Route color mapping and configuration

export interface RouteColorConfig {
    bg: string;
    gradient: string;
}

export const ROUTE_COLORS: Record<string, RouteColorConfig> = {
    'West Route': {
        bg: 'bg-green-500',
        gradient: 'from-green-500 to-green-600',
    },
    'Central Route': {
        bg: 'bg-red-500',
        gradient: 'from-red-500 to-red-600',
    },
    'Midtown Route': {
        bg: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600',
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
