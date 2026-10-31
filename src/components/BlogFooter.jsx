import Link from 'next/link';
import Image from 'next/image';

export default function BlogFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-24">
      {/* Upper Footer: Newsletter / CTA Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Ready to Order Same-Day Cannabis Delivery?
            </h3>
            <p className="text-slate-400 text-sm max-w-xl">
              Browse top-shelf flower, live rosin vapes, potent edibles, and concentrates delivered discreetly across Long Island.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/menu"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-md hover:shadow-emerald-500/20"
            >
              Shop Full Menu
            </Link>
            <Link
              href="/faq"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
            >
              Delivery Zones
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#0b1410] px-3 py-1.5 rounded-xl border border-emerald-900/40 inline-flex items-center">
                <Image
                  src="/logo.png"
                  alt="Holy Buds"
                  width={200}
                  height={50}
                  className="h-6 w-auto object-contain"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Holy Buds Budtender Journal is Long Island&apos;s go-to cannabis education hub. We demystify cannabinoids, terpenes, strain genetics, and safe consumption practices with honest budtender expertise.
            </p>

            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                21+ Adult-Use Cannabis Delivery
              </span>
            </div>
          </div>

          {/* Guide Topics */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Journal Topics
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/blog" className="hover:text-emerald-400 transition-colors">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href="/blog#categories" className="hover:text-emerald-400 transition-colors">
                  Cannabis 101
                </Link>
              </li>
              <li>
                <Link href="/blog#categories" className="hover:text-emerald-400 transition-colors">
                  Strain Guides
                </Link>
              </li>
              <li>
                <Link href="/blog#categories" className="hover:text-emerald-400 transition-colors">
                  Edibles &amp; Dosing
                </Link>
              </li>
              <li>
                <Link href="/blog#categories" className="hover:text-emerald-400 transition-colors">
                  Delivery &amp; Lifestyle
                </Link>
              </li>
              <li>
                <Link href="/blog#categories" className="hover:text-emerald-400 transition-colors">
                  Wellness &amp; Sleep
                </Link>
              </li>
            </ul>
          </div>

          {/* Dispensary Menu */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Shop Dispensary
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/menu" className="hover:text-emerald-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/menu?category=flower" className="hover:text-emerald-400 transition-colors">
                  THC Flower
                </Link>
              </li>
              <li>
                <Link href="/menu?category=edibles" className="hover:text-emerald-400 transition-colors">
                  Gummies &amp; Edibles
                </Link>
              </li>
              <li>
                <Link href="/menu?category=vapes" className="hover:text-emerald-400 transition-colors">
                  Vape Cartridges
                </Link>
              </li>
              <li>
                <Link href="/menu?category=concentrates" className="hover:text-emerald-400 transition-colors">
                  Concentrates &amp; Wax
                </Link>
              </li>
              <li>
                <Link href="/menu?category=prerolls" className="hover:text-emerald-400 transition-colors">
                  Pre-Rolls &amp; Blunts
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating & Delivery Hours */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Delivery Hours
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="font-semibold text-white mb-1">Weekly Schedule</div>
                <div className="text-slate-300">Sun - Thu: 10 AM - 10 PM</div>
                <div className="text-emerald-400 font-medium">Fri - Sat: 10 AM - 12 AM</div>
              </div>
              <div className="text-[11px] text-slate-400">
                Delivering across Nassau &amp; Suffolk County, Long Island, New York.
              </div>
            </div>
          </div>

        </div>

        {/* Regulatory & FDA Compliance Disclaimer */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-[11px] text-slate-400/90 leading-relaxed">
          <p className="mb-3 font-semibold uppercase tracking-wider text-slate-400">
            Compliance &amp; Legal Notice:
          </p>
          <p className="mb-4">
            Educational content published on this website is for informational purposes only and does not constitute medical advice. Products mentioned are strictly for adults aged 21 and older with valid government identification. Keep out of reach of children and pets. Do not operate machinery or drive under the influence. Products comply with applicable state and federal laws.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
            <div>
              &copy; {currentYear} Holy Buds. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

