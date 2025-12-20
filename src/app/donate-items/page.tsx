import { Metadata } from "next";
import Link from "next/link";
import { Package, MapPin, Clock, CheckCircle2, XCircle, ArrowRight, Truck, Heart, Sparkles, Ban, Shirt, Utensils } from "lucide-react";

export const metadata: Metadata = {
    title: "Donate Items",
    description: "Donate gently-used household items, clothing, and essentials to help families in need. See what we accept, drop-off locations, and hours.",
};

export default function DonateItemsPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            <span className="text-gradient">Donate</span> Items
                        </h1>
                        <p className="text-xl font-semibold text-foreground mb-4">
                            Share clothing and other needed items
                        </p>
                        <p className="text-xl font-semibold text-foreground mb-4">
                            We take them directly to our homeless neighbors
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            When you give, it’s as if you are out on the streets with us bringing meals, supplies, and HOPE to those who need it most right now!
                        </p>
                    </div>
                </div>
            </section>

            {/* Items We Need and Accept */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold mb-6">
                            Items We Need and <span className="text-gradient">Accept</span>
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            The items you share make everything possible.
                        </p>
                    </div>

                    <div className="grid gap-12">
                        {/* Seasonal Clothing */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Shirt className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold">Seasonal Clothing</h3>
                            </div>

                            <div className="prose dark:prose-invert max-w-none mb-6">
                                <p className="font-medium">New clothing or used clothing in good condition</p>
                                <p className="text-sm text-muted-foreground italic">
                                    Guideline: if it is the kind of clothing/footwear that you would wear on a camping trip, it is probably an item we can use.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {[
                                    "Shorts (mens and womens)",
                                    "Jeans and Pants (esp. men’s waist 30-36)",
                                    "T-Shirts (short & long sleeve)",
                                    "Baseball Caps (high need)",
                                    "Winter hats, Beanies, Face Masks",
                                    "Athletic & Winter Socks (high need)",
                                    "Underwear, Bras/Sports Bras (high need)",
                                    "Athletic Shoes / Walking Shoes (high need)",
                                    "Boots good for walking",
                                    "Coats, Jackets, Fleece, Hoodies",
                                    "Flannel Long Sleeve Shirts",
                                    "Sweat Shirts and Sweat Pants",
                                    "Thermals (Long Underwear)",
                                    "Gloves",
                                    "Women’s Underwear (high need)"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                                <p className="font-semibold text-red-800 dark:text-red-200 mb-2">Please Note:</p>
                                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300 text-sm">
                                    <li>We cannot accept any children’s clothing, dresses, dressy clothing, or dress shoes.</li>
                                    <li>Please only donate clothing with functioning zippers/buttons and items that are free of major rips or tears.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Other Categories Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Basic Needs */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 className="text-xl font-bold">Basic Needs</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "Half/Full Gallon Plastic Jugs (juice, water)",
                                        "1-Liter or 2-Liter Plastic Bottles",
                                        "Playing Cards",
                                        "Reading Glasses",
                                        "Matches, lighters",
                                        "Candles (No Glass Please!)",
                                        "Back Packs, Duffel Bags, Wheeled Bags",
                                        "Blankets, Sleeping Bags",
                                        "Plastic Tarps, Tents",
                                        "Hand Warmers",
                                        "Bed Pillows in “good condition”",
                                        "Flashlights, Headlamps",
                                        "Batteries (AAA, AA)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Hygiene Items */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <h3 className="text-xl font-bold">Hygiene Items</h3>
                                </div>
                                <p className="text-sm font-medium mb-4 text-teal-600 dark:text-teal-400">
                                    Travel-sized or “hotel-sized” bottles!
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {[
                                        "Shampoo, Conditioner",
                                        "Toilet Paper",
                                        "Toothbrushes, Toothpaste",
                                        "Deodorant",
                                        "Razors",
                                        "Bar Soap, Body Wash",
                                        "Cough Syrup/Drops",
                                        "Wet Wipes",
                                        "Lotion",
                                        "Bug Wipes or Bug Spray"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-muted-foreground italic border-t pt-4">
                                    Giving the Basics™ generously donates many toiletry items to Uplift and the homeless.
                                </p>
                            </div>

                            {/* Canned Goods */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Utensils className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h3 className="text-xl font-bold">Canned Goods</h3>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 mb-4 text-xs text-orange-800 dark:text-orange-200">
                                    <p className="font-semibold">No expired food. No glass.</p>
                                    <p>“Pop-top” cans are greatly preferred.</p>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "Canned Fruit",
                                        "Tuna",
                                        "Beef Stew",
                                        "Chili",
                                        "Pork & Beans",
                                        "Ravioli",
                                        "Spaghetti",
                                        "Spam",
                                        "Vienna Sausage",
                                        "Canned Soups"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Drop Off Section */}
            <section className="py-24 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-orange-100 dark:border-orange-900/20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                                <MapPin className="w-8 h-8 text-orange-600" />
                                Drop Off Items at Uplift
                            </h2>
                            <p className="text-xl font-medium text-foreground">
                                1516 Prospect Ave. Kansas City MO 64127
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Instructions */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-orange-500" />
                                    Arrival Instructions
                                </h3>
                                <div className="prose dark:prose-invert">
                                    <p>
                                        To drop off donations, please pull up to the white overhead doors off the alley.
                                    </p>
                                    <p className="text-muted-foreground">
                                        If the doors are closed, please honk or knock and we will open them.
                                    </p>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    Drop Off Hours
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center border-b border-border/50 pb-2">
                                        <span className="font-medium">Mondays & Wednesdays</span>
                                        <span>3:00 PM - 6:00 PM</span>
                                    </li>
                                    <li className="flex justify-between items-center border-b border-border/50 pb-2">
                                        <span className="font-medium">Saturdays</span>
                                        <div className="text-right">
                                            <div>9:00 AM - 12:00 PM</div>
                                            <div>2:30 PM - 5:00 PM</div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Amazon Wishlists Section */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="max-w-3xl mx-auto">

                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Donate Items from Amazon
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-6 mb-10">
                            <a
                                href="https://www.amazon.com/hz/wishlist/ls/2MEWAP05EDVZ3?ref_=wl_share"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-border/50 hover:border-orange-500/50 hover:shadow-lg transition-all group"
                            >
                                <span className="font-bold text-lg mb-2 group-hover:text-orange-600 transition-colors">Items Needed All Year Round</span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    View List <ArrowRight className="w-4 h-4" />
                                </span>
                            </a>
                            <a
                                href="https://www.amazon.com/hz/wishlist/ls/340JNY6EAI1IG?ref_=wl_share"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-border/50 hover:border-blue-500/50 hover:shadow-lg transition-all group"
                            >
                                <span className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">Items Needed for Winter</span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    View List <ArrowRight className="w-4 h-4" />
                                </span>
                            </a>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800/30 inline-block text-left">
                            <div className="flex gap-3">
                                <Sparkles className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Important Note regarding shipping:</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        We cannot receive shipments to the warehouse. These wishlists are set up to deliver to a residential address, where they are collected and brought to Uplift.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
