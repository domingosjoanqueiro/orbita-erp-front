import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/shared/providers/providers';
import '@/styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Orbita ERP - Sistema de Gestão Empresarial',
  description: 'Sistema ERP modular para gestão empresarial',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}