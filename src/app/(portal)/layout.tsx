import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/auth'
import PortalSidebar from '@/components/PortalSidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-transparent dark:bg-transparent">

      {/* Full-bleed premium gradient background with subtle grid pattern */}
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
        {/* Fallback solid backgrounds */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-zinc-950" />

        {/* Soft, glowing ambient colors matching brand red & yellow */}
        <div className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-brand-500/10 to-brand-600/10 blur-[130px] dark:from-brand-900/30 dark:to-brand-800/20" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-yellow-500/10 to-amber-500/10 blur-[130px] dark:from-yellow-950/20 dark:to-amber-900/15" />

        {/* Layered smaller accents */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-red-500/[0.04] blur-[100px] dark:bg-red-500/10" />
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-yellow-500/[0.04] blur-[100px] dark:bg-yellow-500/10" />

        {/* Subtle grid pattern overlay to give structure */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.015)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <PortalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
