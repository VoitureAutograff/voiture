
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center">
            <img 
              src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
              alt="Voiture.in" 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
      </div>

      {/* 404 Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="ri-car-line text-3xl text-blue-600"></i>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-home-line mr-2"></i>
              Go Home
            </Link>
            <Link
              to="/vehicles"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-car-line mr-2"></i>
              Browse Vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
