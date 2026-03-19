import type { Metadata } from 'next';
import './globals.css';
import Bootstrap from '../components/AuthBootstrap';

export const metadata: Metadata = {
  title: 'EduRPG ⚔️',
  description: 'Multiplayer Gamified Learning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Bootstrap />
        {children}
      </body>
    </html>
  );
}