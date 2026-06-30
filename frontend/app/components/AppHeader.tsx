import Link from 'next/link'
import Logo from './Logo'

export default function AppHeader({
  wide     = false,
  children,
}: {
  wide?:    boolean
  children?: React.ReactNode
}) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
      <div className={`${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-6 h-14 flex items-center justify-between`}>
        <Link href="/" className="flex items-center text-gray-900 dark:text-slate-100">
          <Logo size={18} textSize={15} gap={7} />
        </Link>
        {children && (
          <div className="flex items-center gap-3">{children}</div>
        )}
      </div>
    </header>
  )
}
