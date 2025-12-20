import { Metadata } from "next";
import Link from "next/link";
import { Users, Clock, Calendar, CheckCircle2, ArrowRight, Heart, Warehouse, Truck, Package, Award, Mail, Phone, FileText, Utensils } from "lucide-react";

export const metadata: Metadata = {
    title: "Volunteer",
};

export default function VolunteerPage() {
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
                            Ways to get <span className="text-gradient">Involved</span>
                        </h1>
                    </div>
                </div>
            </section>

            {/* Volunteer on Routes */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6 flex items-center gap-3">
                                <Truck className="w-8 h-8 text-blue-600" />
                                Volunteer on our Uplift Routes
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                Help deliver meals, clothing and necessities to the homeless.
                            </p>

                            <div className="space-y-6 mb-8">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-border/50">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        Schedule
                                    </h3>
                                    <ul className="space-y-3 text-sm md:text-base">
                                        <li className="flex justify-between">
                                            <span className="font-medium">Mondays</span>
                                            <span className="text-muted-foreground">Arrive 4:30pm • Leave 6:00pm</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="font-medium">Wednesdays</span>
                                            <span className="text-muted-foreground">Arrive 4:30pm • Leave 6:00pm</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="font-medium">Saturdays</span>
                                            <span className="text-muted-foreground">Arrive 3:30pm • Leave 5:00pm</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex items-start gap-3 text-muted-foreground">
                                    <Clock className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                                    <p>The average route takes 3.5 – 4 hours. Please call in advance to schedule your participation.</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold text-lg mb-2">Volunteer Coordinator</h3>
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-500" />
                                        <span>Amy Cox</span>
                                    </div>
                                    <a href="tel:913-731-6046" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                                        <Phone className="w-5 h-5 text-blue-500" />
                                        913-731-6046
                                    </a>
                                    <a href="mailto:volunteer@uplift.org" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                        volunteer@uplift.org
                                    </a>
                                </div>
                            </div>

                            <a
                                href="/uplift-route-volunteer-info-sheet.pdf"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <FileText className="w-4 h-4" />
                                Volunteer Info Sheet
                            </a>
                        </div>
                        <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/uplift-route-1.jpg"
                                alt="Volunteers loading Uplift van"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Prepare Meals */}
            <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 grid gap-4">
                            <div className="relative h-[250px] rounded-2xl overflow-hidden shadow-lg -rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="/uplift-prepare-meals-1.jpg"
                                    alt="Volunteers cooking meals"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <div className="relative h-[250px] rounded-2xl overflow-hidden shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500 ml-8">
                                <img
                                    src="/uplift-prepare-meals-2.jpg"
                                    alt="Volunteers packaging meals"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl font-bold mb-6 flex items-center gap-3">
                                <Utensils className="w-8 h-8 text-orange-600" />
                                Prepare Meals
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                Cooks prepare and deliver meals to Uplift for approximately 60 people.
                            </p>

                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-border/50">
                                <h3 className="font-bold text-lg mb-4">To learn more</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cook Coordinator</p>
                                            <p className="font-semibold">Mary Green</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-2 border-t border-border/50">
                                        <a href="tel:913-645-5739" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                                            <Phone className="w-5 h-5 text-orange-500" />
                                            913-645-5739
                                        </a>
                                        <a href="mailto:mary.green@uplift.org" className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                                            <Mail className="w-5 h-5 text-orange-500" />
                                            mary.green@uplift.org
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Warehouse Sort */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6 flex items-center gap-3">
                                <Warehouse className="w-8 h-8 text-purple-600" />
                                Warehouse Sort Sessions
                            </h2>

                            <div className="flex items-center gap-3 mb-8 text-xl font-medium">
                                <Clock className="w-6 h-6 text-purple-500" />
                                Saturdays 9:00 AM - 11:30 AM
                            </div>

                            <p className="text-xl text-muted-foreground mb-8">
                                Click the link for available dates and online sign up.
                            </p>

                            <a
                                href="https://signup.com/client/invitation2/secure/616986332041412096/false#/invitation"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 hover:scale-105"
                            >
                                SIGN UP
                                <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>
                        <div className="grid gap-4">
                            <div className="relative h-[250px] rounded-2xl overflow-hidden shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="/uplift-sort-1.jpg"
                                    alt="Volunteers sorting donations"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <div className="relative h-[250px] rounded-2xl overflow-hidden shadow-lg -rotate-2 hover:rotate-0 transition-transform duration-500 ml-8">
                                <img
                                    src="/uplift-sort-2.jpg"
                                    alt="Warehouse organization"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
