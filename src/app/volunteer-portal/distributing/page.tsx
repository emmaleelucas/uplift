"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
    ChevronLeft, User, MapPin, Clock, Utensils, Package,
    Plus, X, Check, Loader2, AlertCircle, Search, Hash, UserCheck, UserPlus, CheckCircle2, Lock,
    Shirt, Droplets, ShoppingBag, Apple, ChevronRight, ArrowLeft
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
    gender: string | null;
    size: string | null;
}

interface SelectedItem {
    itemTypeId: string;
    name: string;
    category: string;
    quantity: number;
}

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
}

interface FoundPerson {
    id: string;
    firstName: string;
    visitCount: number;
    lastVisit: string | null;
}

export default function DistributingPage() {
    // Form state
    const [firstName, setFirstName] = useState("");
    const [ssnLast4, setSsnLast4] = useState("");
    const [mealServed, setMealServed] = useState(false);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // Location state
    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    // Data state
    const [categories, setCategories] = useState<Category[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // UI state
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [itemSearchQuery, setItemSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Clothing selection flow state
    const [clothingStep, setClothingStep] = useState<'type' | 'gender' | 'size' | null>(null);
    const [selectedClothingType, setSelectedClothingType] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);

    // Person lookup state
    const [foundPerson, setFoundPerson] = useState<FoundPerson | null>(null);
    const [searchingPerson, setSearchingPerson] = useState(false);
    const [searchPending, setSearchPending] = useState(false);

    // Current time state (to avoid SSR issues with new Date())
    const [currentTime, setCurrentTime] = useState<string>("");

    // Check if form is ready for meal/items
    const isFormReady = firstName.trim().length >= 1 && ssnLast4.length === 4;

    // Set current time on client side
    useEffect(() => {
        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        setCurrentTime(formatTime(new Date()));

        // Update time every minute
        const interval = setInterval(() => {
            setCurrentTime(formatTime(new Date()));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Get current location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(),
                    });
                    setLoadingLocation(false);
                },
                (error) => {
                    setLocationError(
                        error.code === 1
                            ? "Location access denied. Please enable location services."
                            : "Unable to get location. Please try again."
                    );
                    setLoadingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setLoadingLocation(false);
        }
    }, []);

    // Fetch categories and item types
    useEffect(() => {
        async function fetchData() {
            try {
                const supabase = createClient();

                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('category')
                    .select('*')
                    .order('name');

                if (categoriesError) throw categoriesError;
                setCategories(categoriesData || []);

                const { data: itemTypesData, error: itemTypesError } = await supabase
                    .from('item_type')
                    .select('*')
                    .order('name');

                if (itemTypesError) throw itemTypesError;
                setItemTypes(itemTypesData || []);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoadingData(false);
            }
        }

        fetchData();
    }, []);

    // Search for existing person when name and SSN are entered
    useEffect(() => {
        const searchPerson = async () => {
            // Only search if we have both name and full 4-digit SSN
            if (firstName.trim().length < 1 || ssnLast4.length !== 4) {
                setFoundPerson(null);
                setSearchPending(false);
                return;
            }

            setSearchPending(false);
            setSearchingPerson(true);

            try {
                const supabase = createClient();
                const ssnHash = `hash_${ssnLast4}`;
                const trimmedFirstName = firstName.trim().toLowerCase();

                // Search for person with matching name and SSN
                const { data: person } = await supabase
                    .from('homeless_person')
                    .select('id, first_name')
                    .eq('ssn_last4_hash', ssnHash)
                    .ilike('first_name', trimmedFirstName)
                    .single();

                if (person) {
                    // Found person - get their visit count
                    const { count } = await supabase
                        .from('distribution')
                        .select('*', { count: 'exact', head: true })
                        .eq('homeless_person_id', person.id);

                    // Get last visit date
                    const { data: lastDistribution } = await supabase
                        .from('distribution')
                        .select('distributed_at')
                        .eq('homeless_person_id', person.id)
                        .order('distributed_at', { ascending: false })
                        .limit(1)
                        .single();

                    setFoundPerson({
                        id: person.id,
                        firstName: person.first_name,
                        visitCount: count || 0,
                        lastVisit: lastDistribution?.distributed_at || null,
                    });
                } else {
                    setFoundPerson(null);
                }
            } catch (err) {
                // No person found or error - that's ok
                setFoundPerson(null);
            } finally {
                setSearchingPerson(false);
            }
        };

        // Mark search as pending during debounce (only if we have valid inputs)
        if (firstName.trim().length >= 1 && ssnLast4.length === 4) {
            setSearchPending(true);
        }

        // Debounce the search
        const timeoutId = setTimeout(searchPerson, 500);
        return () => clearTimeout(timeoutId);
    }, [firstName, ssnLast4]);

    // Filter items based on search and category
    const filteredItems = useMemo(() => {
        let items = [...itemTypes];

        if (selectedCategory) {
            items = items.filter(item => item.category_id === selectedCategory);
        }

        if (itemSearchQuery) {
            const query = itemSearchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.size && item.size.toLowerCase().includes(query))
            );
        }

        return items;
    }, [itemTypes, selectedCategory, itemSearchQuery]);

    // Get category name by ID
    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || "Unknown";
    };

    // Add item to selection
    const addItem = (item: ItemType) => {
        const existing = selectedItems.find(si => si.itemTypeId === item.id);
        if (existing) {
            setSelectedItems(selectedItems.map(si =>
                si.itemTypeId === item.id
                    ? { ...si, quantity: si.quantity + 1 }
                    : si
            ));
        } else {
            // Check if this item type has multiple sizes
            const sameNameItems = itemTypes.filter(i =>
                i.name === item.name &&
                i.category_id === item.category_id &&
                i.gender === item.gender
            );
            const hasMultipleSizes = sameNameItems.length > 1;

            // Build display name - only show size if there are multiple size options
            let displayName = item.name;
            if (item.size && hasMultipleSizes) {
                displayName += ` (${item.size})`;
            }
            if (item.gender && item.gender !== 'none') {
                displayName += ` - ${item.gender}`;
            }

            setSelectedItems([...selectedItems, {
                itemTypeId: item.id,
                name: displayName,
                category: getCategoryName(item.category_id),
                quantity: 1,
            }]);
        }
        resetItemPicker();
    };

    // Reset item picker state
    const resetItemPicker = () => {
        setShowItemPicker(false);
        setItemSearchQuery("");
        setSelectedCategory(null);
        setClothingStep(null);
        setSelectedClothingType(null);
        setSelectedGender(null);
    };

    // Get unique clothing types (base names without size/gender)
    const getClothingTypes = () => {
        const clothingCategory = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCategory) return [];

        const clothingItems = itemTypes.filter(item => item.category_id === clothingCategory.id);
        const types = [...new Set(clothingItems.map(item => item.name))];
        return types.sort();
    };

    // Get available genders for selected clothing type (ordered: male, female, unisex)
    const getClothingGenders = () => {
        const clothingCategory = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCategory || !selectedClothingType) return [];

        const items = itemTypes.filter(
            item => item.category_id === clothingCategory.id && item.name === selectedClothingType
        );
        const gendersSet = new Set(items.map(item => item.gender).filter(Boolean));

        // Order: male, female, none (unisex)
        const orderedGenders: string[] = [];
        if (gendersSet.has('male')) orderedGenders.push('male');
        if (gendersSet.has('female')) orderedGenders.push('female');
        if (gendersSet.has('none')) orderedGenders.push('none');

        return orderedGenders;
    };

    // Get available sizes for selected clothing type and gender (ordered smallest to largest)
    const getClothingSizes = () => {
        const clothingCategory = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCategory || !selectedClothingType || !selectedGender) return [];

        const items = itemTypes.filter(
            item => item.category_id === clothingCategory.id &&
                item.name === selectedClothingType &&
                item.gender === selectedGender
        );

        // Size ordering
        const sizeOrder = ['one_size', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL',
            '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5',
            '11', '11.5', '12', '12.5', '13', '13.5', '14'];

        return items.sort((a, b) => {
            const aIndex = sizeOrder.indexOf(a.size || '');
            const bIndex = sizeOrder.indexOf(b.size || '');
            return aIndex - bIndex;
        });
    };

    // Select clothing type - auto-skip gender if only 1 option
    const selectClothingType = (type: string) => {
        setSelectedClothingType(type);

        // Check how many genders are available for this type
        const clothingCategory = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCategory) return;

        const items = itemTypes.filter(
            item => item.category_id === clothingCategory.id && item.name === type
        );
        const gendersSet = new Set(items.map(item => item.gender).filter(Boolean));

        if (gendersSet.size === 1) {
            // Only 1 gender - auto-select it
            const singleGender = [...gendersSet][0];
            setSelectedGender(singleGender);

            // Check if also only 1 size
            const sizeItems = items.filter(i => i.gender === singleGender);
            if (sizeItems.length === 1) {
                // Only 1 size - add the item directly
                addItem(sizeItems[0]);
            } else {
                setClothingStep('size');
            }
        } else {
            setClothingStep('gender');
        }
    };

    // Select clothing gender - auto-skip size if only 1 option
    const selectClothingGender = (gender: string) => {
        setSelectedGender(gender);

        const clothingCategory = categories.find(c => c.name.toLowerCase() === 'clothing');
        if (!clothingCategory || !selectedClothingType) return;

        const items = itemTypes.filter(
            item => item.category_id === clothingCategory.id &&
                item.name === selectedClothingType &&
                item.gender === gender
        );

        if (items.length === 1) {
            // Only 1 size - add the item directly
            addItem(items[0]);
        } else {
            setClothingStep('size');
        }
    };

    // Check if category is clothing
    const isClothingCategory = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name.toLowerCase() === 'clothing';
    };

    // Remove item from selection
    const removeItem = (itemTypeId: string) => {
        setSelectedItems(selectedItems.filter(si => si.itemTypeId !== itemTypeId));
    };

    // Update item quantity (or delete if going below 1)
    const updateQuantity = (itemTypeId: string, delta: number) => {
        setSelectedItems(prevItems => {
            return prevItems
                .map(si => {
                    if (si.itemTypeId === itemTypeId) {
                        const newQty = si.quantity + delta;
                        return { ...si, quantity: newQty };
                    }
                    return si;
                })
                .filter(si => si.quantity > 0); // Remove items with 0 or less quantity
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!firstName.trim()) {
            setSubmitError("Please enter a first name");
            return;
        }

        if (!mealServed && selectedItems.length === 0) {
            setSubmitError("Please record a meal or add at least one item");
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const supabase = createClient();

            // First, create or find the homeless person
            let personId: string;
            const trimmedFirstName = firstName.trim().toLowerCase();

            if (ssnLast4) {
                // Check if person exists with BOTH same first name AND SSN hash
                const ssnHash = `hash_${ssnLast4}`;
                const { data: existingPerson } = await supabase
                    .from('homeless_person')
                    .select('id, first_name')
                    .eq('ssn_last4_hash', ssnHash)
                    .ilike('first_name', trimmedFirstName)
                    .single();

                if (existingPerson) {
                    // Found existing person with matching name and SSN
                    personId = existingPerson.id;
                } else {
                    // No match found - create new person
                    const { data: newPerson, error: personError } = await supabase
                        .from('homeless_person')
                        .insert({
                            first_name: firstName.trim(),
                            ssn_last4_hash: ssnHash,
                        })
                        .select('id')
                        .single();

                    if (personError) throw personError;
                    personId = newPerson.id;
                }
            } else {
                // No SSN provided - always create a new person record
                // (Without SSN, we can't reliably identify returning visitors)
                const { data: newPerson, error: personError } = await supabase
                    .from('homeless_person')
                    .insert({
                        first_name: firstName.trim(),
                    })
                    .select('id')
                    .single();

                if (personError) throw personError;
                personId = newPerson.id;
            }

            // Create the distribution record
            const { data: distributionRecord, error: distributionError } = await supabase
                .from('distribution')
                .insert({
                    homeless_person_id: personId,
                    latitude: location?.latitude || null,
                    longitude: location?.longitude || null,
                    meal_served: mealServed ? 1 : 0,
                    distributed_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (distributionError) throw distributionError;

            // Add items to the distribution
            if (selectedItems.length > 0) {
                const itemRecords = selectedItems.map(item => ({
                    distribution_id: distributionRecord.id,
                    item_type_id: item.itemTypeId,
                    quantity: item.quantity,
                }));

                const { error: itemsError } = await supabase
                    .from('distribution_item')
                    .insert(itemRecords);

                if (itemsError) throw itemsError;
            }

            // Success!
            setSubmitSuccess(true);

            // Reset form after delay
            setTimeout(() => {
                setFirstName("");
                setSsnLast4("");
                setMealServed(false);
                setSelectedItems([]);
                setSubmitSuccess(false);
            }, 2000);

        } catch (err) {
            console.error('Error submitting:', err);
            setSubmitError("Failed to save. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/volunteer-portal"
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Log Distribution
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Record who you're serving
                                </p>
                            </div>
                        </div>

                        {/* Current Time */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            {currentTime || "--:--"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Banner */}
            {submitSuccess && (
                <div className="fixed top-16 left-0 right-0 z-[60] animate-slide-up">
                    <div className="max-w-2xl mx-auto px-4 pt-4">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-1 text-white">
                                    <h3 className="text-xl font-bold">Distribution Logged!</h3>
                                    <p className="text-green-100">
                                        Successfully recorded for {firstName}
                                        {mealServed && " • Meal served"}
                                        {selectedItems.length > 0 && ` • ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} given`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Location Status */}
                <div className={`mb-6 p-4 rounded-xl border ${loadingLocation
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : location
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                    <div className="flex items-center gap-3">
                        <MapPin className={`w-5 h-5 ${loadingLocation
                            ? 'text-blue-500'
                            : location
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`} />
                        <div className="flex-1">
                            {loadingLocation ? (
                                <p className="text-sm text-blue-700 dark:text-blue-300">Getting your location...</p>
                            ) : location ? (
                                <>
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                        Location captured
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Accuracy: ±{Math.round(location.accuracy)}m
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                            )}
                        </div>
                        {loadingLocation && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Person Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" />
                        Person Information
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <span className="flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        Last 4 SSN
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={ssnLast4}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setSsnLast4(val);
                                    }}
                                    placeholder="0000"
                                    maxLength={4}
                                    inputMode="numeric"
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-widest text-center text-lg font-mono"
                                />
                            </div>
                        </div>

                        {/* Person Lookup Status */}
                        {(searchingPerson || searchPending || foundPerson || (firstName.trim() && ssnLast4.length === 4)) && (
                            <div className={`p-4 rounded-xl border transition-all ${(searchingPerson || searchPending)
                                ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                : foundPerson
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {(searchingPerson || searchPending) ? (
                                        <>
                                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                Searching...
                                            </p>
                                        </>
                                    ) : foundPerson ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                                <UserCheck className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                    Returning Visitor Found!
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    {foundPerson.visitCount > 0
                                                        ? `${foundPerson.visitCount} previous visit${foundPerson.visitCount !== 1 ? 's' : ''}`
                                                        : 'First recorded visit'}
                                                    {foundPerson.lastVisit && (
                                                        <span> • Last seen {new Date(foundPerson.lastVisit).toLocaleDateString()}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                <UserPlus className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                    New Person
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    Will be added to the system
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Meal Served */}
                <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 transition-opacity ${!isFormReady ? 'opacity-50' : ''}`}>
                    {!isFormReady && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400">
                            <Lock className="w-4 h-4" />
                            Enter name and SSN first
                        </div>
                    )}
                    <button
                        onClick={() => isFormReady && setMealServed(!mealServed)}
                        disabled={!isFormReady}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${mealServed
                            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                            : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            } ${!isFormReady ? 'cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mealServed
                                ? 'bg-green-500'
                                : 'bg-slate-200 dark:bg-slate-600'
                                }`}>
                                <Utensils className={`w-5 h-5 ${mealServed ? 'text-white' : 'text-slate-500'}`} />
                            </div>
                            <span className={`font-semibold ${mealServed ? 'text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                Meal Served
                            </span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${mealServed
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 dark:border-slate-600'
                            }`}>
                            {mealServed && <Check className="w-4 h-4 text-white" />}
                        </div>
                    </button>
                </div>

                {/* Items Given */}
                <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 transition-opacity ${!isFormReady ? 'opacity-50' : ''}`}>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" />
                        Items Given
                    </h2>

                    {!isFormReady && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400">
                            <Lock className="w-4 h-4" />
                            Enter name and SSN first
                        </div>
                    )}

                    {/* Selected Items */}
                    {selectedItems.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {selectedItems.map(item => (
                                <div
                                    key={item.itemTypeId}
                                    className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {item.category}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.itemTypeId, -1)}
                                            className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-semibold text-slate-900 dark:text-white">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.itemTypeId, 1)}
                                            className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.itemTypeId)}
                                            className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Item Button */}
                    <button
                        onClick={() => isFormReady && setShowItemPicker(true)}
                        disabled={!isFormReady}
                        className={`w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center gap-2 ${isFormReady ? 'hover:border-orange-500 hover:text-orange-500' : 'cursor-not-allowed'}`}
                    >
                        <Plus className="w-5 h-5" />
                        Add Item
                    </button>
                </div>

                {/* Submit Error */}
                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || submitSuccess}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${submitSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                        } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : submitSuccess ? (
                        <>
                            <Check className="w-5 h-5" />
                            Saved Successfully!
                        </>
                    ) : (
                        'Save Distribution'
                    )}
                </button>

                {/* Quick tip */}
                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Tip: You can add multiple items before saving
                </p>
            </div>

            {/* Item Picker Modal */}
            {showItemPicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {(selectedCategory || clothingStep) && (
                                    <button
                                        onClick={() => {
                                            if (clothingStep === 'size') {
                                                setClothingStep('gender');
                                                setSelectedGender(null);
                                            } else if (clothingStep === 'gender') {
                                                setClothingStep('type');
                                                setSelectedClothingType(null);
                                            } else if (clothingStep === 'type') {
                                                setClothingStep(null);
                                                setSelectedCategory(null);
                                            } else {
                                                setSelectedCategory(null);
                                            }
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                                    </button>
                                )}
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {!selectedCategory && 'Add Item'}
                                    {selectedCategory && !clothingStep && getCategoryName(selectedCategory)}
                                    {clothingStep === 'type' && 'Select Item Type'}
                                    {clothingStep === 'gender' && `${selectedClothingType} - Select Gender`}
                                    {clothingStep === 'size' && `${selectedClothingType} (${selectedGender}) - Select Size`}
                                </h3>
                            </div>
                            <button
                                onClick={resetItemPicker}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Search - Only show when no category selected or browsing non-clothing */}
                        {(!selectedCategory || (selectedCategory && !isClothingCategory(selectedCategory) && !clothingStep)) && (
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={itemSearchQuery}
                                        onChange={(e) => setItemSearchQuery(e.target.value)}
                                        placeholder="Search items..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[60vh] p-4">
                            {loadingData ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : !selectedCategory ? (
                                /* Step 1: Category Selection */
                                <>
                                    {/* Show search results if searching */}
                                    {itemSearchQuery && (
                                        <div className="mb-4">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Search Results</p>
                                            {filteredItems.length === 0 ? (
                                                <p className="text-center text-slate-400 py-4">No items found</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {filteredItems.slice(0, 10).map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => addItem(item)}
                                                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-300 transition-all"
                                                        >
                                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                {item.name}
                                                                {item.size && <span className="text-slate-500"> ({item.size})</span>}
                                                                {item.gender && item.gender !== 'none' && (
                                                                    <span className="text-slate-500"> - {item.gender}</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{getCategoryName(item.category_id)}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!itemSearchQuery && (
                                        <>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose a category</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.map(cat => {
                                                    const iconMap: { [key: string]: React.ReactNode } = {
                                                        'clothing': <Shirt className="w-8 h-8" />,
                                                        'hygiene': <Droplets className="w-8 h-8" />,
                                                        'basic needs': <ShoppingBag className="w-8 h-8" />,
                                                        'canned goods': <Apple className="w-8 h-8" />,
                                                    };
                                                    const colorMap: { [key: string]: string } = {
                                                        'clothing': 'from-blue-500 to-indigo-500',
                                                        'hygiene': 'from-cyan-500 to-teal-500',
                                                        'basic needs': 'from-orange-500 to-amber-500',
                                                        'canned goods': 'from-green-500 to-emerald-500',
                                                    };
                                                    const name = cat.name.toLowerCase();
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => {
                                                                setSelectedCategory(cat.id);
                                                                if (isClothingCategory(cat.id)) {
                                                                    setClothingStep('type');
                                                                }
                                                            }}
                                                            className="flex flex-col items-center gap-3 p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:shadow-lg transition-all hover:scale-[1.02]"
                                                        >
                                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[name] || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white`}>
                                                                {iconMap[name] || <Package className="w-8 h-8" />}
                                                            </div>
                                                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                                {cat.name}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : clothingStep === 'type' ? (
                                /* Clothing Step 1: Select Type */
                                <div className="space-y-2">
                                    {getClothingTypes().map(type => (
                                        <button
                                            key={type}
                                            onClick={() => selectClothingType(type)}
                                            className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-300 transition-all flex items-center justify-between"
                                        >
                                            <span className="font-medium text-slate-900 dark:text-white">{type}</span>
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            ) : clothingStep === 'gender' ? (
                                /* Clothing Step 2: Select Gender */
                                <div className="grid grid-cols-3 gap-3">
                                    {getClothingGenders().map(gender => (
                                        <button
                                            key={gender}
                                            onClick={() => selectClothingGender(gender)}
                                            className="flex flex-col items-center gap-2 p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-300 transition-all"
                                        >
                                            <span className="text-3xl">
                                                {gender === 'male' && '👨'}
                                                {gender === 'female' && '👩'}
                                                {gender === 'none' && '👤'}
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white capitalize">
                                                {gender === 'none' ? 'Unisex' : gender}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : clothingStep === 'size' ? (
                                /* Clothing Step 3: Select Size */
                                <div className="grid grid-cols-2 gap-3">
                                    {getClothingSizes().map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => addItem(item)}
                                            className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-center hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-300 transition-all"
                                        >
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white block">
                                                {item.size || 'One Size'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Non-Clothing Category: Show Items Directly */
                                <div className="space-y-2">
                                    {filteredItems.length === 0 ? (
                                        <p className="text-center text-slate-500 dark:text-slate-400 py-12">
                                            No items found
                                        </p>
                                    ) : (
                                        filteredItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => addItem(item)}
                                                className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-transparent hover:border-orange-300 transition-all"
                                            >
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {item.name}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
