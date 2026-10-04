import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import './globals.css';

const customFont = localFont({
  src: './fonts/file.otf',
  variable: '--font-custom',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://holybuds.net';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HolyBuds | Long Island Cannabis Dispensary & Weed Delivery',
    template: '%s | HolyBuds',
  },
  description: 'Order premium cannabis flower, edibles, concentrates, and vapes with same-day weed delivery across Long Island (Nassau & Suffolk Counties) or fast pickup from HolyBuds.',
  keywords: [
    'cannabis delivery Long Island',
    'weed delivery Long Island NY',
    'dispensary Long Island',
    'Nassau County weed delivery',
    'Suffolk County cannabis delivery',
    'dispensaries near me',
    'HolyBuds dispensary',
    'same day dispensary delivery Long Island',
    'weed pickup Long Island',
    'THC flower',
    'cannabis edibles NY',
    'vape carts Long Island',
  ],
  authors: [{ name: 'HolyBuds' }],
  creator: 'HolyBuds',
  publisher: 'HolyBuds',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HolyBuds | Long Island Cannabis Dispensary & Weed Delivery',
    description: 'Top-shelf flower, edibles, vapes, and concentrates delivered across Nassau and Suffolk Counties, Long Island. Fast, friendly, and discreet.',
    url: siteUrl,
    siteName: 'HolyBuds Dispensary',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/Leaf-Logo.png',
        width: 800,
        height: 600,
        alt: 'HolyBuds Cannabis Dispensary Long Island',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HolyBuds | Long Island Cannabis Dispensary & Delivery',
    description: 'Fast same-day cannabis delivery across Nassau & Suffolk County, Long Island. Shop premium flower, edibles, & vapes.',
    images: ['/Leaf-Logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['Store', 'DeliveryService'],
  name: 'HolyBuds Dispensary',
  description: 'Premium cannabis dispensary offering in-store pickup and fast same-day weed delivery across Long Island (Nassau and Suffolk Counties), NY.',
  url: siteUrl,
  logo: `${siteUrl}/Leaf-Logo.png`,
  image: `${siteUrl}/Leaf-Logo.png`,
  priceRange: '$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Zelle',
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Long Island, NY',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Nassau County, NY',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Suffolk County, NY',
    },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '10:00',
      closes: '22:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday'],
      opens: '10:00',
      closes: '00:00',
    },
  ],
};

import ChatWidget from '@/components/ChatWidget';
import AuthProvider from '@/components/AuthProvider';
import MixpanelTracker from '@/components/MixpanelTracker';
import MoodWidget from '@/components/MoodWidget';
import ReferralBanner from '@/components/ReferralBanner';
import { Analytics } from '@vercel/analytics/react';
import { Suspense } from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${customFont.variable} antialiased`}>
      <body className="min-h-screen bg-pc-black text-white font-sans relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <MixpanelTracker />
        <div 
          className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-center bg-no-repeat bg-[length:300px_300px] sm:bg-[length:500px_500px]"
          style={{ backgroundImage: "url('/Leaf-Logo.png')" }}
        />
        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Suspense fallback={null}>
              <ReferralBanner />
            </Suspense>
            {children}
          </div>
          <ChatWidget />
          <MoodWidget />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
