"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    Calendar,
    Users,
    Utensils,
    Package,
    MapPin,
    Loader2,
    BarChart3,
    AlertCircle,
    Clock,
    TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Types
interface RouteStopData {
    stopId: string;
    stopName: string;
    stopNumber: number;
    individualsServed: number;
    mealsDistributed: number;
    items: { name: string; quantity: number }[];
}

interface RouteData {
    routeId: string;
    routeName: string;
    stops: RouteStopData[];
    totals: {
        individualsServed: number;
        mealsDistributed: number;
        totalItems: number;
    };
}

interface DistributionDate {
    date: string;
    displayDate: string;
    dayOfWeek: string;
    startTime: string;
    hasData: boolean;
}

interface Averages {
    week: { people: number; meals: number; items: number; runs: number };
    month: { people: number; meals: number; items: number; runs: number };
    year: { people: number; meals: number; items: number; runs: number };
}

// Route schedule: Mon, Wed, Sat
// Mon & Wed: 6pm start, Sat: 5pm start
const ROUTE_DAYS = [1, 3, 6]; // Monday = 1, Wednesday = 3, Saturday = 6
const getStartTime = (dayOfWeek: number) => dayOfWeek === 6 ? "5:00 PM" : "6:00 PM";

// Generate route dates (Mon, Wed, Sat) going back from today
const generateRouteDates = (count: number = 20): DistributionDate[] => {
    const dates: DistributionDate[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(today);

    while (dates.length < count) {
        const dayOfWeek = currentDate.getDay();

        if (ROUTE_DAYS.includes(dayOfWeek)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isToday = currentDate.toDateString() === today.toDateString();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = currentDate.toDateString() === yesterday.toDateString();

            let displayDate: string;
            if (isToday) {
                displayDate = "Today";
            } else if (isYesterday) {
                displayDate = "Yesterday";
            } else {
                displayDate = currentDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }

            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

            dates.push({
                date: dateStr,
                displayDate,
                dayOfWeek: dayName,
                startTime: getStartTime(dayOfWeek),
                hasData: false // Will be updated when we check the database
            });
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }

    return dates;
};

// Mock data for testing when database has no data
const generateMockDataForDate = (date: string): RouteData[] => {
    const baseData = [
        {
            routeId: "west-route",
            routeName: "West Route",
            stops: [
                { stopId: "w1", stopName: "Ryerson", stopNumber: 1, individualsServed: 8, mealsDistributed: 10, items: [{ name: "Blanket", quantity: 4 }, { name: "Socks", quantity: 8 }] },
                { stopId: "w2", stopName: "Old Price Chopper", stopNumber: 2, individualsServed: 12, mealsDistributed: 15, items: [{ name: "Jacket (L)", quantity: 3 }, { name: "Water Bottle", quantity: 12 }] },
                { stopId: "w3", stopName: "Kansas Ave", stopNumber: 3, individualsServed: 6, mealsDistributed: 8, items: [{ name: "Gloves", quantity: 6 }] },
                { stopId: "w4", stopName: "Shawnee Park", stopNumber: 4, individualsServed: 10, mealsDistributed: 12, items: [{ name: "Hygiene Kit", quantity: 8 }] },
                { stopId: "w5", stopName: "Bike Bridge", stopNumber: 5, individualsServed: 5, mealsDistributed: 6, items: [{ name: "T-Shirt (M)", quantity: 3 }] },
                { stopId: "w6", stopName: "West Bottoms", stopNumber: 6, individualsServed: 15, mealsDistributed: 18, items: [{ name: "Sleeping Bag", quantity: 2 }, { name: "Blanket", quantity: 5 }] },
                { stopId: "w7", stopName: "Chavez", stopNumber: 7, individualsServed: 7, mealsDistributed: 9, items: [{ name: "Socks", quantity: 7 }] },
            ],
        },
        {
            routeId: "central-route",
            routeName: "Central Route",
            stops: [
                { stopId: "c1", stopName: "18th/Troost", stopNumber: 1, individualsServed: 14, mealsDistributed: 16, items: [{ name: "Water Bottle", quantity: 14 }, { name: "Granola Bar", quantity: 20 }] },
                { stopId: "c2", stopName: "I-35/Pennway", stopNumber: 2, individualsServed: 8, mealsDistributed: 10, items: [{ name: "Hat", quantity: 5 }] },
                { stopId: "c3", stopName: "6th/Broadway", stopNumber: 3, individualsServed: 11, mealsDistributed: 13, items: [{ name: "Jacket (XL)", quantity: 2 }, { name: "Pants (L)", quantity: 3 }] },
                { stopId: "c4", stopName: "ATM", stopNumber: 4, individualsServed: 6, mealsDistributed: 7, items: [{ name: "Toothbrush", quantity: 6 }] },
                { stopId: "c5", stopName: "Guinotte", stopNumber: 5, individualsServed: 9, mealsDistributed: 11, items: [{ name: "Soap", quantity: 9 }] },
                { stopId: "c6", stopName: "Train Tracks", stopNumber: 6, individualsServed: 4, mealsDistributed: 5, items: [{ name: "Blanket", quantity: 3 }] },
                { stopId: "c7", stopName: "14th/Benton", stopNumber: 7, individualsServed: 7, mealsDistributed: 8, items: [{ name: "Socks", quantity: 7 }] },
            ],
        },
        {
            routeId: "midtown-route",
            routeName: "Midtown Route",
            stops: [
                { stopId: "m1", stopName: "St Stephen's", stopNumber: 1, individualsServed: 10, mealsDistributed: 12, items: [{ name: "Water Bottle", quantity: 10 }] },
                { stopId: "m2", stopName: "Rockhill/Volker", stopNumber: 2, individualsServed: 8, mealsDistributed: 10, items: [{ name: "Blanket", quantity: 4 }] },
                { stopId: "m3", stopName: "45th/Garfield", stopNumber: 3, individualsServed: 6, mealsDistributed: 7, items: [{ name: "Jacket (M)", quantity: 2 }] },
                { stopId: "m4", stopName: "Pick N Pull", stopNumber: 4, individualsServed: 12, mealsDistributed: 14, items: [{ name: "Hygiene Kit", quantity: 10 }] },
                { stopId: "m5", stopName: "Sheffield Park", stopNumber: 5, individualsServed: 5, mealsDistributed: 6, items: [{ name: "Socks", quantity: 5 }] },
            ],
        },
        {
            routeId: "east-route",
            routeName: "East Route",
            stops: [
                { stopId: "e1", stopName: "Chestnut TFwy", stopNumber: 1, individualsServed: 9, mealsDistributed: 11, items: [{ name: "Blanket", quantity: 5 }] },
                { stopId: "e2", stopName: "Quick Fuel", stopNumber: 2, individualsServed: 7, mealsDistributed: 8, items: [{ name: "Water Bottle", quantity: 7 }] },
                { stopId: "e3", stopName: "Train Bridge", stopNumber: 3, individualsServed: 11, mealsDistributed: 13, items: [{ name: "Sleeping Bag", quantity: 3 }, { name: "Tarp", quantity: 2 }] },
                { stopId: "e4", stopName: "435/Independence", stopNumber: 4, individualsServed: 8, mealsDistributed: 10, items: [{ name: "Jacket (L)", quantity: 4 }] },
                { stopId: "e5", stopName: "St John/Bennington", stopNumber: 5, individualsServed: 6, mealsDistributed: 7, items: [{ name: "Gloves", quantity: 6 }] },
            ],
        },
    ];

    // Add some randomization based on date to make it look more realistic
    const dateNum = new Date(date).getTime();
    const randomFactor = (dateNum % 100) / 100;

    return baseData.map(route => {
        const stops = route.stops.map(stop => ({
            ...stop,
            individualsServed: Math.max(1, Math.round(stop.individualsServed * (0.7 + randomFactor * 0.6))),
            mealsDistributed: Math.max(1, Math.round(stop.mealsDistributed * (0.7 + randomFactor * 0.6))),
            items: stop.items.map(item => ({
                ...item,
                quantity: Math.max(1, Math.round(item.quantity * (0.7 + randomFactor * 0.6)))
            }))
        }));

        const totals = {
            individualsServed: stops.reduce((sum, s) => sum + s.individualsServed, 0),
            mealsDistributed: stops.reduce((sum, s) => sum + s.mealsDistributed, 0),
            totalItems: stops.reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0)
        };

        return { ...route, stops, totals };
    });
};

// Generate mock averages
const generateMockAverages = (): Averages => ({
    week: { people: 187, meals: 224, items: 156, runs: 3 },
    month: { people: 748, meals: 896, items: 624, runs: 12 },
    year: { people: 8976, meals: 10752, items: 7488, runs: 144 },
});

export default function DistributionsPage() {
    const [loading, setLoading] = useState(true);
    const [availableDates, setAvailableDates] = useState<DistributionDate[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [routeData, setRouteData] = useState<RouteData[]>([]);
    const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
    const [useMockData, setUseMockData] = useState(false);
    const [averages, setAverages] = useState<Averages | null>(null);

    const supabase = createClient();

    // Fetch data and check which dates have distributions
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Generate route dates (Mon, Wed, Sat)
            const routeDates = generateRouteDates(20);

            // Check which dates have actual distribution data
            const { data: distributions } = await supabase
                .from('distribution')
                .select('created_at')
                .order('created_at', { ascending: false });

            if (distributions && distributions.length > 0) {
                // Get unique dates with data
                const datesWithData = new Set(
                    distributions.map(d => new Date(d.created_at).toISOString().split('T')[0])
                );

                // Update route dates to show which have data
                const updatedDates = routeDates.map(d => ({
                    ...d,
                    hasData: datesWithData.has(d.date)
                }));

                setAvailableDates(updatedDates);
                setUseMockData(false);

                // Calculate real averages
                // TODO: Calculate real averages from database
                setAverages(generateMockAverages());
            } else {
                // No real data - use mock data
                setAvailableDates(routeDates.map(d => ({ ...d, hasData: true })));
                setUseMockData(true);
                setAverages(generateMockAverages());
            }

            // Select first date
            if (routeDates.length > 0) {
                setSelectedDate(routeDates[0].date);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    // Fetch distribution data for selected date
    useEffect(() => {
        if (!selectedDate) return;

        const fetchDistributionData = async () => {
            setLoading(true);

            if (useMockData) {
                // Use mock data
                const mockData = generateMockDataForDate(selectedDate);
                setRouteData(mockData);
                setExpandedRoutes(new Set(mockData.map(r => r.routeId)));
                setLoading(false);
                return;
            }

            // Fetch real data
            const startOfDay = new Date(selectedDate + 'T00:00:00');
            const endOfDay = new Date(selectedDate + 'T23:59:59');

            const { data: distributions } = await supabase
                .from('distribution')
                .select(`
                    id,
                    homeless_person_id,
                    meal_served,
                    route_stop_id,
                    route_stop:route_stop_id (
                        id,
                        name,
                        stop_number,
                        route:route_id (
                            id,
                            name
                        )
                    )
                `)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            if (!distributions || distributions.length === 0) {
                // No data for this date - show mock data
                const mockData = generateMockDataForDate(selectedDate);
                setRouteData(mockData);
                setExpandedRoutes(new Set(mockData.map(r => r.routeId)));
                setLoading(false);
                return;
            }

            // Get all distribution items
            const distributionIds = distributions.map(d => d.id);
            const { data: items } = await supabase
                .from('distribution_item')
                .select(`
                    distribution_id,
                    quantity,
                    item_type:item_type_id (name)
                `)
                .in('distribution_id', distributionIds);

            // Build route data structure
            const routeMap = new Map<string, RouteData>();

            distributions.forEach(dist => {
                const routeStop = dist.route_stop as unknown as {
                    id: string;
                    name: string;
                    stop_number: number;
                    route: { id: string; name: string } | null;
                } | null;

                if (!routeStop || !routeStop.route) {
                    const routeId = "unassigned";
                    if (!routeMap.has(routeId)) {
                        routeMap.set(routeId, {
                            routeId,
                            routeName: "Unassigned Location",
                            stops: [],
                            totals: { individualsServed: 0, mealsDistributed: 0, totalItems: 0 }
                        });
                    }
                    return;
                }

                const routeId = routeStop.route.id;
                const routeName = routeStop.route.name;

                if (!routeMap.has(routeId)) {
                    routeMap.set(routeId, {
                        routeId,
                        routeName,
                        stops: [],
                        totals: { individualsServed: 0, mealsDistributed: 0, totalItems: 0 }
                    });
                }

                const route = routeMap.get(routeId)!;
                let stop = route.stops.find(s => s.stopId === routeStop.id);
                if (!stop) {
                    stop = {
                        stopId: routeStop.id,
                        stopName: routeStop.name,
                        stopNumber: routeStop.stop_number,
                        individualsServed: 0,
                        mealsDistributed: 0,
                        items: []
                    };
                    route.stops.push(stop);
                }

                stop.individualsServed++;
                stop.mealsDistributed += dist.meal_served;

                const distItems = items?.filter(i => i.distribution_id === dist.id) || [];
                distItems.forEach(item => {
                    const itemType = item.item_type as unknown as { name: string } | null;
                    const itemName = itemType?.name || 'Unknown Item';
                    const existing = stop!.items.find(i => i.name === itemName);
                    if (existing) {
                        existing.quantity += item.quantity;
                    } else {
                        stop!.items.push({ name: itemName, quantity: item.quantity });
                    }
                });
            });

            // Calculate totals
            routeMap.forEach(route => {
                route.stops.sort((a, b) => a.stopNumber - b.stopNumber);
                route.totals.individualsServed = route.stops.reduce((sum, s) => sum + s.individualsServed, 0);
                route.totals.mealsDistributed = route.stops.reduce((sum, s) => sum + s.mealsDistributed, 0);
                route.totals.totalItems = route.stops.reduce((sum, s) =>
                    sum + s.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
            });

            const routes = Array.from(routeMap.values()).sort((a, b) => a.routeName.localeCompare(b.routeName));
            setRouteData(routes);
            setExpandedRoutes(new Set(routes.map(r => r.routeId)));
            setLoading(false);
        };

        fetchDistributionData();
    }, [selectedDate, useMockData]);

    const toggleRoute = (routeId: string) => {
        setExpandedRoutes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(routeId)) {
                newSet.delete(routeId);
            } else {
                newSet.add(routeId);
            }
            return newSet;
        });
    };

    // Calculate grand totals
    const grandTotals = routeData.reduce(
        (acc, route) => ({
            individualsServed: acc.individualsServed + route.totals.individualsServed,
            mealsDistributed: acc.mealsDistributed + route.totals.mealsDistributed,
            totalItems: acc.totalItems + route.totals.totalItems,
        }),
        { individualsServed: 0, mealsDistributed: 0, totalItems: 0 }
    );

    const selectedDateInfo = availableDates.find(d => d.date === selectedDate);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin-portal"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                Distribution Data
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Routes run Mon, Wed, Sat
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Mock Data Banner */}
                {useMockData && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Showing Sample Data
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                No distribution data found in the database. Displaying sample data for demonstration.
                            </p>
                        </div>
                    </div>
                )}

                {/* Averages Section */}
                {averages && (
                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Averages
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Past Week */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Past Week</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">People Served</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{averages.week.people}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Meals</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">{averages.week.meals}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Items</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">{averages.week.items}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span className="text-xs text-slate-500">Runs</span>
                                        <span className="text-xs text-slate-500">{averages.week.runs}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Past Month */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Past Month</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">People Served</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{averages.month.people}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Meals</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">{averages.month.meals}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Items</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">{averages.month.items}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span className="text-xs text-slate-500">Runs</span>
                                        <span className="text-xs text-slate-500">{averages.month.runs}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Past Year */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Past Year</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">People Served</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{averages.year.people.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Meals</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">{averages.year.meals.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">Items</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">{averages.year.items.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span className="text-xs text-slate-500">Runs</span>
                                        <span className="text-xs text-slate-500">{averages.year.runs}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Select Route Date
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableDates.slice(0, 12).map(({ date, displayDate, dayOfWeek, startTime, hasData }) => (
                            <button
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center ${
                                    selectedDate === date
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : hasData
                                            ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <span className="font-semibold">{displayDate}</span>
                                <span className={`text-xs ${selectedDate === date ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {dayOfWeek} @ {startTime}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Date Info */}
                {selectedDateInfo && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                            {selectedDateInfo.dayOfWeek} routes start at {selectedDateInfo.startTime}
                        </span>
                    </div>
                )}

                {/* Summary Cards */}
                {!loading && routeData.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {grandTotals.individualsServed}
                                    </p>
                                    <p className="text-xs text-slate-500">People Served</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Utensils className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {grandTotals.mealsDistributed}
                                    </p>
                                    <p className="text-xs text-slate-500">Meals Served</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {grandTotals.totalItems}
                                    </p>
                                    <p className="text-xs text-slate-500">Items Given</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {/* No Data State */}
                {!loading && routeData.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                            No distribution data for this date
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Select a different date or check back after distributions have been logged.
                        </p>
                    </div>
                )}

                {/* Route Cards */}
                {!loading && routeData.map(route => (
                    <div
                        key={route.routeId}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden"
                    >
                        {/* Route Header */}
                        <button
                            onClick={() => toggleRoute(route.routeId)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {route.routeName}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden sm:flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <Users className="w-4 h-4" />
                                        {route.totals.individualsServed}
                                    </span>
                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                        <Utensils className="w-4 h-4" />
                                        {route.totals.mealsDistributed}
                                    </span>
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <Package className="w-4 h-4" />
                                        {route.totals.totalItems}
                                    </span>
                                </div>
                                {expandedRoutes.has(route.routeId) ? (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Mobile Route Totals */}
                        <div className="sm:hidden px-4 pb-3 flex items-center gap-4 text-sm border-b border-slate-100 dark:border-slate-700">
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Users className="w-4 h-4" />
                                {route.totals.individualsServed} people
                            </span>
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                <Utensils className="w-4 h-4" />
                                {route.totals.mealsDistributed} meals
                            </span>
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Package className="w-4 h-4" />
                                {route.totals.totalItems} items
                            </span>
                        </div>

                        {/* Stops */}
                        {expandedRoutes.has(route.routeId) && (
                            <div className="border-t border-slate-100 dark:border-slate-700">
                                {route.stops.map((stop, index) => (
                                    <div
                                        key={stop.stopId}
                                        className={`p-4 ${index !== route.stops.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    {stop.stopNumber}
                                                </span>
                                            </div>

                                            <div className="flex-grow">
                                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                                    {stop.stopName}
                                                </h3>

                                                <div className="flex flex-wrap gap-3 mb-3">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                                        <Users className="w-4 h-4" />
                                                        {stop.individualsServed} people
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                                                        <Utensils className="w-4 h-4" />
                                                        {stop.mealsDistributed} meals
                                                    </span>
                                                </div>

                                                {stop.items.length > 0 && (
                                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                            Items Distributed:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {stop.items.map((item, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-600 rounded text-xs text-slate-700 dark:text-slate-200"
                                                                >
                                                                    {item.name}
                                                                    <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                                                                        x{item.quantity}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Route Total Footer */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 border-t border-slate-200 dark:border-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            Route Total
                                        </span>
                                        <div className="flex items-center gap-4 text-sm font-medium">
                                            <span className="text-blue-600 dark:text-blue-400">
                                                {route.totals.individualsServed} people
                                            </span>
                                            <span className="text-orange-600 dark:text-orange-400">
                                                {route.totals.mealsDistributed} meals
                                            </span>
                                            <span className="text-green-600 dark:text-green-400">
                                                {route.totals.totalItems} items
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
