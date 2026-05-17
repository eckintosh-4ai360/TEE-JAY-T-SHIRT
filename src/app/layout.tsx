import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Press Manager — T-shirt Printing',
  description: 'Order management system for a t-shirt printing press',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 relative z-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
