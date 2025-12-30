import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Top Strip (Optional, for aesthetics) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900" />

      {/* Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}