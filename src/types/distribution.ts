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
