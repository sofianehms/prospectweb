import ThemeToggle from './ThemeToggle'

export default function RouteChrome() {
  return (
    <>
      <ThemeToggle />
      <footer className="mt-auto py-4 text-center text-xs text-gray-400 dark:text-slate-500">
        <a href="/privacy" className="underline transition hover:text-gray-600 dark:hover:text-slate-300">
          Politique de confidentialit&eacute;
        </a>
      </footer>
    </>
  )
}
