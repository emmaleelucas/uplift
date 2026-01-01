import { createClient } from "@/lib/supabase/client";
import { Category, ItemType } from "@/types/distribution";

const supabase = createClient();

export async function fetchCategories(): Promise<Category[]> {
    const { data } = await supabase
        .from('item_category')
        .select('*')
        .order('name');

    return data || [];
}

export async function fetchItemTypes(): Promise<ItemType[]> {
    const { data } = await supabase
        .from('item_type')
        .select('*')
        .order('name');

    return data || [];
}
