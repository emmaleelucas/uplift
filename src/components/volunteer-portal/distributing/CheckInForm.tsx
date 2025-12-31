"use client";

import { useState, useEffect } from "react";
import {
    User, Hash, Loader2, UserPlus, UserCheck, Utensils, Package, Plus, Minus, X
} from "lucide-react";
import { CheckedInPerson, SelectedItem, Coordinates, RouteStop } from "@/types/distribution";
import {
    findExistingPerson,
    checkIfPersonCheckedInToday,
    createPerson,
    createDistribution,
    addDistributionItem,
} from "@/db/actions";

interface CheckInFormProps {
    currentStop: RouteStop | null;
    currentLocation: Coordinates | null;
    routeStopId: string | null;
    checkInItems: SelectedItem[];
    onOpenItemPicker: () => void;
    onRemoveItem: (itemTypeId: string) => void;
    onCheckInSuccess: () => void;
    onCancel: () => void;
}

export function CheckInForm({
    currentStop,
    currentLocation,
    routeStopId,
    checkInItems,
    onOpenItemPicker,
    onRemoveItem,
    onCheckInSuccess,
    onCancel,
}: CheckInFormProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [ssnLast4, setSsnLast4] = useState("");
    const [mealServed, setMealServed] = useState(true);
    const [takeAway, setTakeAway] = useState(0);
    const [showTakeAwayInput, setShowTakeAwayInput] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [alreadyCheckedInPerson, setAlreadyCheckedInPerson] = useState<CheckedInPerson | null>(null);
    const [checkingExisting, setCheckingExisting] = useState(false);

    // Check if person is already checked in today when typing name
    useEffect(() => {
        const checkIfAlreadyCheckedIn = async () => {
            const hasFirstName = firstName.trim().length >= 1;
            const hasLastName = lastName.trim().length >= 1;
            const hasSSN = ssnLast4.length === 4;

            if (!hasFirstName || (!hasLastName && !hasSSN)) {
                setAlreadyCheckedInPerson(null);
                return;
            }

            setCheckingExisting(true);

            try {
                const trimmedFirstName = firstName.trim();
                const trimmedLastName = lastName.trim() || null;
                const ssnHash = ssnLast4.length === 4 ? `hash_${ssnLast4}` : null;

                const person = await findExistingPerson(trimmedFirstName, trimmedLastName, ssnHash);

                if (person) {
                    const todayInfo = await checkIfPersonCheckedInToday(person.id);

                    if (todayInfo) {
                        setAlreadyCheckedInPerson({
                            id: person.id,
                            distributionIds: todayInfo.distributionIds,
                            firstName: person.first_name,
                            lastName: person.last_name,
                            ssnLast4: person.ssn_last4_hash?.replace('hash_', '') || null,
                            mealServed: todayInfo.mealServed,
                            mealsTakeAway: todayInfo.mealsTakeAway,
                            items: [],
                            checkedInAt: new Date().toISOString(),
                            previousStopName: todayInfo.stopName,
                            previousRouteName: todayInfo.routeName,
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

    const handleCheckIn = async () => {
        if (!firstName.trim()) return;

        setCheckingIn(true);

        try {
            const trimmedFirstName = firstName.trim();
            const trimmedLastName = lastName.trim() || null;
            const ssnHash = ssnLast4.length === 4 ? `hash_${ssnLast4}` : null;
            const isIdentifiable = !!(trimmedLastName || ssnHash);

            let personId: string | null = null;

            if (isIdentifiable) {
                const existingPerson = await findExistingPerson(trimmedFirstName, trimmedLastName, ssnHash);

                if (existingPerson) {
                    personId = existingPerson.id;
                } else {
                    personId = await createPerson(trimmedFirstName, trimmedLastName, ssnHash, true);
                }
            } else {
                personId = await createPerson(trimmedFirstName, null, null, false);
            }

            if (!personId) {
                throw new Error('Failed to create person');
            }

            const location = currentLocation ?? (currentStop ? { lat: currentStop.latitude, lng: currentStop.longitude } : null);
            const distributionId = await createDistribution(personId, mealServed, takeAway, location, routeStopId);

            if (distributionId && checkInItems.length > 0) {
                for (const item of checkInItems) {
                    await addDistributionItem(distributionId, item.itemTypeId, item.quantity);
                }
            }

            onCheckInSuccess();

        } catch (err) {
            console.error('Check-in error:', err);
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCancel = () => {
        setFirstName("");
        setLastName("");
        setSsnLast4("");
        setMealServed(true);
        setTakeAway(0);
        setShowTakeAwayInput(false);
        setAlreadyCheckedInPerson(null);
        onCancel();
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    New Check-In
                </h2>
                <button
                    onClick={handleCancel}
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

            {/* SSN field */}
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

            {/* Already Checked In Indicator */}
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
                        onClick={() => setMealServed(!mealServed)}
                        disabled={!firstName.trim()}
                        className={`w-14 h-8 rounded-full transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed ${
                            mealServed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                            mealServed ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                    </button>
                </div>

                {/* Take Away */}
                {!showTakeAwayInput && takeAway === 0 ? (
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
                                    const newVal = Math.max(0, takeAway - 1);
                                    setTakeAway(newVal);
                                    if (newVal === 0) setShowTakeAwayInput(false);
                                }}
                                disabled={takeAway === 0 || !firstName.trim()}
                                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold text-slate-900 dark:text-white w-6 text-center">
                                {takeAway}
                            </span>
                            <button
                                onClick={() => setTakeAway(takeAway + 1)}
                                disabled={!firstName.trim()}
                                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Items Section */}
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
                        onClick={onOpenItemPicker}
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
                                    onClick={() => onRemoveItem(item.itemTypeId)}
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
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                    firstName.trim() && !checkingIn
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
                        {(mealServed || takeAway > 0 || checkInItems.length > 0) && (
                            <span className="ml-2 text-sm opacity-80">
                                ({mealServed ? 'meal' : ''}
                                {mealServed && takeAway > 0 ? ', ' : ''}
                                {takeAway > 0 ? `${takeAway} take away` : ''}
                                {(mealServed || takeAway > 0) && checkInItems.length > 0 ? ', ' : ''}
                                {checkInItems.length > 0 ? `${checkInItems.length} item${checkInItems.length !== 1 ? 's' : ''}` : ''})
                            </span>
                        )}
                    </>
                )}
            </button>
        </div>
    );
}
