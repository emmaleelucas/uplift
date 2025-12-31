"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    ChevronLeft, Clock, User, Hash, Loader2, UserPlus, UserCheck,
    Utensils, Package, Plus, Minus, X, Search, MapPin, Check,
    ChevronDown, ChevronRight, Shirt, Sparkles, Apple, Bed, Trash2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Types
interface Category {
    id: string;
    name: string;
}

interface ItemType {
    id: string;
    name: string;
    item_category_id: string;
}

interface CheckedInPerson {
    id: string;
    distributionIds: string[]; // All distribution IDs for this person today
    firstName: string;
    lastName: string | null; // Optional last name
    ssnLast4: string | null; // Optional - last 4 digits of SSN for identification
    mealServed: boolean;
    mealsTakeAway: number;
    items: { id: string; itemTypeId: string; name: string; quantity: number }[];
    checkedInAt: string;
    previousStopName?: string; // For "already checked in" indicator
    previousRouteName?: string;
}

interface SelectedItem {
    itemTypeId: string;
    name: string;
    category: string;
    quantity: number;
}

type ActiveTab = 'checkin' | 'serve';

// Route color mapping
const ROUTE_COLORS: Record<string, { bg: string; gradient: string; light: string; text: string }> = {
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

const getRouteColor = (routeName: string | undefined) => {
    if (!routeName) return ROUTE_COLORS['West Route'];
    return ROUTE_COLORS[routeName] || ROUTE_COLORS['West Route'];
};

// Mock location toggle: Set to true for testing
const USE_MOCK_LOCATION = false;
// West Route - Stop 3: Old Price Chopper (43rd/State Ave)
const MOCK_COORDINATES = { lat: 39.115032, lng: -94.680444 };

// Stop detection radius in meters (volunteer must be within this distance to detect a stop)
const STOP_DETECTION_RADIUS = 350;

// Check-in display filters - show all check-ins for today

interface RouteStop {
    id: string;
    name: string;
    locationDescription: string | null;
    latitude: number;
    longitude: number;
    stopNumber: number;
    routeId?: string;
    routeName?: string;
}

export default function DistributingPage() {
    // Single page state - show/hide new check-in form
    const [showNewCheckIn, setShowNewCheckIn] = useState(false);

    // Check-in form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [ssnLast4, setSsnLast4] = useState("");
    const [checkInMealServed, setCheckInMealServed] = useState(true);
    const [checkInTakeAway, setCheckInTakeAway] = useState(0);
    const [showTakeAwayInput, setShowTakeAwayInput] = useState(false);
    const [checkInItems, setCheckInItems] = useState<SelectedItem[]>([]);
    const [tempCheckInItems, setTempCheckInItems] = useState<SelectedItem[]>([]); // Temporary state for modal
    const [showCheckInItemPicker, setShowCheckInItemPicker] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [alreadyCheckedInPerson, setAlreadyCheckedInPerson] = useState<CheckedInPerson | null>(null);
    const [checkingExisting, setCheckingExisting] = useState(false);

    // People list state
    const [checkedInPeople, setCheckedInPeople] = useState<CheckedInPerson[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<CheckedInPerson | null>(null);
    const [loadingPeople, setLoadingPeople] = useState(false);

    // Item picker state
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [itemSearch, setItemSearch] = useState("");
    const [pendingItems, setPendingItems] = useState<SelectedItem[]>([]);



    // Location state
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [routeStopId, setRouteStopId] = useState<string | null>(null);
    const [stopConfirmed, setStopConfirmed] = useState(false);
    const [detectedStop, setDetectedStop] = useState<typeof routeStops[0] | null>(null);
    const [confirmSelectedRouteId, setConfirmSelectedRouteId] = useState<string | null>(null);

    // Stop detection state
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);

    // Manual route/stop selection (backup when GPS doesn't work)
    const [showManualSelector, setShowManualSelector] = useState(false);
    const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [manuallySelectedStop, setManuallySelectedStop] = useState<RouteStop | null>(null);

    // SSN reveal state (for privacy - tap to reveal, auto-hide after 3 seconds)
    const [revealedSsnId, setRevealedSsnId] = useState<string | null>(null);

    // Delete confirmation modal state
    const [personToDelete, setPersonToDelete] = useState<CheckedInPerson | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Current time
    const [currentTime, setCurrentTime] = useState("");

    const supabase = createClient();

    // Reveal SSN temporarily (auto-hide after 3 seconds)
    const revealSsn = (personId: string) => {
        setRevealedSsnId(personId);
        setTimeout(() => {
            setRevealedSsnId(prev => prev === personId ? null : prev);
        }, 3000);
    };

    // Get current time
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Get location (real GPS when not mocking) - continuous tracking
    useEffect(() => {
        if (USE_MOCK_LOCATION) return;

        if (!navigator.geolocation) return;

        // Use watchPosition for continuous tracking as user moves
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (error) => {
                console.log('GPS error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000 // Accept cached position up to 5 seconds old
            }
        );

        // Cleanup on unmount
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // Fetch routes and route stops (and set mock location if enabled)
    useEffect(() => {
        const fetchRoutesAndStops = async () => {
            // Fetch routes
            const { data: routesData } = await supabase
                .from('route')
                .select('id, name')
                .order('name');

            if (routesData) {
                setRoutes(routesData);
            }

            // Fetch route stops with route info
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

            if (stops && stops.length > 0) {
                const mappedStops = stops.map(s => ({
                    id: s.id,
                    name: s.name,
                    locationDescription: s.location_description,
                    latitude: parseFloat(s.latitude),
                    longitude: parseFloat(s.longitude),
                    stopNumber: s.stop_number,
                    routeId: s.route_id,
                    routeName: (s.route as unknown as { name: string } | null)?.name
                }));
                setRouteStops(mappedStops);

                // If mocking location, use the mock coordinates
                if (USE_MOCK_LOCATION) {
                    setCurrentLocation(MOCK_COORDINATES);
                    console.log(`[Mock Location] Set to: (${MOCK_COORDINATES.lat}, ${MOCK_COORDINATES.lng})`);
                }
            }
        };
        fetchRoutesAndStops();
    }, []);

    // Calculate distance between two coordinates in meters (Haversine formula)
    const getDistanceInMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Detect current stop based on location OR manual selection
    useEffect(() => {
        // If stop is already confirmed, don't change detection
        if (stopConfirmed) return;

        // Otherwise try GPS detection
        if (!currentLocation || routeStops.length === 0) {
            setDetectedStop(null);
            return;
        }

        // Find the nearest stop within detection radius
        let nearestStop: RouteStop | null = null;
        let nearestDistance = Infinity;

        for (const stop of routeStops) {
            const distance = getDistanceInMeters(
                currentLocation.lat,
                currentLocation.lng,
                stop.latitude,
                stop.longitude
            );
            if (distance <= STOP_DETECTION_RADIUS && distance < nearestDistance) {
                nearestStop = stop;
                nearestDistance = distance;
            }
        }

        setDetectedStop(nearestStop);
    }, [currentLocation, routeStops, stopConfirmed]);

    // Confirm the detected or selected stop
    const confirmStop = (stop: RouteStop) => {
        setCurrentStop(stop);
        setRouteStopId(stop.id);
        setStopConfirmed(true);
        setManuallySelectedStop(null);
        setShowManualSelector(false);
    };

    // Change stop (reset confirmation)
    const changeStop = () => {
        setStopConfirmed(false);
        setCurrentStop(null);
        setRouteStopId(null);
        setManuallySelectedStop(null);
    };

    // Fetch categories and item types
    useEffect(() => {
        const fetchData = async () => {
            const { data: cats } = await supabase.from('item_category').select('*').order('name');
            const { data: items } = await supabase.from('item_type').select('*').order('name');
            setCategories(cats || []);
            setItemTypes(items || []);
        };
        fetchData();
    }, []);

    // Fetch checked-in people at the current stop (within last hour)
    const fetchCheckedInPeople = async () => {
        if (!currentStop) {
            setCheckedInPeople([]);
            setLoadingPeople(false);
            return;
        }

        setLoadingPeople(true);

        // Show all check-ins from today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: distributions } = await supabase
            .from('distribution')
            .select(`
                id,
                created_at,
                meal_served,
                meals_take_away,
                latitude,
                longitude,
                route_stop_id,
                homeless_person:homeless_person_id (id, first_name, last_name, ssn_last4_hash)
            `)
            .eq('route_stop_id', currentStop.id)
            .gte('created_at', startOfDay.toISOString())
            .order('created_at', { ascending: false });

        if (distributions) {
            const filteredDistributions = distributions;

            // Group by person ID
            const personMap = new Map<string, CheckedInPerson>();

            for (const dist of filteredDistributions) {
                const person = dist.homeless_person as unknown as { id: string; first_name: string; last_name: string | null; ssn_last4_hash: string | null };

                // Get items for this distribution
                const { data: distItems } = await supabase
                    .from('distribution_item')
                    .select(`
                        id,
                        quantity,
                        item_type_id,
                        item_type:item_type_id (name)
                    `)
                    .eq('distribution_id', dist.id);

                const items = (distItems || []).map((item: unknown) => {
                    const typedItem = item as { id: string; quantity: number; item_type_id: string; item_type: { name: string } | null };
                    return {
                        id: typedItem.id,
                        itemTypeId: typedItem.item_type_id,
                        name: typedItem.item_type?.name || 'Unknown',
                        quantity: typedItem.quantity
                    };
                });

                if (personMap.has(person.id)) {
                    // Add to existing person
                    const existing = personMap.get(person.id)!;
                    existing.distributionIds.push(dist.id);
                    // Combine meal data (use OR for served, sum for take away)
                    existing.mealServed = existing.mealServed || dist.meal_served;
                    existing.mealsTakeAway += (dist.meals_take_away || 0);
                    // Add items (don't merge, keep separate for editing)
                    existing.items.push(...items);
                } else {
                    // Create new person entry
                    // Extract last 4 from hash format "hash_XXXX" or null if not available
                    const ssnLast4 = person.ssn_last4_hash?.replace('hash_', '') || null;
                    personMap.set(person.id, {
                        id: person.id,
                        distributionIds: [dist.id],
                        firstName: person.first_name,
                        lastName: person.last_name,
                        ssnLast4,
                        mealServed: dist.meal_served || false,
                        mealsTakeAway: dist.meals_take_away || 0,
                        items,
                        checkedInAt: dist.created_at
                    });
                }
            }
            // Sort alphabetically by first name and set
            const sortedPeople = Array.from(personMap.values())
                .sort((a, b) => a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase()));
            setCheckedInPeople(sortedPeople);
        }

        setLoadingPeople(false);
    };

    // Fetch people when current stop changes
    useEffect(() => {
        fetchCheckedInPeople();
    }, [currentStop]);

    // Check if person is already checked in today when typing name
    useEffect(() => {
        const checkIfAlreadyCheckedIn = async () => {
            // Only check if we have first name + (last name OR SSN)
            const hasFirstName = firstName.trim().length >= 1;
            const hasLastName = lastName.trim().length >= 1;
            const hasSSN = ssnLast4.length === 4;

            if (!hasFirstName || (!hasLastName && !hasSSN)) {
                setAlreadyCheckedInPerson(null);
                return;
            }

            setCheckingExisting(true);

            try {
                const trimmedFirstName = firstName.trim().toLowerCase();
                const trimmedLastName = lastName.trim().toLowerCase();
                const ssnHash = ssnLast4.length === 4 ? `hash_${ssnLast4}` : null;

                // Build query to find matching person
                let query = supabase
                    .from('homeless_person')
                    .select('id, first_name, last_name, ssn_last4_hash')
                    .ilike('first_name', trimmedFirstName);

                // Add last name filter if provided
                if (trimmedLastName) {
                    query = query.ilike('last_name', trimmedLastName);
                }

                // Add SSN filter if provided
                if (ssnHash) {
                    query = query.eq('ssn_last4_hash', ssnHash);
                }

                const { data: persons } = await query;

                // Find best match - prefer exact match on all provided fields
                const person = persons?.find(p => {
                    const firstMatch = p.first_name.toLowerCase() === trimmedFirstName;
                    const lastMatch = !trimmedLastName || (p.last_name?.toLowerCase() === trimmedLastName);
                    const ssnMatch = !ssnHash || p.ssn_last4_hash === ssnHash;
                    return firstMatch && lastMatch && ssnMatch;
                }) || persons?.[0];

                if (person) {
                    // Check if they have a distribution today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const { data: todayDist } = await supabase
                        .from('distribution')
                        .select('id, meal_served, meals_take_away, route_stop_id, route_stop:route_stop_id(name, route:route_id(name))')
                        .eq('homeless_person_id', person.id)
                        .gte('created_at', today.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (todayDist && todayDist.length > 0) {
                        // They're already checked in - create a CheckedInPerson object
                        const mealServed = todayDist.some(d => d.meal_served);
                        const mealsTakeAway = todayDist.reduce((sum, d) => sum + (d.meals_take_away || 0), 0);

                        // Get stop info for the most recent check-in
                        const recentDist = todayDist[0] as unknown as {
                            id: string;
                            meal_served: boolean;
                            meals_take_away: number;
                            route_stop_id: string | null;
                            route_stop: { name: string; route: { name: string } | null } | null
                        };
                        const stopName = recentDist.route_stop?.name;
                        const routeName = recentDist.route_stop?.route?.name;

                        setAlreadyCheckedInPerson({
                            id: person.id,
                            distributionIds: todayDist.map(d => d.id),
                            firstName: person.first_name,
                            lastName: person.last_name,
                            ssnLast4: person.ssn_last4_hash?.replace('hash_', '') || null,
                            mealServed,
                            mealsTakeAway,
                            items: [],
                            checkedInAt: new Date().toISOString(),
                            previousStopName: stopName,
                            previousRouteName: routeName,
                        });
                    } else {
                        setAlreadyCheckedInPerson(null);
                    }
                } else {
                    setAlreadyCheckedInPerson(null);
                }
            } catch {
                setAlreadyCheckedInPerson(null);
            } finally {
                setCheckingExisting(false);
            }
        };

        const timeoutId = setTimeout(checkIfAlreadyCheckedIn, 500);
        return () => clearTimeout(timeoutId);
    }, [firstName, lastName, ssnLast4]);

    // Check in a person
    const handleCheckIn = async () => {
        // Only require first name
        if (!firstName.trim()) return;

        setCheckingIn(true);

        try {
            const trimmedFirstName = firstName.trim();
            const trimmedLastName = lastName.trim() || null;
            const ssnHash = ssnLast4.length === 4 ? `hash_${ssnLast4}` : null;

            // Determine if this person is identifiable (has more than just first name)
            const isIdentifiable = !!(trimmedLastName || ssnHash);

            let personId: string;

            if (isIdentifiable) {
                // We have enough info to try matching - look for existing person
                let query = supabase
                    .from('homeless_person')
                    .select('id')
                    .ilike('first_name', trimmedFirstName.toLowerCase());

                // Match on last name if provided
                if (trimmedLastName) {
                    query = query.ilike('last_name', trimmedLastName.toLowerCase());
                }

                // Match on SSN if provided
                if (ssnHash) {
                    query = query.eq('ssn_last4_hash', ssnHash);
                }

                const { data: existingPerson } = await query.single();

                if (existingPerson) {
                    personId = existingPerson.id;
                } else {
                    // Create new identifiable person
                    const { data: newPerson, error } = await supabase
                        .from('homeless_person')
                        .insert({
                            first_name: trimmedFirstName,
                            last_name: trimmedLastName,
                            ssn_last4_hash: ssnHash,
                            is_identifiable: true
                        })
                        .select('id')
                        .single();

                    if (error || !newPerson) {
                        throw new Error('Failed to create person');
                    }
                    personId = newPerson.id;
                }
            } else {
                // Only first name - always create new record (can't reliably match)
                const { data: newPerson, error } = await supabase
                    .from('homeless_person')
                    .insert({
                        first_name: trimmedFirstName,
                        last_name: null,
                        ssn_last4_hash: null,
                        is_identifiable: false
                    })
                    .select('id')
                    .single();

                if (error || !newPerson) {
                    throw new Error('Failed to create person');
                }
                personId = newPerson.id;
            }

            // Create distribution record with meal data
            // Use device location if available, otherwise fall back to stop coordinates
            const lat = currentLocation?.lat ?? currentStop?.latitude ?? null;
            const lng = currentLocation?.lng ?? currentStop?.longitude ?? null;

            const { data: distRecord } = await supabase
                .from('distribution')
                .insert({
                    homeless_person_id: personId,
                    meal_served: checkInMealServed,
                    meals_take_away: checkInTakeAway,
                    latitude: lat,
                    longitude: lng,
                    route_stop_id: routeStopId,
                })
                .select('id')
                .single();

            // Add items if any were selected
            if (distRecord && checkInItems.length > 0) {
                for (const item of checkInItems) {
                    await supabase.from('distribution_item').insert({
                        distribution_id: distRecord.id,
                        item_type_id: item.itemTypeId,
                        quantity: item.quantity
                    });
                }
            }

            // Show success and reset all check-in state
            setCheckInSuccess(true);
            setShowNewCheckIn(false);
            setFirstName("");
            setLastName("");
            setSsnLast4("");
            setCheckInMealServed(true);
            setCheckInTakeAway(0);
            setShowTakeAwayInput(false);
            setCheckInItems([]);

            // Refresh the list to show the new person
            await fetchCheckedInPeople();

            setTimeout(() => setCheckInSuccess(false), 2000);

        } catch (err) {
            console.error('Check-in error:', err);
        } finally {
            setCheckingIn(false);
        }
    };

    // Toggle meal served (boolean)
    const toggleMealServed = async (person: CheckedInPerson) => {
        const newValue = !person.mealServed;

        // Update local state immediately for snappy UI
        setCheckedInPeople(prev => prev.map(p =>
            p.id === person.id ? { ...p, mealServed: newValue } : p
        ));

        if (selectedPerson?.id === person.id) {
            setSelectedPerson({ ...selectedPerson, mealServed: newValue });
        }

        // Sync to database
        const primaryDistId = person.distributionIds[0];
        await supabase
            .from('distribution')
            .update({ meal_served: newValue })
            .eq('id', primaryDistId);
    };

    // Update take away meals count
    const updateTakeAwayCount = async (person: CheckedInPerson, delta: number) => {
        const newCount = Math.max(0, person.mealsTakeAway + delta);

        // Update local state immediately for snappy UI
        setCheckedInPeople(prev => prev.map(p =>
            p.id === person.id ? { ...p, mealsTakeAway: newCount } : p
        ));

        if (selectedPerson?.id === person.id) {
            setSelectedPerson({ ...selectedPerson, mealsTakeAway: newCount });
        }

        // Sync to database
        const primaryDistId = person.distributionIds[0];
        await supabase
            .from('distribution')
            .update({ meals_take_away: newCount })
            .eq('id', primaryDistId);
    };

    // Delete person from today's check-in list
    const confirmDeleteCheckIn = async () => {
        if (!personToDelete) return;

        setDeleting(true);

        // Delete all distribution records for this person today
        for (const distId of personToDelete.distributionIds) {
            // First delete any distribution items
            await supabase
                .from('distribution_item')
                .delete()
                .eq('distribution_id', distId);

            // Then delete the distribution record
            await supabase
                .from('distribution')
                .delete()
                .eq('id', distId);
        }

        // Update local state
        setCheckedInPeople(prev => prev.filter(p => p.id !== personToDelete.id));
        if (selectedPerson?.id === personToDelete.id) {
            setSelectedPerson(null);
        }

        setDeleting(false);
        setPersonToDelete(null);
    };

    // Add items to person (attached to first distribution record)
    const addItemsToPerson = async () => {
        if (!selectedPerson || pendingItems.length === 0) return;

        const primaryDistId = selectedPerson.distributionIds[0];

        // Build new items array optimistically
        const newItems: typeof selectedPerson.items = [...selectedPerson.items];

        for (const item of pendingItems) {
            // Check if this item type already exists for this person
            const existingItem = selectedPerson.items.find(i => i.itemTypeId === item.itemTypeId);

            if (existingItem) {
                // Skip - item already exists (we only allow one of each now)
                continue;
            } else {
                // Insert new item
                const { data: insertedItem } = await supabase.from('distribution_item').insert({
                    distribution_id: primaryDistId,
                    item_type_id: item.itemTypeId,
                    quantity: item.quantity
                }).select('id').single();

                if (insertedItem) {
                    newItems.push({
                        id: insertedItem.id,
                        itemTypeId: item.itemTypeId,
                        name: item.name,
                        quantity: item.quantity
                    });
                }
            }
        }

        // Update local state optimistically (no flash)
        const updatedPerson = { ...selectedPerson, items: newItems };
        setSelectedPerson(updatedPerson);
        setCheckedInPeople(prev => prev.map(p => p.id === selectedPerson.id ? updatedPerson : p));

        setPendingItems([]);
        setShowItemPicker(false);
    };

    // Update or remove an existing distribution item
    const updateDistributionItem = async (itemId: string, newQuantity: number) => {
        // Update local state immediately for snappy UI
        const updateItems = (items: CheckedInPerson['items']) => {
            if (newQuantity <= 0) {
                return items.filter(i => i.id !== itemId);
            } else {
                return items.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
            }
        };

        setCheckedInPeople(prev => prev.map(p => ({
            ...p,
            items: updateItems(p.items)
        })));

        if (selectedPerson) {
            setSelectedPerson({
                ...selectedPerson,
                items: updateItems(selectedPerson.items)
            });
        }

        // Sync to database in background
        if (newQuantity <= 0) {
            await supabase
                .from('distribution_item')
                .delete()
                .eq('id', itemId);
        } else {
            await supabase
                .from('distribution_item')
                .update({ quantity: newQuantity })
                .eq('id', itemId);
        }
    };

    // Category helpers
    const getCategoryName = (itemCategoryId: string) => {
        return categories.find(c => c.id === itemCategoryId)?.name || "Unknown";
    };


    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('clothing') || name.includes('clothes')) {
            return { icon: Shirt, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        }
        if (name.includes('hygiene') || name.includes('toiletries')) {
            return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
        }
        if (name.includes('food') || name.includes('meal')) {
            return { icon: Apple, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
        }
        if (name.includes('blanket') || name.includes('bedding') || name.includes('sleeping')) {
            return { icon: Bed, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        }
        return { icon: Package, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
    };


    const addPendingItem = (item: ItemType) => {
        const existing = pendingItems.find(i => i.itemTypeId === item.id);
        if (existing) {
            // Toggle off - remove item
            setPendingItems(pendingItems.filter(i => i.itemTypeId !== item.id));
        } else {
            // Add item with quantity 1
            setPendingItems([...pendingItems, {
                itemTypeId: item.id,
                name: item.name,
                category: getCategoryName(item.item_category_id),
                quantity: 1
            }]);
        }
    };

    const updatePendingQuantity = (itemTypeId: string, delta: number) => {
        setPendingItems(prev =>
            prev.map(i => i.itemTypeId === itemTypeId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
                .filter(i => i.quantity > 0)
        );
    };

    // Add item to check-in list (uses temp state, keeps modal open for multi-select)
    const addCheckInItem = (item: ItemType) => {
        const existing = tempCheckInItems.find(i => i.itemTypeId === item.id);
        if (existing) {
            // Toggle off - remove item
            setTempCheckInItems(tempCheckInItems.filter(i => i.itemTypeId !== item.id));
        } else {
            // Add item with quantity 1
            setTempCheckInItems([...tempCheckInItems, {
                itemTypeId: item.id,
                name: item.name,
                category: getCategoryName(item.item_category_id),
                quantity: 1
            }]);
        }
        // Don't close modal - allow multi-select
    };

    // Open check-in item picker and initialize temp state
    const openCheckInItemPicker = () => {
        setTempCheckInItems([...checkInItems]); // Copy current items to temp
        setShowCheckInItemPicker(true);
    };

    // Confirm check-in items from modal
    const confirmCheckInItems = () => {
        setCheckInItems([...tempCheckInItems]); // Apply temp to actual
        setShowCheckInItemPicker(false);
        setSelectedCategory(null);
    };

    // Filtered items by selected category
    const filteredItems = useMemo(() => {
        let items = [...itemTypes];
        if (selectedCategory) {
            items = items.filter(i => i.item_category_id === selectedCategory);
        }
        if (itemSearch) {
            items = items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
        }
        return items;
    }, [itemTypes, selectedCategory, itemSearch]);

    // Form validation - only require first name
    const canCheckIn = firstName.trim().length >= 1 && !checkingIn;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Stop Confirmation Section */}
            {!stopConfirmed ? (
                <div className="max-w-2xl mx-auto px-4 pt-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Confirm Your Location
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                {detectedStop
                                    ? "We detected you're near a stop. Please confirm or select a different one."
                                    : "Select your current stop to begin check-ins."}
                            </p>
                        </div>

                        {/* Detected Stop or No Detection Message */}
                        {detectedStop ? (
                            <div className="mb-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Detected stop:</p>
                                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                                                {detectedStop.stopNumber}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {detectedStop.name}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {detectedStop.routeName}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => confirmStop(detectedStop)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : currentLocation && (
                            <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <MapPin className="w-5 h-5" />
                                    <p className="text-sm">No stop detected nearby. Please select your stop below.</p>
                                </div>
                            </div>
                        )}

                        {/* Select Different Stop - Two Step: Route then Stop */}
                        <div>
                            {!confirmSelectedRouteId && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                    {detectedStop ? "Or select a different stop:" : "Select your stop:"}
                                </p>
                            )}

                            {!confirmSelectedRouteId ? (
                                /* Step 1: Select Route */
                                <div className="space-y-2">
                                    {routes.map(route => {
                                        const colors = getRouteColor(route.name);
                                        return (
                                            <button
                                                key={route.id}
                                                onClick={() => setConfirmSelectedRouteId(route.id)}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                                                    <span className="text-slate-900 dark:text-white font-medium">
                                                        {route.name}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Step 2: Select Stop from chosen route */
                                <div>
                                    {(() => {
                                        const selectedRoute = routes.find(r => r.id === confirmSelectedRouteId);
                                        const colors = getRouteColor(selectedRoute?.name);
                                        return (
                                            <button
                                                onClick={() => setConfirmSelectedRouteId(null)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                                                {selectedRoute?.name}
                                            </button>
                                        );
                                    })()}
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Select your stop:</p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {routeStops
                                            .filter(s => s.routeId === confirmSelectedRouteId)
                                            .sort((a, b) => a.stopNumber - b.stopNumber)
                                            .map(stop => (
                                                <button
                                                    key={stop.id}
                                                    onClick={() => {
                                                        confirmStop(stop);
                                                        setConfirmSelectedRouteId(null);
                                                    }}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                                        detectedStop?.id === stop.id
                                                            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                                            : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        detectedStop?.id === stop.id
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {stop.stopNumber}
                                                    </div>
                                                    <span className="text-slate-900 dark:text-white font-medium">
                                                        {stop.name}
                                                    </span>
                                                    {detectedStop?.id === stop.id && (
                                                        <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
                                                            GPS detected
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Confirmed Stop Header */}
                    <div className="max-w-2xl mx-auto px-4 pt-6">
                        <div className={`bg-gradient-to-r ${getRouteColor(currentStop?.routeName).gradient} text-white rounded-xl px-4 py-3`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/70">{currentStop?.routeName}</p>
                                    <p className="font-semibold flex items-center gap-2">
                                        <span className="w-6 h-6 bg-white/20 rounded-full text-sm flex items-center justify-center">{currentStop?.stopNumber}</span>
                                        {currentStop?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={changeStop}
                                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {/* Success Message */}
                {checkInSuccess && (
                    <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">Checked In!</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Added to the list below</p>
                        </div>
                    </div>
                )}

                {/* New Check-In Button or Form */}
                {!showNewCheckIn ? (
                    <button
                        onClick={() => {
                            if (currentStop) {
                                setSelectedPerson(null);
                                setShowNewCheckIn(true);
                            }
                        }}
                        disabled={!currentStop}
                        className={`w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                            currentStop
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <UserPlus className="w-5 h-5" />
                        {currentStop ? 'Check In New Person' : 'Select a Stop First'}
                    </button>
                ) : (
                    /* Check-in Form */
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-500" />
                                New Check-In
                            </h2>
                            <button
                                onClick={() => {
                                    setShowNewCheckIn(false);
                                    setFirstName("");
                                    setLastName("");
                                    setSsnLast4("");
                                    setCheckInMealServed(true);
                                    setCheckInTakeAway(0);
                                    setShowTakeAwayInput(false);
                                    setCheckInItems([]);
                                    setAlreadyCheckedInPerson(null);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Name fields */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First"
                                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last"
                                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* SSN field - optional */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Last 4 SSN <span className="font-normal text-slate-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={ssnLast4}
                                onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="0000"
                                maxLength={4}
                                inputMode="numeric"
                                className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-mono tracking-widest"
                                autoComplete="off"
                            />
                        </div>

                        {/* Already Checked In Indicator - Informational only */}
                        {(checkingExisting || alreadyCheckedInPerson) && (
                            <div className={`p-4 rounded-xl border mb-4 ${checkingExisting
                                ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                }`}>
                                {checkingExisting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                        <span className="text-sm text-slate-500">Checking...</span>
                                    </div>
                                ) : alreadyCheckedInPerson && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <UserCheck className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-800 dark:text-blue-200">
                                                Also checked in earlier today
                                            </p>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                {alreadyCheckedInPerson.previousStopName
                                                    ? `At ${alreadyCheckedInPerson.previousStopName}`
                                                    : 'At another stop'}
                                                {' • '}
                                                {alreadyCheckedInPerson.mealServed ? 'Meal served' : 'No meal'}
                                                {alreadyCheckedInPerson.mealsTakeAway > 0 && `, ${alreadyCheckedInPerson.mealsTakeAway} take away`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Meal Served Toggle */}
                        <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 ${!firstName.trim() ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-orange-500" />
                                    <span className="font-medium text-slate-900 dark:text-white">Meal Served</span>
                                </div>
                                <button
                                    onClick={() => setCheckInMealServed(!checkInMealServed)}
                                    disabled={!firstName.trim()}
                                    className={`w-14 h-8 rounded-full transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed ${
                                        checkInMealServed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                                        checkInMealServed ? 'translate-x-7' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Take Away Link/Counter */}
                            {!showTakeAwayInput && checkInTakeAway === 0 ? (
                                <button
                                    onClick={() => setShowTakeAwayInput(true)}
                                    disabled={!firstName.trim()}
                                    className="mt-3 text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    + Add take away meals
                                </button>
                            ) : (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Take Away</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const newVal = Math.max(0, checkInTakeAway - 1);
                                                setCheckInTakeAway(newVal);
                                                if (newVal === 0) setShowTakeAwayInput(false);
                                            }}
                                            disabled={checkInTakeAway === 0 || !firstName.trim()}
                                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-lg font-bold text-slate-900 dark:text-white w-6 text-center">
                                            {checkInTakeAway}
                                        </span>
                                        <button
                                            onClick={() => setCheckInTakeAway(checkInTakeAway + 1)}
                                            disabled={!firstName.trim()}
                                            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items Section - simple list with remove button */}
                        <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 ${!firstName.trim() ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium text-slate-900 dark:text-white">Items</span>
                                    {checkInItems.length > 0 && (
                                        <span className="text-sm text-slate-500">
                                            ({checkInItems.length})
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={openCheckInItemPicker}
                                    disabled={!firstName.trim()}
                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            {checkInItems.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {checkInItems.map(item => (
                                        <span
                                            key={item.itemTypeId}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-600 text-slate-900 dark:text-white text-sm rounded-lg"
                                        >
                                            {item.name}
                                            <button
                                                onClick={() => setCheckInItems(prev => prev.filter(i => i.itemTypeId !== item.itemTypeId))}
                                                className="ml-1 text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Check In Button */}
                        <button
                            onClick={handleCheckIn}
                            disabled={!firstName.trim() || checkingIn}
                            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${firstName.trim() && !checkingIn
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {checkingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Check In
                                    {(checkInMealServed || checkInTakeAway > 0 || checkInItems.length > 0) && (
                                        <span className="ml-2 text-sm opacity-80">
                                            ({checkInMealServed ? 'meal' : ''}
                                            {checkInMealServed && checkInTakeAway > 0 ? ', ' : ''}
                                            {checkInTakeAway > 0 ? `${checkInTakeAway} take away` : ''}
                                            {(checkInMealServed || checkInTakeAway > 0) && checkInItems.length > 0 ? ', ' : ''}
                                            {checkInItems.length > 0 ? `${checkInItems.length} item${checkInItems.length !== 1 ? 's' : ''}` : ''})
                                        </span>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* List Header */}
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    {currentStop ? (
                        <>
                            <MapPin className="w-4 h-4" />
                            <span>Checked in at this stop ({checkedInPeople.length})</span>
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4" />
                            <span>Today&apos;s check-ins ({checkedInPeople.length})</span>
                        </>
                    )}
                </div>

                {/* Checked-in People List */}
                {loadingPeople ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : checkedInPeople.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                        {currentStop ? (
                            <>
                                <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    No one checked in at this stop yet
                                </p>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    Move to a stop to see check-ins
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    checkedInPeople.map((person) => (
                        <div
                            key={person.id}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            {/* Person Header */}
                            <button
                                onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}
                                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {person.firstName}{person.lastName ? ` ${person.lastName}` : ''}
                                        </p>
                                        {person.ssnLast4 ? (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    revealSsn(person.id);
                                                }}
                                                className={`text-xs px-2 py-0.5 rounded-full font-mono transition-all cursor-pointer ${revealedSsnId === person.id
                                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                {revealedSsnId === person.id ? person.ssnLast4 : '••••'}
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                                                No SSN
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        {person.mealServed && (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <Utensils className="w-3 h-3" />
                                                Meal
                                            </span>
                                        )}
                                        {person.mealsTakeAway > 0 && (
                                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                <Package className="w-3 h-3" />
                                                {person.mealsTakeAway} take away
                                            </span>
                                        )}
                                        {person.items.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {person.items.length} item{person.items.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedPerson?.id === person.id ? (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            {selectedPerson?.id === person.id && (
                                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                                    {/* Meal Served Toggle */}
                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Utensils className="w-5 h-5 text-orange-500" />
                                                <span className="font-medium text-slate-900 dark:text-white">Meal Served</span>
                                            </div>
                                            <button
                                                onClick={() => toggleMealServed(person)}
                                                className={`w-14 h-8 rounded-full transition-colors relative ${
                                                    person.mealServed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                                                    person.mealServed ? 'translate-x-7' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>

                                        {/* Take Away - hidden until clicked or has value */}
                                        {person.mealsTakeAway === 0 ? (
                                            <button
                                                onClick={() => updateTakeAwayCount(person, 1)}
                                                className="mt-3 text-sm text-blue-500 hover:text-blue-600"
                                            >
                                                + Add take away meals
                                            </button>
                                        ) : (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Take Away</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateTakeAwayCount(person, -1)}
                                                        disabled={person.mealsTakeAway === 0}
                                                        className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-lg font-bold text-slate-900 dark:text-white w-6 text-center">
                                                        {person.mealsTakeAway}
                                                    </span>
                                                    <button
                                                        onClick={() => updateTakeAwayCount(person, 1)}
                                                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items Given */}
                                    {person.items.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Items Given
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {person.items.map((item) => (
                                                    <span
                                                        key={item.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-600 text-slate-900 dark:text-white text-sm rounded-lg"
                                                    >
                                                        {item.name}
                                                        <button
                                                            onClick={() => updateDistributionItem(item.id, 0)}
                                                            className="ml-1 text-slate-400 hover:text-red-500"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Items Button */}
                                    <button
                                        onClick={() => setShowItemPicker(true)}
                                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Items
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => setPersonToDelete(person)}
                                        className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Remove Check-In
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )
                }

                {/* Refresh Button */}
                {
                    checkedInPeople.length > 0 && (
                        <button
                            onClick={() => {
                                setSelectedPerson(null);
                                fetchCheckedInPeople();
                            }}
                            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium"
                        >
                            Refresh List
                        </button>
                    )
                }
            </div >

            {/* Item Picker Modal */}
            {
                showItemPicker && selectedPerson && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Add Items</h3>
                                    <p className="text-sm text-slate-500">For {selectedPerson.firstName}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowItemPicker(false);
                                        setPendingItems([]);
                                        setSelectedCategory(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pending Items - simple list with remove buttons */}
                            {pendingItems.length > 0 && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Items to add:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pendingItems.map(item => (
                                            <span key={item.itemTypeId} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm rounded-lg border border-blue-200 dark:border-blue-700">
                                                {item.name}
                                                <button
                                                    onClick={() => setPendingItems(prev => prev.filter(i => i.itemTypeId !== item.itemTypeId))}
                                                    className="ml-1 text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {!selectedCategory ? (
                                    /* Step 1: Select Category */
                                    <div>
                                        <p className="text-sm text-slate-500 mb-3">Select a category:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map((cat, index) => {
                                                const { icon: Icon, color, bg } = getCategoryIcon(cat.name);
                                                // Last item spans 2 columns if odd number of categories
                                                const isLastOdd = categories.length % 2 === 1 && index === categories.length - 1;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setSelectedCategory(cat.id)}
                                                        className={`p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 flex flex-col items-center gap-2 transition-colors ${isLastOdd ? 'col-span-2' : ''}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                                                            <Icon className={`w-6 h-6 ${color}`} />
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-white text-sm text-center">{cat.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* Step 2: Select Items (same for all categories) */
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>
                                        <p className="text-sm text-slate-500 mb-2">Tap to add items:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredItems.map(item => {
                                                const isSelected = pendingItems.some(p => p.itemTypeId === item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addPendingItem(item)}
                                                        className={`p-3 rounded-xl text-left transition-colors relative ${
                                                            isSelected
                                                                ? 'bg-blue-100 dark:bg-blue-900/40 outline outline-2 outline-blue-500'
                                                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                                                        {isSelected && (
                                                            <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                                                <Check className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            {pendingItems.length > 0 && (
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={addItemsToPerson}
                                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold"
                                    >
                                        Add {pendingItems.length} Item{pendingItems.length !== 1 ? 's' : ''}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Check-In Item Picker Modal */}
            {
                showCheckInItemPicker && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Add Items</h3>
                                    <p className="text-sm text-slate-500">Tap items to add them</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCheckInItemPicker(false);
                                        setSelectedCategory(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Selected Items Preview - simple list with remove buttons */}
                            {tempCheckInItems.length > 0 && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Selected items:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tempCheckInItems.map(item => (
                                            <span key={item.itemTypeId} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm rounded-lg border border-blue-200 dark:border-blue-700">
                                                {item.name}
                                                <button
                                                    onClick={() => setTempCheckInItems(prev => prev.filter(i => i.itemTypeId !== item.itemTypeId))}
                                                    className="ml-1 text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {!selectedCategory ? (
                                    /* Step 1: Select Category */
                                    <div>
                                        <p className="text-sm text-slate-500 mb-3">Select a category:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map((cat, index) => {
                                                const { icon: Icon, color, bg } = getCategoryIcon(cat.name);
                                                // Last item spans 2 columns if odd number of categories
                                                const isLastOdd = categories.length % 2 === 1 && index === categories.length - 1;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setSelectedCategory(cat.id)}
                                                        className={`p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 flex flex-col items-center gap-2 transition-colors ${isLastOdd ? 'col-span-2' : ''}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                                                            <Icon className={`w-6 h-6 ${color}`} />
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-white text-sm text-center">{cat.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* Step 2: Select Items */
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>
                                        <p className="text-sm text-slate-500 mb-2">Tap to add items:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredItems.map(item => {
                                                const isSelected = tempCheckInItems.some(i => i.itemTypeId === item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addCheckInItem(item)}
                                                        className={`p-3 rounded-xl text-left transition-colors relative ${
                                                            isSelected
                                                                ? 'bg-blue-100 dark:bg-blue-900/40 outline outline-2 outline-blue-500'
                                                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                                                        {isSelected && (
                                                            <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                                                <Check className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Done Button */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={confirmCheckInItems}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold"
                                >
                                    Done {tempCheckInItems.length > 0 && `(${tempCheckInItems.length} item${tempCheckInItems.length !== 1 ? 's' : ''})`}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {personToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Remove Check-In?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Are you sure you want to remove <span className="font-semibold">{personToDelete.firstName}</span> from today&apos;s check-ins? This will delete their distribution record.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPersonToDelete(null)}
                                    disabled={deleting}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteCheckIn}
                                    disabled={deleting}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="w-5 h-5" />
                                            Remove
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Route/Stop Selector Modal */}
            {showManualSelector && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Select Stop</h3>
                                <p className="text-sm text-slate-500">Choose your current route and stop</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowManualSelector(false);
                                    setSelectedRouteId(null);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {!selectedRouteId ? (
                                /* Step 1: Select Route */
                                <div>
                                    <p className="text-sm text-slate-500 mb-3">Select a route:</p>
                                    <div className="space-y-2">
                                        {routes.map(route => (
                                            <button
                                                key={route.id}
                                                onClick={() => setSelectedRouteId(route.id)}
                                                className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                <span className="font-medium text-slate-900 dark:text-white">{route.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Step 2: Select Stop */
                                <div>
                                    <button
                                        onClick={() => setSelectedRouteId(null)}
                                        className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back to routes
                                    </button>
                                    <p className="text-sm text-slate-500 mb-3">Select a stop:</p>
                                    <div className="space-y-2">
                                        {routeStops
                                            .filter(stop => stop.routeId === selectedRouteId)
                                            .sort((a, b) => a.stopNumber - b.stopNumber)
                                            .map(stop => (
                                                <button
                                                    key={stop.id}
                                                    onClick={() => {
                                                        setManuallySelectedStop(stop);
                                                        setShowManualSelector(false);
                                                        setSelectedRouteId(null);
                                                    }}
                                                    className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                                        {stop.stopNumber}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-900 dark:text-white">{stop.name}</span>
                                                        {stop.locationDescription && (
                                                            <p className="text-sm text-slate-500">{stop.locationDescription}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Use GPS Button */}
                        {manuallySelectedStop && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        setManuallySelectedStop(null);
                                        setShowManualSelector(false);
                                        setSelectedRouteId(null);
                                    }}
                                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    Use GPS Detection Instead
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
}
