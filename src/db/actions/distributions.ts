import { createClient } from "@/lib/supabase/client";
import {
    CheckedInPerson,
    DistributionItem,
    Coordinates,
} from "@/types/distribution";

const supabase = createClient();

// ==========================================
// FETCH OPERATIONS
// ==========================================

export async function fetchCheckedInPeopleAtStop(stopId: string): Promise<CheckedInPerson[]> {
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
        .eq('route_stop_id', stopId)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

    if (!distributions) return [];

    const personMap = new Map<string, CheckedInPerson>();

    for (const dist of distributions) {
        const person = dist.homeless_person as unknown as {
            id: string;
            first_name: string;
            last_name: string | null;
            ssn_last4_hash: string | null;
        };

        const items = await fetchDistributionItems(dist.id);

        if (personMap.has(person.id)) {
            const existing = personMap.get(person.id)!;
            existing.distributionIds.push(dist.id);
            existing.mealServed = existing.mealServed || dist.meal_served;
            existing.mealsTakeAway += (dist.meals_take_away || 0);
            existing.items.push(...items);
        } else {
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

    return Array.from(personMap.values())
        .sort((a, b) => a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase()));
}

export async function fetchDistributionItems(distributionId: string): Promise<DistributionItem[]> {
    const { data: distItems } = await supabase
        .from('distribution_item')
        .select(`
            id,
            quantity,
            item_type_id,
            item_type:item_type_id (name)
        `)
        .eq('distribution_id', distributionId);

    return (distItems || []).map((item: unknown) => {
        const typedItem = item as {
            id: string;
            quantity: number;
            item_type_id: string;
            item_type: { name: string } | null;
        };
        return {
            id: typedItem.id,
            itemTypeId: typedItem.item_type_id,
            name: typedItem.item_type?.name || 'Unknown',
            quantity: typedItem.quantity
        };
    });
}

// ==========================================
// PERSON OPERATIONS
// ==========================================

interface PersonMatch {
    id: string;
    first_name: string;
    last_name: string | null;
    ssn_last4_hash: string | null;
}

export async function findExistingPerson(
    firstName: string,
    lastName: string | null,
    ssnHash: string | null
): Promise<PersonMatch | null> {
    let query = supabase
        .from('homeless_person')
        .select('id, first_name, last_name, ssn_last4_hash')
        .ilike('first_name', firstName.toLowerCase());

    if (lastName) {
        query = query.ilike('last_name', lastName.toLowerCase());
    }

    if (ssnHash) {
        query = query.eq('ssn_last4_hash', ssnHash);
    }

    const { data: persons } = await query;

    if (!persons || persons.length === 0) return null;

    // Find best match
    return persons.find(p => {
        const firstMatch = p.first_name.toLowerCase() === firstName.toLowerCase();
        const lastMatch = !lastName || (p.last_name?.toLowerCase() === lastName.toLowerCase());
        const ssnMatch = !ssnHash || p.ssn_last4_hash === ssnHash;
        return firstMatch && lastMatch && ssnMatch;
    }) || persons[0];
}

export async function checkIfPersonCheckedInToday(personId: string): Promise<{
    checkedIn: boolean;
    mealServed: boolean;
    mealsTakeAway: number;
    stopName?: string;
    routeName?: string;
    distributionIds: string[];
} | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayDist } = await supabase
        .from('distribution')
        .select('id, meal_served, meals_take_away, route_stop_id, route_stop:route_stop_id(name, route:route_id(name))')
        .eq('homeless_person_id', personId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

    if (!todayDist || todayDist.length === 0) return null;

    const mealServed = todayDist.some(d => d.meal_served);
    const mealsTakeAway = todayDist.reduce((sum, d) => sum + (d.meals_take_away || 0), 0);

    const recentDist = todayDist[0] as unknown as {
        id: string;
        meal_served: boolean;
        meals_take_away: number;
        route_stop_id: string | null;
        route_stop: { name: string; route: { name: string } | null } | null;
    };

    return {
        checkedIn: true,
        mealServed,
        mealsTakeAway,
        stopName: recentDist.route_stop?.name,
        routeName: recentDist.route_stop?.route?.name,
        distributionIds: todayDist.map(d => d.id),
    };
}

export async function createPerson(
    firstName: string,
    lastName: string | null,
    ssnHash: string | null,
    isIdentifiable: boolean
): Promise<string | null> {
    const { data: newPerson, error } = await supabase
        .from('homeless_person')
        .insert({
            first_name: firstName,
            last_name: lastName,
            ssn_last4_hash: ssnHash,
            is_identifiable: isIdentifiable
        })
        .select('id')
        .single();

    if (error || !newPerson) return null;
    return newPerson.id;
}

// ==========================================
// CREATE OPERATIONS
// ==========================================

export async function createDistribution(
    personId: string,
    mealServed: boolean,
    mealsTakeAway: number,
    location: Coordinates | null,
    routeStopId: string | null
): Promise<string | null> {
    const { data: distRecord, error } = await supabase
        .from('distribution')
        .insert({
            homeless_person_id: personId,
            meal_served: mealServed,
            meals_take_away: mealsTakeAway,
            latitude: location?.lat ?? null,
            longitude: location?.lng ?? null,
            route_stop_id: routeStopId,
        })
        .select('id')
        .single();

    if (error || !distRecord) return null;
    return distRecord.id;
}

export async function addDistributionItem(
    distributionId: string,
    itemTypeId: string,
    quantity: number
): Promise<string | null> {
    const { data: insertedItem, error } = await supabase
        .from('distribution_item')
        .insert({
            distribution_id: distributionId,
            item_type_id: itemTypeId,
            quantity
        })
        .select('id')
        .single();

    if (error || !insertedItem) return null;
    return insertedItem.id;
}

// ==========================================
// UPDATE OPERATIONS
// ==========================================

export async function updateMealServed(distributionId: string, mealServed: boolean): Promise<void> {
    await supabase
        .from('distribution')
        .update({ meal_served: mealServed })
        .eq('id', distributionId);
}

export async function updateMealsTakeAway(distributionId: string, mealsTakeAway: number): Promise<void> {
    await supabase
        .from('distribution')
        .update({ meals_take_away: mealsTakeAway })
        .eq('id', distributionId);
}

// ==========================================
// DELETE OPERATIONS
// ==========================================

export async function deleteDistributionItem(itemId: string): Promise<void> {
    await supabase
        .from('distribution_item')
        .delete()
        .eq('id', itemId);
}

export async function deleteDistribution(distributionId: string): Promise<void> {
    // First delete any distribution items
    await supabase
        .from('distribution_item')
        .delete()
        .eq('distribution_id', distributionId);

    // Then delete the distribution record
    await supabase
        .from('distribution')
        .delete()
        .eq('id', distributionId);
}

export async function deletePersonCheckIns(distributionIds: string[]): Promise<void> {
    for (const distId of distributionIds) {
        await deleteDistribution(distId);
    }
}
