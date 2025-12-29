"use client";

import Link from "next/link";
import {
    BarChart3,
    Users,
    Package,
    MapPin,
    ChevronRight,
    Utensils,
    Shield
} from "lucide-react";

export default function AdminPortalPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                            <Shield className="w-4 h-4" />
                            Admin Portal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Admin Portal
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            View and analyze distribution data across all routes
                        </p>
                    </div>
                </div>
            </section>

            {/* Action Cards */}
            <section className="relative py-12">
                <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="grid gap-6">
                        {/* Distributions Card */}
                        <Link
                            href="/admin-portal/distributions"
                            className="group relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            {/* Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-start gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <BarChart3 className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            Distributions
                                        </h2>
                                        <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-400 mt-2 mb-4">
                                        View distribution data by date. See individuals served, meals distributed, and items given at each stop.
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <Users className="w-3.5 h-3.5" />
                                            People Served
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <Utensils className="w-3.5 h-3.5" />
                                            Meals Count
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <Package className="w-3.5 h-3.5" />
                                            Items Given
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5" />
                                            By Route & Stop
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
