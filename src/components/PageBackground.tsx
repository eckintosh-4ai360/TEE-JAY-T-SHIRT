/**
 * Full-bleed premium gradient background.
 * Render once at the top of any page that needs it.
 * Uses fixed positioning so it persists while scrolling.
 */
export default function PageBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
      {/* Fallback solid base */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-zinc-950" />

      {/* Soft glowing ambient blobs */}
      <div className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-brand-500/10 to-brand-600/10 blur-[130px] dark:from-brand-900/30 dark:to-brand-800/20" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-yellow-500/10 to-amber-500/10 blur-[130px] dark:from-yellow-950/20 dark:to-amber-900/15" />

      {/* Smaller accent orbs */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-red-500/[0.04] blur-[100px] dark:bg-red-500/10" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-yellow-500/[0.04] blur-[100px] dark:bg-yellow-500/10" />

      {/* Subtle dot-grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.015)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:20px_20px]" />
    </div>
  )
}
