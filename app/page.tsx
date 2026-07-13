import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { MountainLogo, MountainScene } from "@/components/illustrations/Mountain";
import {
  UsersIcon,
  VoteIcon,
  WalletIcon,
  CalendarIcon,
  SplitIcon,
  MapPinIcon,
  GlobeIcon,
  StarIcon,
  LeafIcon,
  ArrowRightIcon,
} from "@/components/icons";

const FEATURES = [
  {
    title: "Invite Friends",
    description: "Create a trip and invite your favorite people.",
    icon: UsersIcon,
  },
  {
    title: "Vote Together",
    description: "Vote on destinations, dates, and activities.",
    icon: VoteIcon,
  },
  {
    title: "Manage Budget",
    description: "Set a budget, track expenses, stay on track.",
    icon: WalletIcon,
  },
  {
    title: "Plan Itinerary",
    description: "Build the perfect itinerary everyone will enjoy.",
    icon: CalendarIcon,
  },
  {
    title: "Split Expenses",
    description: "Easily split costs and settle up with friends.",
    icon: SplitIcon,
  },
];

const TRIP_AVATARS = [
  { initials: "JM", from: "from-sage-400", to: "to-sage-600" },
  { initials: "AL", from: "from-sage-300", to: "to-sage-500" },
  { initials: "RK", from: "from-sage-500", to: "to-sage-700" },
  { initials: "SP", from: "from-sage-200", to: "to-sage-400" },
];

export default async function Home() {
  const session = await getServerSession();
  if (session) redirect("/trips");

  return (
    <div className="flex flex-1 flex-col bg-sage-50">
      <SiteHeader />
      <Hero />
      <FeatureStrip />
      <BottomBar />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-sage-200/70 bg-sage-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <MountainLogo className="h-11 w-11 shrink-0" />
          <span className="leading-tight">
            <span className="block font-serif text-xl font-bold text-sage-900">
              Group Trip
            </span>
            <span className="block text-[11px] font-medium tracking-[0.35em] text-sage-600">
              PLANNER
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-sage-800 md:flex">
          <a href="#features" className="hover:text-sage-900">
            Features
          </a>
          <a href="#features" className="hover:text-sage-900">
            How It Works
          </a>
          <a href="#about" className="hover:text-sage-900">
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-900 transition-colors hover:bg-sage-100"
          >
            Log In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-sage-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-900"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-sage-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-sage-300/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-sage-900 md:text-6xl">
            Make it out of
            <br />
            the group chat.
          </h1>

          <div className="mt-4 flex items-center gap-1 text-sage-500">
            <LeafIcon className="h-5 w-5 -rotate-12" />
            <LeafIcon className="h-5 w-5 rotate-12" />
          </div>

          <p className="mt-5 max-w-md text-base leading-relaxed text-sage-700">
            The all-in-one app to plan trips with friends. Vote, budget,
            organize, and create memories&mdash;together.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-full bg-sage-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-900"
            >
              <UsersIcon className="h-4 w-4" />
              Create a Trip
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-full border border-sage-300 bg-white px-6 py-3 text-sm font-semibold text-sage-900 transition-colors hover:bg-sage-100"
            >
              <ArrowRightIcon className="h-4 w-4" />
              Join a Trip
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-lg">
          <div className="aspect-square w-full overflow-hidden rounded-full ring-8 ring-white/60">
            <MountainScene className="h-full w-full" />
          </div>

          <div className="absolute -bottom-10 left-1/2 w-72 -translate-x-1/2 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:-bottom-6 sm:left-auto sm:right-0 sm:translate-x-0">
            <div className="flex items-center gap-1.5 font-handwritten text-base text-sage-600">
              <MapPinIcon className="h-4 w-4" />
              Next Adventure
            </div>
            <p className="mt-1 font-serif text-lg font-semibold text-sage-900">
              Rocky Mountain Escape
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-sage-600">
              <CalendarIcon className="h-4 w-4" />
              Aug 24 &ndash; Aug 30, 2026
            </p>

            <div className="mt-3 flex items-center">
              <div className="flex -space-x-2.5">
                {TRIP_AVATARS.map((avatar) => (
                  <div
                    key={avatar.initials}
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${avatar.from} ${avatar.to} text-[11px] font-semibold text-white ring-2 ring-white`}
                  >
                    {avatar.initials}
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-900 text-[11px] font-semibold text-white ring-2 ring-white">
                  +3
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-sage-600">
                <span>trip planning progress</span>
                <span className="font-semibold text-sage-900">72%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-sage-100">
                <div className="h-2 rounded-full bg-sage-700" style={{ width: "72%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 pb-16">
      <div className="grid grid-cols-2 gap-8 rounded-3xl border border-sage-200 bg-white/70 px-6 py-10 sm:grid-cols-3 lg:grid-cols-5">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
              <feature.icon className="h-7 w-7 text-sage-700" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-sage-900">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-sage-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomBar() {
  return (
    <section id="about" className="border-t border-sage-200 bg-sage-100/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-6 py-8">
        <div className="flex items-center gap-3">
          <LeafIcon className="h-6 w-6 text-sage-600" />
          <span className="font-handwritten text-2xl leading-tight text-sage-800">
            Good plans,
            <br />
            great memories.
          </span>
        </div>

        <div className="flex items-center gap-3 text-sage-800">
          <UsersIcon className="h-6 w-6 text-sage-600" />
          <div className="leading-tight">
            <p className="font-semibold text-sage-900">50K+</p>
            <p className="text-xs text-sage-600">Trips Planned</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sage-800">
          <GlobeIcon className="h-6 w-6 text-sage-600" />
          <div className="leading-tight">
            <p className="font-semibold text-sage-900">120+</p>
            <p className="text-xs text-sage-600">Countries Explored</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sage-800">
          <StarIcon className="h-6 w-6 text-sage-600" />
          <div className="leading-tight">
            <p className="font-semibold text-sage-900">4.8</p>
            <p className="text-xs text-sage-600">App Store Rating</p>
          </div>
        </div>

        <Link
          href="/sign-up"
          className="flex items-center gap-2 rounded-full bg-sage-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-900"
        >
          Start Planning Today
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

