"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";

export function Footer() {
    const [year, setYear] = useState(2025);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">U</span>
                            </div>
                            <span className="text-2xl font-bold">Uplift</span>
                        </div>
                        <p className="text-white/60 mb-6">
                            Delivering care and compassion to those experiencing homelessness in our community.
                        </p>
                    </div>

                    {/* Contact Info - Emails */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
                        <div className="space-y-4 text-white/70">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-medium text-white">General Inquiries</p>
                                    <a href="mailto:info@uplift.org" className="hover:text-orange-400 transition-colors">info@uplift.org</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-white">Volunteer Coordinator</p>
                                    <a href="mailto:volunteer@uplift.org" className="hover:text-orange-400 transition-colors">volunteer@uplift.org</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info - Locations */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6">Locations</h4>
                        <div className="space-y-6 text-white/70">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-medium text-white">Warehouse Address</p>
                                    <p>1516 Prospect Ave.</p>
                                    <p>Kansas City, MO 64127</p>
                                    <p className="text-xs text-white/50 mt-1 italic">
                                        (no parcels/packages here)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-white">Mailing Address</p>
                                    <p>PO Box 270175</p>
                                    <p>Kansas City, MO 64127</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                            {[
                                { href: "/get-help", label: "Get Help" },
                                { href: "/donate-items", label: "Donate Items" },
                                { href: "/volunteer", label: "Volunteer" },
                                { href: "/about", label: "About Us" },
                                { href: "/give", label: "Give" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-white/70 hover:text-orange-400 transition-colors duration-300 flex items-center gap-2"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
                        <p>© {year} Uplift Organization. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <ThemeSwitcher />
                            <p>
                                A 501(c)(3) Non-Profit Organization • EIN: 43-1571915
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
