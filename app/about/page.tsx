import { Metadata } from "next";
import { Users, Heart, Truck, Calendar, Mail, Award } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us",
};

export default function AboutPage() {
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
                        <h1 className="text-5xl md:text-6xl font-bold mb-8">
                            About <span className="text-gradient">Uplift</span>
                        </h1>
                        <div className="max-w-3xl">
                            <p className="text-xl md:text-2xl font-light italic text-muted-foreground mb-6">
                                "Vision without action is merely a dream. Action without vision just passes the time. Vision with action can change the world."
                            </p>
                            <p className="text-muted-foreground font-medium">— Joel Barker</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & History */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Our Mission</h2>
                            <div className="prose dark:prose-invert text-lg text-muted-foreground space-y-6">
                                <p>
                                    Uplift Organization is a mobile street outreach for the homeless of Kansas City. Three nights a week, we take four Sprinter vans loaded with food, clothing, and other essential supplies out to the homeless.
                                </p>
                                <p>
                                    We meet them at parks, under bridges, at their camps, or wherever they are. We typically serve 250-400 people each night and we never miss a night!
                                </p>
                                <p>
                                    Uplift believes in the power of unconditional love and kindness. We welcome all people of good will to join us in this work!
                                </p>
                            </div>
                        </div>
                        <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/uplift-photo.jpg"
                                alt="Uplift mobile outreach van"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Our History & Structure</h2>
                        <div className="prose dark:prose-invert text-lg text-muted-foreground space-y-6">
                            <p>
                                Uplift was started 30 years ago in 1990. We are 100% donation-based and run completely by volunteers. Uplift has no paid staff and is not affiliated with any particular church or religious organization.
                            </p>
                            <p>
                                We are not funded by federal, state or local government grants or sponsored by other organizations and/or agencies. Uplift survives by donations and your personal commitment to feed and clothe the area’s homeless.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <Award className="w-5 h-5 flex-shrink-0" />
                                Uplift is a not-for-profit 501 (c)(3) tax exempt homeless outreach.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Board of Directors */}
            <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Board of Directors</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: "Ross Dessert", role: "President" },
                            { name: "Michael Bartkoski", role: "Board Chair" },
                            { name: "Dan Schipfer", role: "Secretary" },
                            { name: "Andre Logan", role: "Treasurer" },
                            { name: "Jim Schmidt", role: "Board Member" },
                            { name: "Rob Oyler", role: "Board Member" },
                        ].map((member, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-border/50 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{member.name}</h3>
                                    <p className="text-sm text-muted-foreground">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Presentations */}
            <section className="py-24 bg-white dark:bg-slate-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-6">Presentations</h2>
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                        Scheduling a presentation is an excellent opportunity for individuals & organizations to learn more about Uplift and the homeless we help. All presentations are audience specific.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-border/50 mb-8">
                        <p className="text-lg mb-6">
                            Get your community, service organization or school involved by sponsoring a donation drive or a canned food drive.
                        </p>
                        <a
                            href="mailto:info@uplift.org"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                        >
                            <Mail className="w-5 h-5" />
                            Schedule a Presentation
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
