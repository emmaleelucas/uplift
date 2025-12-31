// Route color mapping and configuration

export interface RouteColorConfig {
    bg: string;
    gradient: string;
    light: string;
    text: string;
}

export const ROUTE_COLORS: Record<string, RouteColorConfig> = {
    'West Route': {
        bg: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        light: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-500',
    },
    'Central Route': {
        bg: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600',
        light: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-500',
    },
    'Midtown Route': {
        bg: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600',
        light: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-500',
    },
    'East Route': {
        bg: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600',
        light: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-500',
    },
};

const DEFAULT_ROUTE_COLOR = ROUTE_COLORS['West Route'];

export const getRouteColor = (routeName: string | undefined): RouteColorConfig => {
    if (!routeName) return DEFAULT_ROUTE_COLOR;
    return ROUTE_COLORS[routeName] || DEFAULT_ROUTE_COLOR;
};

// Location/GPS configuration
export const USE_MOCK_LOCATION = false;

// West Route - Stop 3: Old Price Chopper (43rd/State Ave)
export const MOCK_COORDINATES = { lat: 39.115032, lng: -94.680444 };

// Stop detection radius in meters (volunteer must be within this distance to detect a stop)
export const STOP_DETECTION_RADIUS = 350;
