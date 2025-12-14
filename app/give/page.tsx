import { Metadata } from "next";
import Link from "next/link";
import { Heart, Gift, Calendar, Building2, ArrowRight, CheckCircle2, Shield, CreditCard, DollarSign, Repeat, Star } from "lucide-react";

export const metadata: Metadata = {
    title: "Give",
    description: "Make a financial gift to Uplift and help transform lives in our community. Your donation provides essential items to families in crisis.",
};

export default function GivePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-rose-400/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Make a <span className="text-gradient">Gift</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Your generosity keeps the vans rolling!
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <a
                                href="https://secure.qgiv.com/for/upliftorganization"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                <Heart className="w-5 h-5" />
                                Make a Donation Now
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 1: Other Ways to Give */}
            <section id="other-ways" className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold mb-6">
                            Other Ways to <span className="text-gradient">Give</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">


                        {/* Donor Advised Funds */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-border/50">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Donor Advised Funds</h3>
                            <p className="text-muted-foreground mb-6">
                                It's easy to give on our site with DAF Pay.
                            </p>
                            <a
                                href="https://app.dafday.com/donate/org_7gxs5bqn039yxsm5qy0qr012ck"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Give via DAF Pay &rarr;
                            </a>
                        </div>

                        {/* Workplace Matching */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-border/50">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Workplace Matching Gifts</h3>
                            <p className="text-muted-foreground mb-6">
                                Many employers match donations. See if your company will match your gift!
                            </p>
                            <a
                                href="https://doublethedonation.com/match/uplift-organization-Xd5pl?mpid="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 font-semibold hover:underline"
                            >
                                Check Matching Eligibility &rarr;
                            </a>
                        </div>

                        {/* Mail a Check */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-border/50">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Mail a Check</h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p className="font-medium text-foreground">Uplift Organization</p>
                                <p>P.O. Box 270175</p>
                                <p>Kansas City, MO 64127</p>
                                <p className="pt-2"><span className="font-medium text-foreground">Payable to:</span> Uplift Organization</p>
                                <p><span className="font-medium text-foreground">EIN:</span> #43-1571915</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Other Questions about Giving */}
            <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-12">Other Questions about Giving?</h2>

                        <div className="grid md:grid-cols-2 gap-8 mb-12 text-left">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                                <ul className="space-y-4">
                                    {[
                                        "Donate stock",
                                        "Donate a Vehicle",
                                        "Donate Bitcoin or other cryptocurrency",
                                        "Name Uplift in your will"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                            <span className="font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                                <p className="text-lg text-muted-foreground mb-4">
                                    For inquiries regarding these giving options, please contact:
                                </p>
                                <a
                                    href="mailto:ross@uplift.org"
                                    className="text-2xl font-bold text-orange-600 hover:underline"
                                >
                                    ross@uplift.org
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Transparency & Financials */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold mb-4">TRANSPARENCY & FINANCIALS</h2>
                    <p className="text-2xl font-light text-muted-foreground mb-8">We believe trust is earned.</p>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
                        We’re proud to show exactly how your gift helps us do the most good with every dollar.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
                        {[2024, 2023, 2022].map((year) => (
                            <div key={year} className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-border/50 hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-bold mb-4">UPLIFT {year} Form 990</h3>
                                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 text-foreground rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-border">
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="max-w-3xl mx-auto text-sm text-muted-foreground border-t border-border pt-8">
                        <p className="mb-2">
                            Uplift Organization, Inc. is a charitable tax-exempt organization under section 501(c)(3) of the Internal Revenue Code.
                        </p>
                        <p className="font-medium">EIN #43-1571915</p>
                    </div>
                </div>
            </section>
        </>
    );
}
