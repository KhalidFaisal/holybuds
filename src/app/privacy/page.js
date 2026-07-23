import Navbar from '@/components/Navbar';
import { CartProvider } from '@/components/CartProvider';

export const metadata = {
  title: 'Privacy Policy - Holybuds',
  description: 'Privacy Policy for Holybuds. Learn how we handle and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <CartProvider>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-8 md:p-12 animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-8">Privacy Policy</h1>
            
            <div className="prose prose-invert max-w-none prose-p:text-pc-muted prose-headings:text-white prose-a:text-pc-green">
              <p className="mb-6">
                <strong>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us, such as when you create an account, place an order, sign up for our loyalty program, or communicate with us. This may include your name, email address, phone number, delivery address, and payment information.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-6 text-pc-muted space-y-2">
                <li>Process and fulfill your orders, including delivery.</li>
                <li>Manage your account and loyalty points.</li>
                <li>Send you transactional emails, order updates, and marketing communications (if you&apos;ve opted in).</li>
                <li>Improve our website, services, and customer experience.</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">3. Information Sharing</h2>
              <p className="mb-4">
                We do not sell or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, conducting our business, or serving our users (e.g., payment processors, delivery partners), provided they agree to keep this information confidential.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">4. Security</h2>
              <p className="mb-4">
                We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the Internet or storage system can be guaranteed to be 100% secure.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">5. Your Choices</h2>
              <p className="mb-4">
                You may update, correct, or delete your account information at any time by logging into your account settings. You can also opt out of receiving promotional communications from us by following the instructions in those messages.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">6. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at privacy@holybuds.net.
              </p>
            </div>
          </div>
        </div>
      </main>
    </CartProvider>
  );
}
