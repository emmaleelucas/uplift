"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, Check } from "lucide-react";
import { Category, ItemType, SelectedItem } from "@/types/distribution";

interface ItemPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (items: SelectedItem[]) => void;
    categories: Category[];
    filteredItems: ItemType[];
    selectedCategory: string | null;
    setSelectedCategory: (category: string | null) => void;
    getCategoryIcon: (categoryName: string) => { icon: React.ComponentType<{ className?: string }>; color: string; bg: string };
    getCategoryName: (itemCategoryId: string) => string;
    title: string;
    subtitle?: string;
    initialItems?: SelectedItem[];
}

export function ItemPickerModal({
    isOpen,
    onClose,
    onConfirm,
    categories,
    filteredItems,
    selectedCategory,
    setSelectedCategory,
    getCategoryIcon,
    getCategoryName,
    title,
    subtitle,
    initialItems = [],
}: ItemPickerModalProps) {
    const [tempItems, setTempItems] = useState<SelectedItem[]>(initialItems);

    // Reset temp items when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempItems(initialItems);
        }
    }, [isOpen, initialItems]);

    if (!isOpen) return null;

    const toggleItem = (item: ItemType) => {
        const existing = tempItems.find(i => i.itemTypeId === item.id);
        if (existing) {
            setTempItems(tempItems.filter(i => i.itemTypeId !== item.id));
        } else {
            setTempItems([...tempItems, {
                itemTypeId: item.id,
                name: item.name,
                category: getCategoryName(item.item_category_id),
                quantity: 1
            }]);
        }
    };

    const handleClose = () => {
        setSelectedCategory(null);
        onClose();
    };

    const handleConfirm = () => {
        onConfirm(tempItems);
        setSelectedCategory(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Items Preview */}
                {tempItems.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            {initialItems.length > 0 ? 'Items to add:' : 'Selected items:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tempItems.map(item => (
                                <span
                                    key={item.itemTypeId}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm rounded-lg border border-blue-200 dark:border-blue-700"
                                >
                                    {item.name}
                                    <button
                                        onClick={() => setTempItems(prev => prev.filter(i => i.itemTypeId !== item.itemTypeId))}
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
                                            <span className="font-medium text-slate-900 dark:text-white text-sm text-center">
                                                {cat.name}
                                            </span>
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
                                    const isSelected = tempItems.some(i => i.itemTypeId === item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItem(item)}
                                            className={`p-3 rounded-xl text-left transition-colors relative ${
                                                isSelected
                                                    ? 'bg-blue-100 dark:bg-blue-900/40 outline outline-2 outline-blue-500'
                                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                            }`}
                                        >
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                {item.name}
                                            </span>
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

                {/* Confirm Button */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold"
                    >
                        {tempItems.length > 0
                            ? `Done (${tempItems.length} item${tempItems.length !== 1 ? 's' : ''})`
                            : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
}
