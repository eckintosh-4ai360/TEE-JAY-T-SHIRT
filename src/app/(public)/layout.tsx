import PublicNavbar from '@/components/PublicNavbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        {children}
      </main>
    </>
  )
}
