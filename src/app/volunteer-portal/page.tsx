"use client";

import Link from "next/link";
import {
    ClipboardList,
    Users,
    Package,
    MapPin,
    ChevronRight,
    Utensils,
    Heart
} from "lucide-react";

export default function VolunteerActionsPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-700 dark:text-orange-300 text-sm font-medium mb-6">
                            <Heart className="w-4 h-4" />
                            Volunteer Portal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Volunteer Portal
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Tools to help you serve our community with care and compassion
                        </p>
                    </div>
                </div>
            </section>

            {/* Action Cards */}
            <section className="relative py-12">
                <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="grid gap-6">
                    {/* Distributing Card */}
                    <Link
                        href="/volunteer-portal/distributing"
                        className="group relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative flex items-start gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <ClipboardList className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        Distributing
                                    </h2>
                                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-4">
                                    Log distributions as you serve people at each stop. Record names, items given, meals served, and more.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Users className="w-3.5 h-3.5" />
                                        Track People
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Package className="w-3.5 h-3.5" />
                                        Log Items
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Utensils className="w-3.5 h-3.5" />
                                        Record Meals
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-3.5 h-3.5" />
                                        Auto-Location
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
            </section>
        </div>
    );
}
