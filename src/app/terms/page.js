'use client';

import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/components/CartProvider';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <CartProvider>
      <div className="pt-24 pb-16 min-h-screen">
        <Navbar />
        <CartDrawer />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-pc-green hover:text-pc-green-light transition-colors mb-8 font-medium">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-4xl font-black text-white mb-4">Terms of Service & Disclaimer</h1>
        <p className="text-xl text-pc-muted mb-12">Keep scrolling to experience why we are New York's number one source.</p>
        
        <div className="glass-card p-8 md:p-12 space-y-8 text-pc-muted">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Store Policies & Delivery</h2>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Operating Hours:</strong> Our shop is open Sun-Thu from 10 AM to 10 PM, and Fri-Sat from 10 AM to 12 AM. Please submit orders as soon as possible to ensure timely processing.</li>
              <li><strong>Order Minimums:</strong> Delivery services require a minimum order of $100. Orders below $100 are eligible for pickup only.</li>
              <li><strong>Payment Methods:</strong> We accept cash and Zelle payments only.</li>
              <li><strong>Exact Change:</strong> If you require change for a cash payment, please let us know when placing your order, as our drivers do not carry extra change.</li>
              <li><strong>Driver Wait Time:</strong> Please be prepared at your scheduled delivery time. Our drivers will wait no longer than 10 minutes before departing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Legal Compliance & Age Restriction</h2>
            <p className="leading-relaxed">All products sold on this website comply with the Agriculture Improvement Act of 2018 (Farm Bill), containing a delta-9 tetrahydrocannabinol (THC) concentration of not more than 0.3 percent on a dry weight basis. You must be 21 years of age or older to purchase products from this site. By using this site, you acknowledge and confirm that you are at least 21 years old.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Shipping Restrictions</h2>
            <p className="leading-relaxed">We do not ship THCa or other specific hemp-derived products to states where they are explicitly restricted or banned by local or state laws. It is your responsibility as the buyer to understand and comply with your local jurisdiction's laws regarding the purchase and possession of these products.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. FDA Disclaimer</h2>
            <p className="leading-relaxed">Our products are not FDA approved to diagnose, treat, cure, or prevent any disease. The information on this website is for informational purposes only and is not intended as medical advice. Consult with a physician before use, especially if you have a medical condition, are pregnant, nursing, or taking any medications.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Liability</h2>
            <p className="leading-relaxed">Holybuds and its affiliates are not responsible for any legal action, confiscation, or health issues resulting from the use or purchase of our products. Use at your own risk. By purchasing from our store, you agree to assume full responsibility for all parts pertaining to your purchase.</p>
          </section>
        </div>
      </div>
    </div>
    </CartProvider>
  );
}
