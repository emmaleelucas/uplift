import { Metadata } from "next";
import { MapPin, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Contact Uplift Organization for donations, volunteering, or general inquiries. Find our warehouse location and mailing address.",
};

export default function ContactPage() {
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
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Contact <span className="text-gradient">Us</span>
                        </h1>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Top Photo */}
                    <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl h-[300px] relative">
                        <img
                            src="/uplift-photo.jpg"
                            alt="Uplift Warehouse Exterior"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Warehouse Info & Map */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-emerald-600" />
                                Uplift Warehouse
                            </h2>
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-border/50 mb-6">
                                <p className="text-lg font-medium mb-1">1516 Prospect Ave.</p>
                                <p className="text-lg font-medium mb-3">Kansas City, MO 64127</p>
                                <p className="text-sm text-muted-foreground italic mb-4">
                                    (please do not ship parcels or packages to the warehouse)
                                </p>
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium">
                                    To drop off donations, please pull up to the white overhead doors off the alley. If the doors are closed, please honk or knock and we will open them.
                                </div>
                            </div>

                            {/* Map */}
                            <div className="rounded-3xl overflow-hidden shadow-lg border border-border/50 h-[350px]">
                                <iframe
                                    src="https://maps.google.com/maps?q=1516+Prospect+Ave,+Kansas+City,+MO+64127&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Uplift Warehouse Location"
                                />
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Mail className="w-6 h-6 text-blue-600" />
                                Contact Information
                            </h2>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-border/50 space-y-8">
                                {/* Emails */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Email</h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="font-medium">Volunteer Coordinator</span>
                                            <a href="mailto:volunteer@uplift.org" className="text-blue-600 hover:underline">volunteer@uplift.org</a>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="font-medium">General Inquiries</span>
                                            <a href="mailto:info@uplift.org" className="text-blue-600 hover:underline">info@uplift.org</a>
                                        </div>
                                    </div>
                                </div>

                                {/* Mailing Address */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Mailing Address
                                    </h3>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        <p className="font-medium">PO Box 270175</p>
                                        <p className="font-medium">Kansas City, MO 64127</p>
                                    </div>
                                </div>

                                {/* EIN */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Organization Info</h3>
                                    <p className="text-lg font-medium">EIN #43-1571915</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
}
