// Types for the distribution/check-in system

export interface Category {
    id: string;
    name: string;
}

export interface ItemType {
    id: string;
    name: string;
    item_category_id: string;
}

export interface DistributionItem {
    id: string;
    itemTypeId: string;
    name: string;
    quantity: number;
}

export interface CheckedInPerson {
    id: string;
    distributionIds: string[];
    firstName: string;
    lastName: string | null;
    ssnLast4: string | null;
    mealServed: boolean;
    mealsTakeAway: number;
    items: DistributionItem[];
    checkedInAt: string;
    previousStopName?: string;
    previousRouteName?: string;
}

export interface SelectedItem {
    itemTypeId: string;
    name: string;
    category: string;
    quantity: number;
}

export interface RouteStop {
    id: string;
    name: string;
    locationDescription: string | null;
    latitude: number;
    longitude: number;
    stopNumber: number;
    routeId?: string;
    routeName?: string;
}

export interface Route {
    id: string;
    name: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteSchedule {
    id: string;
    routeId: string;
    dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
    startTime: string; // e.g., "18:00"
}

export interface DistributionSession {
    id: string;
    routeId: string;
    routeName?: string;
    startedAt: string;
    endedAt: string | null;
    currentStopId: string | null;
    currentStopNumber?: number;
    isActive: boolean;
}

export interface VanLocation {
    id: string;
    sessionId: string;
    latitude: number;
    longitude: number;
    recordedAt: string;
}

export interface RouteWithStops extends Route {
    stops: RouteStop[];
    schedules?: RouteSchedule[];
}

export interface ActiveSession extends DistributionSession {
    route: RouteWithStops;
    currentLocation?: VanLocation;
    nextStop?: RouteStop;
    estimatedArrival?: string;
}
