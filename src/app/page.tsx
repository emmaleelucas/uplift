import Link from "next/link";
import Image from "next/image";
import { Heart, Users, Package, HandHeart, ArrowRight, MapPin, Clock, Phone, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-12 items-center">
            <div className="animate-fade-in">

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Delivering {" "}
                <br />
                <span className="text-gradient">care </span>
                and {" "} <span className="text-gradient">compassion</span>
                <br />
                to the homeless
              </h1>

              {/* Mission Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-border/50 max-w-xl">
                <h3 className="text-lg font-bold text-gradient mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-orange-500" />
                  Our Mission
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  "We who acknowledge God's providence and fidelity to his people, especially those in poverty, do dedicate our efforts toward the support of those who are homeless. Our goal is to deliver those basic human needs, care and compassion that are not usually received from other organizations."
                </p>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative animate-scale-in hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main Card */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl shadow-2xl transform rotate-3" />
                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                  <Image
                    src="/uplift_home_page.jpg"
                    alt="Uplift helping the community"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Why It's Important",
                description: "There are many reasons to be involved with Uplift but one of the essential reasons is that every life is valuable.",
                color: "from-orange-500 to-amber-500",
                href: "/about",
              },
              {
                icon: HandHeart,
                title: "Ways We Help",
                description: "Many needs are met including providing basic needs and compassion, assisting Vets, aiding pets, looking out for children and more.",
                color: "from-amber-500 to-yellow-500",
                href: "/give",
              },
              {
                icon: Users,
                title: "Get Involved",
                description: "Find out how you can help. There are many ways for groups to get engaged such as Boy Scouts, Church small groups, School clubs and associations.",
                color: "from-yellow-500 to-orange-500",
                href: "/volunteer",
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-card rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 card-hover border border-border/50"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                <div className="flex items-center text-primary font-medium text-sm">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
