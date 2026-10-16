export const metadata = {
  title: 'Driver Portal | HolyBuds',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DriverLayout({ children }) {
  return (
    <div className="font-admin min-h-screen bg-pc-black text-white antialiased">
      {children}
    </div>
  );
}
