import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center text-slate-100">
      <p className="text-5xl font-semibold text-cyan-100">404</p>
      <p className="mt-2 text-lg">Page not found</p>
      <p className="mt-2 text-sm text-slate-300">This route is outside the Constellation Coach prototype.</p>
      <Link to="/" className="mt-5 rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
        Return to courses
      </Link>
    </main>
  )
}

export default NotFoundPage
