"use client";

import { useState } from "react";
import {
    ChevronDown, ChevronRight, Utensils, Package, Plus, Minus, X, Trash2
} from "lucide-react";
import { CheckedInPerson } from "@/types/distribution";

interface PersonCardProps {
    person: CheckedInPerson;
    isExpanded: boolean;
    revealedSsnId: string | null;
    onToggleExpand: () => void;
    onRevealSsn: (personId: string) => void;
    onToggleMealServed: () => void;
    onUpdateTakeAway: (delta: number) => void;
    onRemoveItem: (itemId: string) => void;
    onAddItems: () => void;
    onDelete: () => void;
}

export function PersonCard({
    person,
    isExpanded,
    revealedSsnId,
    onToggleExpand,
    onRevealSsn,
    onToggleMealServed,
    onUpdateTakeAway,
    onRemoveItem,
    onAddItems,
    onDelete,
}: PersonCardProps) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Person Header */}
            <button
                onClick={onToggleExpand}
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
                                    onRevealSsn(person.id);
                                }}
                                className={`text-xs px-2 py-0.5 rounded-full font-mono transition-all cursor-pointer ${
                                    revealedSsnId === person.id
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
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Utensils className="w-3 h-3" />
                                Meal
                            </span>
                        )}
                        {person.mealsTakeAway > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Package className="w-3 h-3" />
                                {person.mealsTakeAway} take away meal{person.mealsTakeAway !== 1 ? 's' : ''}
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
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                    {/* Meal Served Toggle */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Utensils className="w-5 h-5 text-slate-500" />
                                <span className="font-medium text-slate-900 dark:text-white">Meal Served</span>
                            </div>
                            <button
                                onClick={onToggleMealServed}
                                className={`w-14 h-8 rounded-full transition-colors relative ${
                                    person.mealServed ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
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
                                onClick={() => onUpdateTakeAway(1)}
                                className="mt-3 text-sm text-blue-500 hover:text-blue-600"
                            >
                                + Add take away meals
                            </button>
                        ) : (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Take Away</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onUpdateTakeAway(-1)}
                                        disabled={person.mealsTakeAway === 0}
                                        className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center disabled:opacity-50"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white w-6 text-center">
                                        {person.mealsTakeAway}
                                    </span>
                                    <button
                                        onClick={() => onUpdateTakeAway(1)}
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
                                            onClick={() => onRemoveItem(item.id)}
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
                        onClick={onAddItems}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Items
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={onDelete}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        Remove Check-In
                    </button>
                </div>
            )}
        </div>
    );
}
