"use client";

import { useState, useEffect, useMemo } from "react";
import { Category, ItemType, SelectedItem } from "@/types/distribution";
import { fetchCategories, fetchItemTypes } from "@/db/actions";
import { Shirt, Sparkles, Apple, Bed, Package, LucideIcon } from "lucide-react";

interface CategoryIconConfig {
    icon: LucideIcon;
    color: string;
    bg: string;
}

export function useItems() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [itemSearch, setItemSearch] = useState("");

    // Fetch categories and item types
    useEffect(() => {
        const loadData = async () => {
            const [cats, items] = await Promise.all([
                fetchCategories(),
                fetchItemTypes()
            ]);
            setCategories(cats);
            setItemTypes(items);
        };
        loadData();
    }, []);

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

    // Get category name by ID
    const getCategoryName = (itemCategoryId: string): string => {
        return categories.find(c => c.id === itemCategoryId)?.name || "Unknown";
    };

    // Get category icon configuration
    const getCategoryIcon = (categoryName: string): CategoryIconConfig => {
        const name = categoryName.toLowerCase();
        if (name.includes('clothing') || name.includes('clothes')) {
            return { icon: Shirt, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
        }
        if (name.includes('hygiene') || name.includes('toiletries')) {
            return { icon: Sparkles, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
        }
        if (name.includes('food') || name.includes('meal')) {
            return { icon: Apple, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
        }
        if (name.includes('blanket') || name.includes('bedding') || name.includes('sleeping')) {
            return { icon: Bed, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
        }
        return { icon: Package, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
    };

    // Create a selected item from an item type
    const createSelectedItem = (item: ItemType): SelectedItem => ({
        itemTypeId: item.id,
        name: item.name,
        category: getCategoryName(item.item_category_id),
        quantity: 1
    });

    return {
        categories,
        itemTypes,
        selectedCategory,
        setSelectedCategory,
        itemSearch,
        setItemSearch,
        filteredItems,
        getCategoryName,
        getCategoryIcon,
        createSelectedItem,
    };
}
