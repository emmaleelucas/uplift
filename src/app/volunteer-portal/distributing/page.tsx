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
    category_id: string;
    size: string | null;
    gender: string | null;
}

interface CheckedInPerson {
    id: string;
    distributionIds: string[]; // All distribution IDs for this person today
    firstName: string;
    ssnLast4: string; // Last 4 digits of SSN for identification
    mealCount: number;
    items: { id: string; itemTypeId: string; name: string; quantity: number }[];
    checkedInAt: string;
}

interface SelectedItem {
    itemTypeId: string;
    name: string;
    category: string;
    quantity: number;
}

type ActiveTab = 'checkin' | 'serve';

// Mock location toggle: Set to true for testing (uses first stop's coordinates)
const USE_MOCK_LOCATION = false;

// Stop detection radius in meters (volunteer must be within this distance to detect a stop)
const STOP_DETECTION_RADIUS = 200;

// Check-in display filters
const CHECKIN_DISPLAY_MINUTES = 60; // Only show check-ins from last 60 minutes

interface RouteStop {
    id: string;
    name: string;
    locationDescription: string | null;
    latitude: number;
    longitude: number;
    stopNumber: number;
    routeName?: string;
}

export default function DistributingPage() {
    // Single page state - show/hide new check-in form
    const [showNewCheckIn, setShowNewCheckIn] = useState(false);

    // Check-in form state
    const [firstName, setFirstName] = useState("");
    const [ssnLast4, setSsnLast4] = useState("");
    const [checkInMeals, setCheckInMeals] = useState(0);
    const [checkInItems, setCheckInItems] = useState<SelectedItem[]>([]);
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

    // Clothing flow state
    const [clothingStep, setClothingStep] = useState<'type' | 'gender' | 'size'>('type');
    const [selectedClothingType, setSelectedClothingType] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);

    // Meal update state
    const [updatingMeals, setUpdatingMeals] = useState(false);

    // Location state
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [routeStopId, setRouteStopId] = useState<string | null>(null);
    const [routeRunId, setRouteRunId] = useState<string | null>(null);

    // Stop detection state
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);

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

    // Get location (real GPS when not mocking)
    useEffect(() => {
        if (!USE_MOCK_LOCATION && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => { /* ignore error */ }
            );
        }
    }, []);

    // Fetch route stops (and set mock location if enabled)
    useEffect(() => {
        const fetchRouteStops = async () => {
            const { data: stops } = await supabase
                .from('route_stop')
                .select(`
                    id,
                    name,
                    location_description,
                    latitude,
                    longitude,
                    stop_number,
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
                    routeName: (s.route as unknown as { name: string } | null)?.name
                }));
                setRouteStops(mappedStops);

                // If mocking location, use the first stop's coordinates
                if (USE_MOCK_LOCATION && mappedStops.length > 0) {
                    const firstStop = mappedStops[0];
                    setCurrentLocation({ lat: firstStop.latitude, lng: firstStop.longitude });
                    console.log(`[Mock Location] Set to stop: ${firstStop.name} (${firstStop.latitude}, ${firstStop.longitude})`);
                }
            }
        };
        fetchRouteStops();
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

    // Detect current stop based on location
    useEffect(() => {
        if (!currentLocation || routeStops.length === 0) {
            setCurrentStop(null);
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

        setCurrentStop(nearestStop);
        if (nearestStop) {
            setRouteStopId(nearestStop.id);
        }
    }, [currentLocation, routeStops]);

    // Fetch categories and item types
    useEffect(() => {
        const fetchData = async () => {
            const { data: cats } = await supabase.from('category').select('*').order('name');
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

        // Only show check-ins from the last hour
        const oneHourAgo = new Date();
        oneHourAgo.setMinutes(oneHourAgo.getMinutes() - CHECKIN_DISPLAY_MINUTES);

        const { data: distributions } = await supabase
            .from('distribution')
            .select(`
                id,
                created_at,
                meal_served,
                latitude,
                longitude,
                route_stop_id,
                homeless_person:homeless_person_id (id, first_name, ssn_last4_hash)
            `)
            .eq('route_stop_id', currentStop.id)
            .gte('created_at', oneHourAgo.toISOString())
            .order('created_at', { ascending: false });

        if (distributions) {
            const filteredDistributions = distributions;

            // Group by person ID
            const personMap = new Map<string, CheckedInPerson>();

            for (const dist of filteredDistributions) {
                const person = dist.homeless_person as unknown as { id: string; first_name: string; ssn_last4_hash: string };

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
                    existing.mealCount += dist.meal_served;
                    // Add items (don't merge, keep separate for editing)
                    existing.items.push(...items);
                } else {
                    // Create new person entry
                    // Extract last 4 from hash format "hash_XXXX"
                    const ssnLast4 = person.ssn_last4_hash?.replace('hash_', '') || '****';
                    personMap.set(person.id, {
                        id: person.id,
                        distributionIds: [dist.id],
                        firstName: person.first_name,
                        ssnLast4,
                        mealCount: dist.meal_served,
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

    // Check if person is already checked in today when typing name/SSN
    useEffect(() => {
        const checkIfAlreadyCheckedIn = async () => {
            if (firstName.trim().length < 1 || ssnLast4.length !== 4) {
                setAlreadyCheckedInPerson(null);
                return;
            }

            setCheckingExisting(true);

            try {
                const ssnHash = `hash_${ssnLast4}`;
                const trimmedName = firstName.trim().toLowerCase();

                // First find the person
                const { data: person } = await supabase
                    .from('homeless_person')
                    .select('id, first_name')
                    .eq('ssn_last4_hash', ssnHash)
                    .ilike('first_name', trimmedName)
                    .single();

                if (person) {
                    // Check if they have a distribution today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const { data: todayDist } = await supabase
                        .from('distribution')
                        .select('id, meal_served')
                        .eq('homeless_person_id', person.id)
                        .gte('created_at', today.toISOString())
                        .limit(1);

                    if (todayDist && todayDist.length > 0) {
                        // They're already checked in - create a CheckedInPerson object
                        setAlreadyCheckedInPerson({
                            id: person.id,
                            distributionIds: todayDist.map(d => d.id),
                            firstName: person.first_name,
                            ssnLast4: ssnLast4, // Use the SSN they just typed
                            mealCount: todayDist.reduce((sum, d) => sum + d.meal_served, 0),
                            items: [],
                            checkedInAt: new Date().toISOString()
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
    }, [firstName, ssnLast4]);

    // Go to existing person's record
    const goToExistingRecord = async () => {
        if (alreadyCheckedInPerson) {
            await fetchCheckedInPeople();
            setShowNewCheckIn(false);
            // Find and select the person in the list
            setTimeout(() => {
                const person = checkedInPeople.find(p => p.id === alreadyCheckedInPerson.id);
                if (person) {
                    setSelectedPerson(person);
                }
            }, 100);
            // Reset check-in form
            setFirstName("");
            setSsnLast4("");
            setCheckInMeals(0);
            setCheckInItems([]);
            setAlreadyCheckedInPerson(null);
        }
    };

    // Check in a person
    const handleCheckIn = async () => {
        if (!firstName.trim() || ssnLast4.length !== 4) return;

        setCheckingIn(true);

        try {
            const ssnHash = `hash_${ssnLast4}`;
            const trimmedName = firstName.trim();

            // Check if person exists
            const { data: existingPerson } = await supabase
                .from('homeless_person')
                .select('id')
                .eq('ssn_last4_hash', ssnHash)
                .ilike('first_name', trimmedName.toLowerCase())
                .single();

            let personId: string;

            if (existingPerson) {
                personId = existingPerson.id;
            } else {
                // Create new person
                const { data: newPerson, error } = await supabase
                    .from('homeless_person')
                    .insert({
                        first_name: trimmedName,
                        ssn_last4_hash: ssnHash
                    })
                    .select('id')
                    .single();

                if (error || !newPerson) {
                    throw new Error('Failed to create person');
                }
                personId = newPerson.id;
            }

            // Create distribution record with meal count
            const { data: distRecord } = await supabase
                .from('distribution')
                .insert({
                    homeless_person_id: personId,
                    meal_served: checkInMeals,
                    latitude: currentLocation?.lat,
                    longitude: currentLocation?.lng,
                    route_stop_id: routeStopId,
                    route_run_id: routeRunId
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
            setSsnLast4("");
            setCheckInMeals(0);
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

    // Update meal count (stores on first distribution record)
    const updateMealCount = async (person: CheckedInPerson, delta: number) => {
        const newCount = Math.max(0, person.mealCount + delta);

        // Update local state immediately for snappy UI
        setCheckedInPeople(prev => prev.map(p =>
            p.id === person.id
                ? { ...p, mealCount: newCount }
                : p
        ));

        if (selectedPerson?.id === person.id) {
            setSelectedPerson({ ...selectedPerson, mealCount: newCount });
        }

        // Sync to database in background (only update the first distribution record)
        const primaryDistId = person.distributionIds[0];
        await supabase
            .from('distribution')
            .update({ meal_served: newCount })
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

        for (const item of pendingItems) {
            await supabase.from('distribution_item').insert({
                distribution_id: primaryDistId,
                item_type_id: item.itemTypeId,
                quantity: item.quantity
            });
        }

        // Refresh the list
        await fetchCheckedInPeople();
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
    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || "Unknown";
    };

    const isClothingCategory = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name.toLowerCase() === 'clothing';
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

    // Clothing helpers
    const getClothingTypes = () => {
        const clothingCat = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCat) return [];
        const types = new Set(itemTypes.filter(i => i.category_id === clothingCat.id).map(i => i.name));
        return Array.from(types).sort();
    };

    const getClothingGenders = () => {
        const clothingCat = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCat || !selectedClothingType) return [];
        const genders = new Set(
            itemTypes
                .filter(i => i.category_id === clothingCat.id && i.name === selectedClothingType)
                .map(i => i.gender || 'none')
        );
        const order = ['male', 'female', 'none'];
        return order.filter(g => genders.has(g));
    };

    const getClothingSizes = () => {
        const clothingCat = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCat || !selectedClothingType) return [];

        const items = itemTypes.filter(i =>
            i.category_id === clothingCat.id &&
            i.name === selectedClothingType &&
            (selectedGender ? i.gender === selectedGender : true)
        );

        const sizeOrder = ['one_size', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'];
        return items.sort((a, b) => {
            const aIndex = sizeOrder.indexOf(a.size || '');
            const bIndex = sizeOrder.indexOf(b.size || '');
            return aIndex - bIndex;
        });
    };

    const selectClothingType = (type: string) => {
        setSelectedClothingType(type);
        const genders = getClothingGendersForType(type);
        if (genders.length === 1) {
            setSelectedGender(genders[0]);
            const sizes = getClothingSizesForType(type, genders[0]);
            if (sizes.length === 1) {
                // Check which modal is open and add to the right list
                if (showCheckInItemPicker) {
                    addCheckInItem(sizes[0]);
                } else {
                    addPendingItem(sizes[0]);
                }
            } else {
                setClothingStep('size');
            }
        } else {
            setClothingStep('gender');
        }
    };

    const getClothingGendersForType = (type: string) => {
        const clothingCat = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCat) return [];
        const genders = new Set(
            itemTypes.filter(i => i.category_id === clothingCat.id && i.name === type).map(i => i.gender || 'none')
        );
        const order = ['male', 'female', 'none'];
        return order.filter(g => genders.has(g));
    };

    const getClothingSizesForType = (type: string, gender: string) => {
        const clothingCat = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCat) return [];
        return itemTypes.filter(i =>
            i.category_id === clothingCat.id && i.name === type && i.gender === gender
        );
    };

    const selectClothingGender = (gender: string) => {
        setSelectedGender(gender);
        const sizes = getClothingSizesForType(selectedClothingType!, gender);
        if (sizes.length === 1) {
            if (showCheckInItemPicker) {
                addCheckInItem(sizes[0]);
            } else {
                addPendingItem(sizes[0]);
            }
        } else {
            setClothingStep('size');
        }
    };

    const addPendingItem = (item: ItemType) => {
        const existing = pendingItems.find(i => i.itemTypeId === item.id);
        if (existing) {
            setPendingItems(pendingItems.map(i =>
                i.itemTypeId === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            // Check if multiple sizes exist
            const sameNameItems = itemTypes.filter(i =>
                i.name === item.name && i.category_id === item.category_id && i.gender === item.gender
            );
            const hasMultipleSizes = sameNameItems.length > 1;

            let displayName = item.name;
            if (item.size && hasMultipleSizes) {
                displayName += ` (${item.size})`;
            }
            if (item.gender && item.gender !== 'none') {
                displayName += ` - ${item.gender}`;
            }

            setPendingItems([...pendingItems, {
                itemTypeId: item.id,
                name: displayName,
                category: getCategoryName(item.category_id),
                quantity: 1
            }]);
        }
        resetClothingPicker();
    };

    const resetClothingPicker = () => {
        setClothingStep('type');
        setSelectedClothingType(null);
        setSelectedGender(null);
    };

    const updatePendingQuantity = (itemTypeId: string, delta: number) => {
        setPendingItems(prev =>
            prev.map(i => i.itemTypeId === itemTypeId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
                .filter(i => i.quantity > 0)
        );
    };

    // Add item to check-in list
    const addCheckInItem = (item: ItemType) => {
        const existing = checkInItems.find(i => i.itemTypeId === item.id);
        if (existing) {
            setCheckInItems(checkInItems.map(i =>
                i.itemTypeId === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            const sameNameItems = itemTypes.filter(i =>
                i.name === item.name && i.category_id === item.category_id && i.gender === item.gender
            );
            const hasMultipleSizes = sameNameItems.length > 1;

            let displayName = item.name;
            if (item.size && hasMultipleSizes) {
                displayName += ` (${item.size})`;
            }
            if (item.gender && item.gender !== 'none') {
                displayName += ` - ${item.gender}`;
            }

            setCheckInItems([...checkInItems, {
                itemTypeId: item.id,
                name: displayName,
                category: getCategoryName(item.category_id),
                quantity: 1
            }]);
        }
        resetClothingPicker();
        setShowCheckInItemPicker(false);
    };

    // Filtered items for non-clothing
    const filteredItems = useMemo(() => {
        let items = [...itemTypes];
        if (selectedCategory) {
            items = items.filter(i => i.category_id === selectedCategory);
        }
        if (itemSearch) {
            items = items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
        }
        return items;
    }, [itemTypes, selectedCategory, itemSearch]);

    // Form validation
    const canCheckIn = firstName.trim().length >= 1 && ssnLast4.length === 4 && !checkingIn;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Current Stop Indicator */}
            <div className="max-w-2xl mx-auto px-4 pt-6">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl px-4 py-3">
                    {currentStop ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                                {currentStop.stopNumber}
                            </div>
                            <p className="font-semibold">
                                {currentStop.routeName && `${currentStop.routeName} - `}{currentStop.name}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <p className="font-semibold text-slate-300">No stop detected</p>
                        </div>
                    )}
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
                        onClick={() => setShowNewCheckIn(true)}
                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Check In New Person
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
                                    setSsnLast4("");
                                    setCheckInMeals(0);
                                    setCheckInItems([]);
                                    setAlreadyCheckedInPerson(null);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Name"
                                    className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Last 4 SSN
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
                        </div>

                        {/* Already Checked In Indicator */}
                        {(checkingExisting || alreadyCheckedInPerson) && (
                            <div className={`p-4 rounded-xl border mb-4 ${checkingExisting
                                ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                }`}>
                                {checkingExisting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                        <span className="text-sm text-slate-500">Checking...</span>
                                    </div>
                                ) : alreadyCheckedInPerson && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                                                <UserCheck className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                                    Already checked in today
                                                </p>
                                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                    {alreadyCheckedInPerson.mealCount > 0
                                                        ? `${alreadyCheckedInPerson.mealCount} meal${alreadyCheckedInPerson.mealCount !== 1 ? 's' : ''} served`
                                                        : 'No meals yet'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={goToExistingRecord}
                                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            Go to record
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Meals Counter */}
                        <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 ${(!firstName.trim() || ssnLast4.length !== 4 || alreadyCheckedInPerson) ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-orange-500" />
                                    <span className="font-medium text-slate-900 dark:text-white">Meals</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCheckInMeals(Math.max(0, checkInMeals - 1))}
                                        disabled={checkInMeals === 0 || !firstName.trim() || ssnLast4.length !== 4 || !!alreadyCheckedInPerson}
                                        className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white w-8 text-center">
                                        {checkInMeals}
                                    </span>
                                    <button
                                        onClick={() => setCheckInMeals(checkInMeals + 1)}
                                        disabled={!firstName.trim() || ssnLast4.length !== 4 || !!alreadyCheckedInPerson}
                                        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 ${(!firstName.trim() || ssnLast4.length !== 4 || alreadyCheckedInPerson) ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium text-slate-900 dark:text-white">Items</span>
                                    {checkInItems.length > 0 && (
                                        <span className="text-sm text-slate-500">
                                            ({checkInItems.reduce((sum, i) => sum + i.quantity, 0)})
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowCheckInItemPicker(true)}
                                    disabled={!firstName.trim() || ssnLast4.length !== 4 || !!alreadyCheckedInPerson}
                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            {checkInItems.length > 0 && (
                                <div className="space-y-2">
                                    {checkInItems.map(item => (
                                        <div key={item.itemTypeId} className="flex items-center justify-between bg-white dark:bg-slate-600 rounded-lg px-3 py-2">
                                            <span className="text-sm text-slate-900 dark:text-white">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCheckInItems(prev => {
                                                        const newQty = item.quantity - 1;
                                                        if (newQty <= 0) return prev.filter(i => i.itemTypeId !== item.itemTypeId);
                                                        return prev.map(i => i.itemTypeId === item.itemTypeId ? { ...i, quantity: newQty } : i);
                                                    })}
                                                    className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-500 flex items-center justify-center"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => setCheckInItems(prev =>
                                                        prev.map(i => i.itemTypeId === item.itemTypeId ? { ...i, quantity: i.quantity + 1 } : i)
                                                    )}
                                                    className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Check In Button */}
                        <button
                            onClick={handleCheckIn}
                            disabled={!firstName.trim() || ssnLast4.length !== 4 || checkingIn || alreadyCheckedInPerson !== null}
                            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${firstName.trim() && ssnLast4.length === 4 && !alreadyCheckedInPerson
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
                                    {(checkInMeals > 0 || checkInItems.length > 0) && (
                                        <span className="ml-2 text-sm opacity-80">
                                            ({checkInMeals > 0 ? `${checkInMeals} meal${checkInMeals !== 1 ? 's' : ''}` : ''}
                                            {checkInMeals > 0 && checkInItems.length > 0 ? ', ' : ''}
                                            {checkInItems.length > 0 ? `${checkInItems.reduce((s, i) => s + i.quantity, 0)} item${checkInItems.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}` : ''})
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
                                        <p className="font-semibold text-slate-900 dark:text-white">{person.firstName}</p>
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
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        {person.mealCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Utensils className="w-3 h-3" />
                                                {person.mealCount} meal{person.mealCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {person.items.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {person.items.reduce((sum, i) => sum + i.quantity, 0)} item{person.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}
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
                                    {/* Meal Counter */}
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <Utensils className="w-5 h-5 text-orange-500" />
                                            <span className="font-medium text-slate-900 dark:text-white">Meals</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateMealCount(person, -1)}
                                                disabled={person.mealCount === 0 || updatingMeals}
                                                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50"
                                            >
                                                <Minus className="w-5 h-5" />
                                            </button>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white w-8 text-center">
                                                {person.mealCount}
                                            </span>
                                            <button
                                                onClick={() => updateMealCount(person, 1)}
                                                disabled={updatingMeals}
                                                className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-50"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items Given */}
                                    {person.items.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Items Given
                                            </p>
                                            <div className="space-y-2">
                                                {person.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-600 rounded-lg px-3 py-2">
                                                        <span className="text-sm text-slate-900 dark:text-white">{item.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateDistributionItem(item.id, item.quantity - 1)}
                                                                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="text-sm font-medium w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateDistributionItem(item.id, item.quantity + 1)}
                                                                className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
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
                            onClick={fetchCheckedInPeople}
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
                                        resetClothingPicker();
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pending Items */}
                            {pendingItems.length > 0 && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Items to add:</p>
                                    <div className="space-y-2">
                                        {pendingItems.map(item => (
                                            <div key={item.itemTypeId} className="flex items-center justify-between bg-white dark:bg-slate-700 rounded-lg px-3 py-2">
                                                <span className="text-sm text-slate-900 dark:text-white">{item.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updatePendingQuantity(item.itemTypeId, -1)} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => updatePendingQuantity(item.itemTypeId, 1)} className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
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
                                            {categories.map(cat => {
                                                const { icon: Icon, color, bg } = getCategoryIcon(cat.name);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => { setSelectedCategory(cat.id); resetClothingPicker(); }}
                                                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 flex flex-col items-center gap-2 transition-colors"
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
                                ) : isClothingCategory(selectedCategory) ? (
                                    /* Clothing Multi-Step */
                                    <div>
                                        <button
                                            onClick={() => { setSelectedCategory(null); resetClothingPicker(); }}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>

                                        {clothingStep === 'type' && (
                                            <div className="space-y-2">
                                                <p className="text-sm text-slate-500 mb-2">Select type:</p>
                                                {getClothingTypes().map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => selectClothingType(type)}
                                                        className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                    >
                                                        <span className="font-medium text-slate-900 dark:text-white">{type}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {clothingStep === 'gender' && (
                                            <div>
                                                <button onClick={resetClothingPicker} className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                                    <ChevronLeft className="w-4 h-4" /> Back
                                                </button>
                                                <p className="text-sm text-slate-500 mb-3">{selectedClothingType}</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {getClothingGenders().map(gender => (
                                                        <button
                                                            key={gender}
                                                            onClick={() => selectClothingGender(gender)}
                                                            className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center hover:bg-orange-50"
                                                        >
                                                            <span className="text-2xl block mb-1">
                                                                {gender === 'male' && '👨'}
                                                                {gender === 'female' && '👩'}
                                                                {gender === 'none' && '👤'}
                                                            </span>
                                                            <span className="text-sm capitalize">{gender === 'none' ? 'Unisex' : gender}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {clothingStep === 'size' && (
                                            <div>
                                                <button onClick={() => setClothingStep('gender')} className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                                    <ChevronLeft className="w-4 h-4" /> Back
                                                </button>
                                                <p className="text-sm text-slate-500 mb-3">{selectedClothingType} - {selectedGender === 'none' ? 'Unisex' : selectedGender}</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {getClothingSizes().map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => addPendingItem(item)}
                                                            className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-center hover:bg-orange-50"
                                                        >
                                                            <span className="font-medium text-slate-900 dark:text-white">{item.size}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Non-clothing items */
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>
                                        <p className="text-sm text-slate-500 mb-2">Select item:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => addPendingItem(item)}
                                                    className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                >
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                                                </button>
                                            ))}
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
                                        Add {pendingItems.reduce((sum, i) => sum + i.quantity, 0)} Item{pendingItems.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}
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
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Add Item</h3>
                                    <p className="text-sm text-slate-500">Select an item to add</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCheckInItemPicker(false);
                                        setSelectedCategory(null);
                                        resetClothingPicker();
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {!selectedCategory ? (
                                    /* Step 1: Select Category */
                                    <div>
                                        <p className="text-sm text-slate-500 mb-3">Select a category:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map(cat => {
                                                const { icon: Icon, color, bg } = getCategoryIcon(cat.name);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => { setSelectedCategory(cat.id); resetClothingPicker(); }}
                                                        className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 flex flex-col items-center gap-2 transition-colors"
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
                                ) : isClothingCategory(selectedCategory) ? (
                                    /* Clothing Multi-Step */
                                    <div>
                                        <button
                                            onClick={() => { setSelectedCategory(null); resetClothingPicker(); }}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>

                                        {clothingStep === 'type' && (
                                            <div className="space-y-2">
                                                <p className="text-sm text-slate-500 mb-2">Select type:</p>
                                                {getClothingTypes().map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => selectClothingType(type)}
                                                        className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                    >
                                                        <span className="font-medium text-slate-900 dark:text-white">{type}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {clothingStep === 'gender' && (
                                            <div>
                                                <button onClick={resetClothingPicker} className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                                    <ChevronLeft className="w-4 h-4" /> Back
                                                </button>
                                                <p className="text-sm text-slate-500 mb-3">{selectedClothingType}</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {getClothingGenders().map(gender => (
                                                        <button
                                                            key={gender}
                                                            onClick={() => selectClothingGender(gender)}
                                                            className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center hover:bg-orange-50"
                                                        >
                                                            <span className="text-2xl block mb-1">
                                                                {gender === 'male' && '👨'}
                                                                {gender === 'female' && '👩'}
                                                                {gender === 'none' && '👤'}
                                                            </span>
                                                            <span className="text-sm capitalize">{gender === 'none' ? 'Unisex' : gender}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {clothingStep === 'size' && (
                                            <div>
                                                <button onClick={() => setClothingStep('gender')} className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                                                    <ChevronLeft className="w-4 h-4" /> Back
                                                </button>
                                                <p className="text-sm text-slate-500 mb-3">{selectedClothingType} - {selectedGender === 'none' ? 'Unisex' : selectedGender}</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {getClothingSizes().map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => addCheckInItem(item)}
                                                            className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-center hover:bg-orange-50"
                                                        >
                                                            <span className="font-medium text-slate-900 dark:text-white">{item.size}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Non-clothing items */
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-sm text-slate-500 mb-4 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back to categories
                                        </button>
                                        <p className="text-sm text-slate-500 mb-2">Select item:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => addCheckInItem(item)}
                                                    className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                >
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
        </div >
    );
}
