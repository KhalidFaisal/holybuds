export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }) {
  return (
    <div className="font-admin">
      {children}
    </div>
  );
}
