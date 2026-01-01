"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Loader2, UserPlus, MapPin, Check
} from "lucide-react";
import { CheckedInPerson, SelectedItem } from "@/types/distribution";
import { useDistribution } from "@/contexts/DistributionContext";
import { useItems } from "@/hooks/distribution/useItems";
import {
    fetchCheckedInPeopleAtStop,
    updateMealServed,
    updateMealsTakeAway,
    deletePersonCheckIns,
    addDistributionItem,
    deleteDistributionItem,
} from "@/db/actions";
import {
    StopHeader,
    InTransitHeader,
    StopSelector,
    CheckInForm,
    PersonCard,
    ItemPickerModal,
    DeleteConfirmModal,
} from "@/components/volunteer-portal/distributing";

export default function DistributingPage() {
    // Distribution context for location and stop management
    const {
        currentLocation,
        routes,
        routeStops,
        currentStop,
        detectedStop,
        stopConfirmed,
        routeStopId,
        loadingRoutes,
        newStopDetected,
        inTransit,
        confirmStop,
        changeStop,
    } = useDistribution();

    // Items management
    const {
        categories,
        filteredItems,
        selectedCategory,
        setSelectedCategory,
        getCategoryIcon,
        getCategoryName,
    } = useItems();

    // UI state
    const [showNewCheckIn, setShowNewCheckIn] = useState(false);
    const [checkInSuccess, setCheckInSuccess] = useState(false);
    const [checkInItems, setCheckInItems] = useState<SelectedItem[]>([]);
    const [showCheckInItemPicker, setShowCheckInItemPicker] = useState(false);

    // People list state
    const [checkedInPeople, setCheckedInPeople] = useState<CheckedInPerson[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<CheckedInPerson | null>(null);
    const [loadingPeople, setLoadingPeople] = useState(false);

    // Item picker for existing person
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [pendingItems, setPendingItems] = useState<SelectedItem[]>([]);

    // SSN reveal state
    const [revealedSsnId, setRevealedSsnId] = useState<string | null>(null);

    // Delete confirmation
    const [personToDelete, setPersonToDelete] = useState<CheckedInPerson | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Calculate next stop based on current stop
    const nextStop = useMemo(() => {
        if (!currentStop) return null;

        const sameRouteStops = routeStops
            .filter(s => s.routeId === currentStop.routeId)
            .sort((a, b) => a.stopNumber - b.stopNumber);

        const currentIndex = sameRouteStops.findIndex(s => s.id === currentStop.id);
        if (currentIndex === -1 || currentIndex === sameRouteStops.length - 1) {
            return null;
        }

        return sameRouteStops[currentIndex + 1];
    }, [currentStop, routeStops]);

    // Reveal SSN temporarily
    const revealSsn = (personId: string) => {
        setRevealedSsnId(personId);
        setTimeout(() => {
            setRevealedSsnId(prev => prev === personId ? null : prev);
        }, 3000);
    };

    // Fetch checked-in people at the current stop
    const fetchPeople = async () => {
        if (!currentStop) {
            setCheckedInPeople([]);
            setLoadingPeople(false);
            return;
        }

        setLoadingPeople(true);
        const people = await fetchCheckedInPeopleAtStop(currentStop.id);
        setCheckedInPeople(people);
        setLoadingPeople(false);
    };

    // Fetch people when current stop changes
    useEffect(() => {
        fetchPeople();
    }, [currentStop]);

    // Handle transition to in-transit or new stop detected state - clear UI and list
    useEffect(() => {
        if (inTransit || newStopDetected) {
            // Close check-in form and clear items
            setShowNewCheckIn(false);
            setCheckInItems([]);
            setShowCheckInItemPicker(false);

            // Close item picker for existing person
            setShowItemPicker(false);
            setPendingItems([]);

            // Clear selection and people list
            setSelectedPerson(null);
            setCheckedInPeople([]);

            // Clear any pending delete
            setPersonToDelete(null);
        }
    }, [inTransit, newStopDetected]);

    // Toggle meal served
    const toggleMealServed = async (person: CheckedInPerson) => {
        const newValue = !person.mealServed;

        setCheckedInPeople(prev => prev.map(p =>
            p.id === person.id ? { ...p, mealServed: newValue } : p
        ));

        if (selectedPerson?.id === person.id) {
            setSelectedPerson({ ...selectedPerson, mealServed: newValue });
        }

        const primaryDistId = person.distributionIds[0];
        await updateMealServed(primaryDistId, newValue);
    };

    // Update take away meals count
    const updateTakeAwayCount = async (person: CheckedInPerson, delta: number) => {
        const newCount = Math.max(0, person.mealsTakeAway + delta);

        setCheckedInPeople(prev => prev.map(p =>
            p.id === person.id ? { ...p, mealsTakeAway: newCount } : p
        ));

        if (selectedPerson?.id === person.id) {
            setSelectedPerson({ ...selectedPerson, mealsTakeAway: newCount });
        }

        const primaryDistId = person.distributionIds[0];
        await updateMealsTakeAway(primaryDistId, newCount);
    };

    // Delete person from today's check-in list
    const confirmDeleteCheckIn = async () => {
        if (!personToDelete) return;

        setDeleting(true);

        await deletePersonCheckIns(personToDelete.distributionIds);

        setCheckedInPeople(prev => prev.filter(p => p.id !== personToDelete.id));
        if (selectedPerson?.id === personToDelete.id) {
            setSelectedPerson(null);
        }

        setDeleting(false);
        setPersonToDelete(null);
    };

    // Add items to person
    const addItemsToPerson = async (items: SelectedItem[]) => {
        if (!selectedPerson || items.length === 0) return;

        const primaryDistId = selectedPerson.distributionIds[0];
        const newItems: typeof selectedPerson.items = [...selectedPerson.items];

        for (const item of items) {
            const existingItem = selectedPerson.items.find(i => i.itemTypeId === item.itemTypeId);

            if (!existingItem) {
                const insertedId = await addDistributionItem(primaryDistId, item.itemTypeId, item.quantity);

                if (insertedId) {
                    newItems.push({
                        id: insertedId,
                        itemTypeId: item.itemTypeId,
                        name: item.name,
                        quantity: item.quantity
                    });
                }
            }
        }

        const updatedPerson = { ...selectedPerson, items: newItems };
        setSelectedPerson(updatedPerson);
        setCheckedInPeople(prev => prev.map(p => p.id === selectedPerson.id ? updatedPerson : p));

        setPendingItems([]);
        setShowItemPicker(false);
    };

    // Remove distribution item
    const removeItem = async (itemId: string) => {
        const updateItems = (items: CheckedInPerson['items']) => {
            return items.filter(i => i.id !== itemId);
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

        await deleteDistributionItem(itemId);
    };

    // Handle check-in success
    const handleCheckInSuccess = async () => {
        setCheckInSuccess(true);
        setShowNewCheckIn(false);
        setCheckInItems([]);
        await fetchPeople();
        setTimeout(() => setCheckInSuccess(false), 2000);
    };

    // Handle confirming new detected stop
    const handleConfirmNewStop = () => {
        if (newStopDetected) {
            confirmStop(newStopDetected);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Stop Selection Section */}
            {!stopConfirmed ? (
                <StopSelector
                    routes={routes}
                    routeStops={routeStops}
                    detectedStop={detectedStop}
                    currentLocation={currentLocation}
                    loading={loadingRoutes}
                    onConfirmStop={confirmStop}
                />
            ) : (
                <>
                    {/* Stop Header or In Transit Header */}
                    {currentStop && (
                        inTransit ? (
                            <InTransitHeader
                                lastStop={currentStop}
                                nextStop={nextStop}
                                onChangeStop={changeStop}
                            />
                        ) : (
                            <StopHeader
                                currentStop={currentStop}
                                nextStop={nextStop}
                                newStopDetected={newStopDetected}
                                onChangeStop={changeStop}
                                onConfirmNewStop={handleConfirmNewStop}
                            />
                        )
                    )}

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
                        {!showNewCheckIn || inTransit || newStopDetected ? (
                            <button
                                onClick={() => {
                                    if (!inTransit && !newStopDetected) {
                                        setSelectedPerson(null);
                                        setShowNewCheckIn(true);
                                    }
                                }}
                                disabled={inTransit || !!newStopDetected}
                                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                                    inTransit || newStopDetected
                                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                                }`}
                            >
                                <UserPlus className="w-5 h-5" />
                                {inTransit ? 'Check-Ins Paused While In Transit' : newStopDetected ? 'Confirm Location to Check In' : 'Check In New Person'}
                            </button>
                        ) : (
                            <CheckInForm
                                currentStop={currentStop}
                                currentLocation={currentLocation}
                                routeStopId={routeStopId}
                                checkInItems={checkInItems}
                                onOpenItemPicker={() => setShowCheckInItemPicker(true)}
                                onRemoveItem={(itemTypeId) => setCheckInItems(prev => prev.filter(i => i.itemTypeId !== itemTypeId))}
                                onCheckInSuccess={handleCheckInSuccess}
                                onCancel={() => {
                                    setShowNewCheckIn(false);
                                    setCheckInItems([]);
                                }}
                            />
                        )}

                        {/* List Header - Hide when in transit or new stop detected */}
                        {!inTransit && !newStopDetected && (
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <MapPin className="w-4 h-4" />
                                <span>Checked in at this stop ({checkedInPeople.length})</span>
                            </div>
                        )}

                        {/* Checked-in People List - Hide when in transit or new stop detected */}
                        {!inTransit && !newStopDetected && loadingPeople ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                            </div>
                        ) : !inTransit && !newStopDetected && checkedInPeople.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                                <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    No one checked in at this stop yet
                                </p>
                            </div>
                        ) : !inTransit && !newStopDetected && (
                            checkedInPeople.map((person) => (
                                <PersonCard
                                    key={person.id}
                                    person={person}
                                    isExpanded={selectedPerson?.id === person.id}
                                    revealedSsnId={revealedSsnId}
                                    onToggleExpand={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}
                                    onRevealSsn={revealSsn}
                                    onToggleMealServed={() => toggleMealServed(person)}
                                    onUpdateTakeAway={(delta) => updateTakeAwayCount(person, delta)}
                                    onRemoveItem={removeItem}
                                    onAddItems={() => setShowItemPicker(true)}
                                    onDelete={() => setPersonToDelete(person)}
                                />
                            ))
                        )}

                        {/* Refresh Button - Hide when in transit or new stop detected */}
                        {!inTransit && !newStopDetected && checkedInPeople.length > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedPerson(null);
                                    fetchPeople();
                                }}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium"
                            >
                                Refresh List
                            </button>
                        )}
                    </div>

                    {/* Item Picker Modal for existing person */}
                    <ItemPickerModal
                        isOpen={showItemPicker && !!selectedPerson}
                        onClose={() => {
                            setShowItemPicker(false);
                            setPendingItems([]);
                        }}
                        onConfirm={addItemsToPerson}
                        categories={categories}
                        filteredItems={filteredItems}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        getCategoryIcon={getCategoryIcon}
                        getCategoryName={getCategoryName}
                        title="Add Items"
                        subtitle={selectedPerson ? `For ${selectedPerson.firstName}` : undefined}
                        initialItems={pendingItems}
                    />

                    {/* Item Picker Modal for check-in */}
                    <ItemPickerModal
                        isOpen={showCheckInItemPicker}
                        onClose={() => setShowCheckInItemPicker(false)}
                        onConfirm={(items) => {
                            setCheckInItems(items);
                            setShowCheckInItemPicker(false);
                        }}
                        categories={categories}
                        filteredItems={filteredItems}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        getCategoryIcon={getCategoryIcon}
                        getCategoryName={getCategoryName}
                        title="Add Items"
                        subtitle="Tap items to add them"
                        initialItems={checkInItems}
                    />

                    {/* Delete Confirmation Modal */}
                    <DeleteConfirmModal
                        person={personToDelete}
                        isDeleting={deleting}
                        onConfirm={confirmDeleteCheckIn}
                        onCancel={() => setPersonToDelete(null)}
                    />
                </>
            )}
        </div>
    );
}
