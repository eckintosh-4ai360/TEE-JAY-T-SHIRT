import Link from 'next/link'
import { Printer, Camera, ArrowRight, CheckCircle, Clock, Star, Zap } from 'lucide-react'

export const metadata = {
  title: 'Tee-Jay — Professional Printing & Photography Services',
  description: 'Premium printing (T-shirts, logos, posters, flyers) and photography (weddings, birthdays, graduations). Book online and track your order instantly.',
}

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative text-center pt-12 pb-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/10 blur-3xl" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 mb-6">
          <Star className="h-3 w-3" /> Professional Quality · Fast Delivery
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-tight">
          Your Trusted Partner in<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">Printing & Photography</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          From custom T-shirts to stunning event photography — Tee-Jay delivers premium quality on time, every time. Book your service today and track your order in real-time.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/book"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all duration-200">
            Book a Service <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/track"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:border-teal-300 hover:text-teal-600 transition-all dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-500/40">
            Track My Order
          </Link>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Our Services</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Choose the service that fits your needs</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Printing */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-white/10 dark:bg-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg mb-5">
                <Printer className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Printing Services</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">High-quality printing on demand for all your needs</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {['T-Shirts', 'Logos', 'Posters', 'Flyers'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <Link href="/book?service=printing"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500/10 px-5 py-2.5 text-sm font-bold text-teal-600 hover:bg-teal-500 hover:text-white transition-all dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500 dark:hover:text-white">
                Book Printing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Photography */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-white/10 dark:bg-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg mb-5">
                <Camera className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Photography Services</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Capturing your most precious moments professionally</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {['Weddings', 'Birthdays', 'Graduations', 'Custom Events'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <CheckCircle className="h-4 w-4 text-purple-500 shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <Link href="/book?service=photography"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500/10 px-5 py-2.5 text-sm font-bold text-purple-600 hover:bg-purple-500 hover:text-white transition-all dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500 dark:hover:text-white">
                Book Photography <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 text-white">
        <h2 className="text-2xl font-black mb-8 text-center sm:text-3xl">Why Choose Tee-Jay?</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Zap,          title: 'Fast Turnaround',   desc: 'Quick production and delivery times to meet your deadlines'      },
            { icon: Star,         title: 'Premium Quality',   desc: 'Industry-leading materials and professional finishing'            },
            { icon: CheckCircle,  title: 'Real-time Tracking',desc: 'Track your order status anytime with your receipt number'        },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 mx-auto mb-4">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Track CTA ───────────────────────────────────────────────────────── */}
      <section className="text-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Already have an order?</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Use your receipt number to track your order status</p>
        <Link href="/track"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-teal-500 px-8 py-4 text-base font-bold text-teal-600 hover:bg-teal-500 hover:text-white transition-all dark:text-teal-400 dark:hover:bg-teal-500 dark:hover:text-white">
          <Clock className="h-5 w-5" /> Track My Order
        </Link>
      </section>
    </div>
  )
}
