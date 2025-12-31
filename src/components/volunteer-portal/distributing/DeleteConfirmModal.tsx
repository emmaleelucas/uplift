"use client";

import { Trash2, Loader2 } from "lucide-react";
import { CheckedInPerson } from "@/types/distribution";

interface DeleteConfirmModalProps {
    person: CheckedInPerson | null;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmModal({ person, isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) {
    if (!person) return null;

    return (
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
                        Are you sure you want to remove <span className="font-semibold">{person.firstName}</span> from today&apos;s check-ins? This will delete their distribution record.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isDeleting ? (
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
    );
}
