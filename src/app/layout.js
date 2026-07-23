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

export const metadata = {
  title: 'Holybuds | Premium Cannabis Dispensary',
  description: 'Premium flower and edibles from Holybuds. Browse our curated selection and order for pickup.',
  keywords: 'cannabis, dispensary, flower, edibles, THC, CBD, premium, Holybuds',
  icons: {
    icon: '/icon.png',
  },
};

import ChatWidget from '@/components/ChatWidget';
import AuthProvider from '@/components/AuthProvider';
import MixpanelTracker from '@/components/MixpanelTracker';
import MoodWidget from '@/components/MoodWidget';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${customFont.variable} antialiased`}>
      <body className="min-h-screen bg-pc-black text-white font-sans relative">
        <MixpanelTracker />
        <div 
          className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-center bg-no-repeat bg-[length:300px_300px] sm:bg-[length:500px_500px]"
          style={{ backgroundImage: "url('/Leaf-Logo.png')" }}
        />
        <AuthProvider>
          <div className="relative z-10">
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
