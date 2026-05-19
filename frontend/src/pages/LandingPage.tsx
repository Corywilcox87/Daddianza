import { Link } from 'react-router-dom';
import {
  TrophyIcon,
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

// ─── Feature Cards ────────────────────────────────────────────────────────────

const features = [
  {
    icon: CalendarDaysIcon,
    title: 'CFA Show Tracker',
    description:
      'Manage your full show calendar — track entry deadlines, judge assignments, ring counts, and show status from one unified dashboard.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: TrophyIcon,
    title: 'Cat Registry',
    description:
      'Maintain detailed profiles for every cat: CFA registration numbers, breed, titles, ownership history, and full show entry records.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: UsersIcon,
    title: 'Exhibitor Portal',
    description:
      'Give your exhibitors a dedicated self-service portal to browse shows, submit entries, view results, and manage their cats — all without contacting you.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: BuildingOffice2Icon,
    title: 'CRM Pipeline',
    description:
      'Track leads, contacts, and opportunities through a visual pipeline. Convert prospects into active exhibitors with built-in CRM workflows.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: SparklesIcon,
    title: 'Multi-Exhibitor Platform',
    description:
      'Run a full multi-tenant SaaS operation. Each cattery or club gets its own isolated workspace with their own data, branding, and portal.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: ChartBarIcon,
    title: 'Results & Analytics',
    description:
      'Record placements, points, finals, and awards. Generate beautiful reports and give exhibitors a complete history of their competitive record.',
    color: 'bg-rose-100 text-rose-600',
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'Perfect for small catteries just getting started.',
    features: [
      'Up to 25 cats',
      'Up to 10 shows/year',
      'Exhibitor portal (up to 10 users)',
      'Entry management',
      'Basic results tracking',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/mo',
    description: 'For active catteries and show clubs managing regular events.',
    features: [
      'Unlimited cats',
      'Unlimited shows',
      'Exhibitor portal (up to 100 users)',
      'Full CRM pipeline',
      'Advanced analytics & reports',
      'Priority email & chat support',
      'Custom branding',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    description: 'For large show organizations managing multiple clubs and regions.',
    features: [
      'Everything in Professional',
      'Unlimited portal users',
      'Multi-region / multi-club support',
      'Dedicated account manager',
      'Custom integrations',
      'SLA-backed uptime guarantee',
      'White-label options',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    name: 'Margaret Holloway',
    role: 'Show Secretary, Heartland CFA Club',
    avatar: 'MH',
    color: 'bg-blue-600',
    quote:
      'Daddianza has completely transformed how we run our show. Entry management used to take days — now it takes hours. Our exhibitors love the self-service portal.',
  },
  {
    name: 'James Tran',
    role: 'Breeder & Exhibitor, Silvermist Persians',
    avatar: 'JT',
    color: 'bg-amber-600',
    quote:
      'Finally a tool built specifically for CFA exhibitors. I can see all my cats\' results and upcoming entries at a glance. The points tracking is incredibly accurate.',
  },
  {
    name: 'Diane Kossack',
    role: 'Owner, Kossack Maine Coon Cattery',
    avatar: 'DK',
    color: 'bg-green-600',
    quote:
      'The CRM pipeline helped us grow our waitlist from 5 families to over 40 in one year. Having everything in one place — cats, contacts, shows — is a game changer.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Daddianza</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-white text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 pt-28 pb-24 sm:pt-36 sm:pb-32">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-16 w-80 h-80 bg-brand-500/20 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <SparklesIcon className="w-4 h-4 text-brand-200" />
            <span className="text-sm text-brand-100 font-medium">
              Built exclusively for CFA show exhibitors
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            The Ultimate CFA Show Tracker &amp; CRM for Cat Exhibitors
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-brand-200 max-w-2xl mx-auto leading-relaxed">
            Manage your cattery, track show entries, record results, and grow your exhibitor community — all in one platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-700 font-semibold rounded-xl text-base hover:bg-brand-50 transition-colors shadow-lg"
            >
              Start Free Trial
              <span className="text-brand-400 font-normal text-sm ml-1">— 14 days, no card</span>
            </Link>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-xl text-base hover:bg-white/20 transition-colors"
            >
              View Demo
            </button>
          </div>

          {/* Social proof numbers */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-sm mx-auto sm:max-w-md">
            {[
              { value: '500+', label: 'Exhibitors' },
              { value: '12k+', label: 'Show Entries' },
              { value: '98%', label: 'Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-brand-300 mt-0.5 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to run your cattery
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From first contact to championship ribbon — Daddianza CRM covers every step of your CFA show journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Start free for 14 days. No credit card required. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-brand-600 border-brand-600 shadow-xl shadow-brand-200 scale-105 relative'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                      <StarIcon className="w-3.5 h-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'bg-white/20' : 'bg-brand-100'
                      }`}>
                        <CheckIcon className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-brand-600'}`} />
                      </div>
                      <span className={`text-sm ${plan.highlighted ? 'text-brand-100' : 'text-gray-600'}`}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.name === 'Enterprise' ? (
                  <a
                    href="mailto:sales@daddianza.com"
                    className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.highlighted
                        ? 'bg-white text-brand-700 hover:bg-brand-50'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to="/register"
                    className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.highlighted
                        ? 'bg-white text-brand-700 hover:bg-brand-50'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Loved by exhibitors &amp; show secretaries
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Join hundreds of CFA exhibitors who have simplified their show management with Daddianza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <blockquote className="text-sm text-gray-600 leading-relaxed mb-6">
                  "{t.quote}"
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your show management?
          </h2>
          <p className="text-brand-200 text-lg mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-700 font-semibold rounded-xl text-base hover:bg-brand-50 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/portal/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-xl text-base hover:bg-white/20 transition-colors"
            >
              Exhibitor Portal Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Daddianza CRM</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              <Link to="/portal/login" className="hover:text-white transition-colors">Exhibitor Portal</Link>
              <a href="mailto:support@daddianza.com" className="hover:text-white transition-colors">Support</a>
            </div>

            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Daddianza CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
