import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen theme-bg-primary">
      <Sidebar />
      <div className="pl-24 pr-6 py-8">
        <main className="max-w-[1920px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}