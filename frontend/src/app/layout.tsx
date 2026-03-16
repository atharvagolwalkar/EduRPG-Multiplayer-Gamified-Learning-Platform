import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduRPG - Gamified Learning Platform',
  description: 'Turn studying into an epic multiplayer adventure',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
