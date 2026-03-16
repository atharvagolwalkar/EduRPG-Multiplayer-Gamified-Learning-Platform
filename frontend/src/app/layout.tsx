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
    <html lang="en" className="scroll-smooth">
      <body className="overflow-x-hidden text-white">
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
