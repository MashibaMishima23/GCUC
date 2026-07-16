import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-200">404</p>
        <h1 className="text-2xl font-bold text-gray-700 mt-4">Page Not Found</h1>
        <p className="text-gray-400 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-block mt-6">Go Home</Link>
      </div>
    </div>
  )
}
