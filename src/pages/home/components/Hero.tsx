
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  onPostRequirement: () => void;
}

export default function Hero({ onPostRequirement }: HeroProps) {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Modern%20luxury%20car%20showroom%20with%20premium%20vehicles%20displayed%20in%20bright%20lighting%2C%20sleek%20automotive%20dealership%20interior%2C%20professional%20photography%2C%20clean%20minimalist%20design%2C%20glass%20windows%2C%20contemporary%20architecture&width=1920&height=1080&seq=hero_bg&orientation=landscape')`
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-left text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Find Your Perfect
              <br />
              <span className="text-blue-400">Voiture</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-xl lg:max-w-2xl opacity-90 leading-relaxed">
              Discover thousands of premium cars and bikes from verified dealers and individual sellers. Your dream ride is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/vehicles')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base lg:text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center"
              >
                <i className="ri-search-line mr-2"></i>
                Browse Vehicles
              </button>
              <button 
                onClick={onPostRequirement}
                className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base lg:text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center"
              >
                <i className="ri-add-line mr-2"></i>
                <span className="hidden sm:inline">Post Your Requirement</span>
                <span className="sm:hidden">Post Requirement</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
