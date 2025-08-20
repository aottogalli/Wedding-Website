import './globals.css';
import type { ReactNode } from 'react';
import NavbarWrapper from '@/components/NavbarWrapper';
import ClientLayout from '@/components/ClientLayout';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <ClientLayout>
            <NavbarWrapper>{children}</NavbarWrapper>
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
