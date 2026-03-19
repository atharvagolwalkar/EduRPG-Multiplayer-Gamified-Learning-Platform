import type { Metadata } from 'next';
import './globals.css';
import AuthBootstrap from './AuthBootstrap';

export const metadata: Metadata = {
  title: 'EduRPG — Multiplayer Learning',
  description: 'Turn studying into epic multiplayer raids',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white">
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}