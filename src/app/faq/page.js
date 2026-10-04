import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/components/CartProvider';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Frequently Asked Questions | Long Island Delivery & Hours | HolyBuds',
  description: 'Everything you need to know about HolyBuds cannabis delivery across Long Island (Nassau & Suffolk), operating hours, order minimums, and payment options.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions | HolyBuds Cannabis Dispensary Long Island',
    description: 'Find answers about weed delivery hours, Long Island service areas, cash and Zelle payment options, and rewards at HolyBuds.',
    url: '/faq',
    siteName: 'HolyBuds Dispensary',
  },
};

const faqs = [
  {
    question: "What are your delivery hours?",
    answer: "We are open Sunday through Thursday from 10 AM to 10 PM, and Friday through Saturday from 10 AM to 12 AM for same-day delivery across Long Island."
  },
  {
    question: "Is there an order minimum?",
    answer: "Delivery is free for orders over $100. Orders below $100 will incur a $10 delivery fee across Long Island. There is no minimum for store pickup."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Cash and Zelle payments upon delivery or pickup."
  },
  {
    question: "Do drivers carry exact change?",
    answer: "No, our drivers do not carry extra change for safety reasons. If you require change for a cash payment, please let us know when placing your order."
  },
  {
    question: "How long will the driver wait?",
    answer: "Our drivers will wait no longer than 10 minutes before departing, so please be prepared at your scheduled delivery address."
  },
  {
    question: "How does the loyalty program work?",
    answer: "You earn points on every order you place (calculated after discounts and before delivery fees). You can redeem these points at checkout for free items or discounts!"
  },
  {
    question: "How do referrals work?",
    answer: "Returning customers receive a unique referral code. Share this code with a friend, and they can enter it at checkout on their first order. Once delivered, you automatically receive 100 bonus points!"
  }
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
          
          <div className="w-full relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-xl border border-pc-border">
            <Image 
              src="/faq.png" 
              alt="FAQ Cover" 
              fill
              className="object-cover"
              priority
            />
          </div>

          <h1 className="text-4xl font-black text-black mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-pc-muted mb-12">Everything you need to know about our services and policies.</p>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="glass-card p-6 md:p-8">
                <h3 className="text-lg font-bold text-black mb-3">{faq.question}</h3>
                <p className="text-pc-muted leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>


        </div>
      </div>
    </CartProvider>
  );
}
