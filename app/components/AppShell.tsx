'use client';

import Navbar from './Navbar';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<div className="min-h-screen bg-base-900 flex flex-col">

  {/* Desktop top navbar — fixed */}
  <header className="fixed top-0 left-0 right-0 z-50 h-16 hidden md:block">
    <Navbar />
  </header>

  {/* Main content — mt-16 clears the fixed top navbar on desktop */}
  <main className="flex-1 overflow-auto" style={{ marginTop: '50px' }}>
  <div className="pt-4">{children}</div>
</main>

  {/* Mobile bottom navbar — fixed */}
  <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
    <Navbar />
  </div>

</div>
  );
}