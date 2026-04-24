'use client';

import Navbar from './Navbar';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-900 flex-inline flex-col ">

      {/* Desktop Top Navbar */}
      <div className="block flex-none">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="pt-16 lg:pt-16 pb-16 lg:pb-0 flex-1">
        <div className='pt-4'>{children}</div>
      </main>

      {/* Mobile + Tablet Bottom Navbar */}
      <div className="fixed hidden bottom-0 left-0 right-0 z-50 flex-none">
        <Navbar />
      </div>

    </div>
  );
}