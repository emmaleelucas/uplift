import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, Phone, Users, FileText, ExternalLink } from "lucide-react";
import DownloadRoutesButton from "@/components/download-routes-button";
import Map from "@/components/map-wrapper";
import routesData from "@/routes.json";

export const metadata: Metadata = {
    title: "Get Help",
};

const HUB_COORDINATES: [number, number] = [39.0935, -94.5530];

const ROUTE_STYLES = [
    {
        color: "from-emerald-500 to-teal-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        iconColor: "text-emerald-600",
        hexColor: "#059669",
    },
    {
        color: "from-violet-500 to-purple-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        border: "border-violet-200 dark:border-violet-800",
        iconColor: "text-violet-600",
        hexColor: "#7c3aed",
    },
    {
        color: "from-rose-500 to-red-600",
        bg: "bg-rose-50 dark:bg-rose-900/20",
        border: "border-rose-200 dark:border-rose-800",
        iconColor: "text-rose-600",
        hexColor: "#e11d48",
    },
    {
        color: "from-indigo-500 to-blue-600",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        border: "border-indigo-200 dark:border-indigo-800",
        iconColor: "text-indigo-600",
        hexColor: "#4f46e5",
    }
];

// Merge data from JSON with styles
const VAN_ROUTES = routesData.routes.map((route, index) => ({
    ...route,
    ...ROUTE_STYLES[index],
    stops: route.stops.map(stop => ({
        ...stop,
        coordinates: stop.coordinates as [number, number]
    }))
}));

export default function GetHelpPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 right-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Where to meet the <span className="whitespace-nowrap"><span className="text-gradient">Uplift</span> Vans</span>
                        </h1>
                    </div>
                </div>
            </section>


            {/* Van Routes Section */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex flex-col items-center gap-6 mb-12">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-700 dark:text-orange-300 font-semibold text-lg shadow-sm animate-fade-in">
                            <Clock className="w-5 h-5" />
                            Routes run every Monday, Wednesday, & Saturday • Starts at 6:00 PM
                        </div>

                        <DownloadRoutesButton routes={VAN_ROUTES} />
                    </div>

                    {/* Integrated Map & Route Details */}
                    <Map routes={VAN_ROUTES} hubCoordinates={HUB_COORDINATES} />
                </div>
            </section>

            {/* Other Resources Section */}
            <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Other Resources & Assistance
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Hotline Card */}
                        <div className="flex items-start gap-4 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                                <Phone className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Homelessness Hotline</h3>
                                <p className="text-muted-foreground mb-4">
                                    United Way's 24/7 confidential service for local resources.
                                </p>
                                <a href="tel:211" className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:underline">
                                    Dial 2-1-1
                                </a>
                            </div>
                        </div>

                        {/* Street Sheet Card */}
                        <div className="flex items-start gap-4 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                                <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Street Sheet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Comprehensive list of services and shelters.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <a href="#" className="text-sm font-medium text-yellow-600 hover:underline flex items-center gap-1">
                                        Download in English <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <a href="#" className="text-sm font-medium text-yellow-600 hover:underline flex items-center gap-1">
                                        Download in Spanish <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
