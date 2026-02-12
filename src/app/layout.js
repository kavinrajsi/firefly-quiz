import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Firefly - Interactive Quiz Platform',
  description: 'Create and host interactive quizzes for corporate training',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
