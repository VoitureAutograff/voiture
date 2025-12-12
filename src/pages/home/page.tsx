
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import Hero from './components/Hero';
import SearchFilters from './components/SearchFilters';
import FeaturedVehicles from './components/FeaturedVehicles';
import RequirementForm from './components/RequirementForm';
import { useMatchingLogic } from '../../hooks/useMatchingLogic';
import MatchingPopup from '../../components/feature/MatchingPopup';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const { matches, checkPartialMatches } = useMatchingLogic();
  const [showMatchingPopup, setShowMatchingPopup] = useState(false);
  const [vehicleMatchContext, setVehicleMatchContext] = useState<{
    make: string;
    model: string;
    year: number;
    vehicle_type: 'car' | 'bike';
  } | null>(null);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Voiture.in - Premium Vehicle Marketplace | Buy & Sell Cars & Bikes Online';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover and sell premium vehicles on Voiture.in - India\'s trusted platform for buying and selling cars and bikes with confidence. Browse thousands of verified listings, post requirements, and connect with genuine sellers.');
    }

    // Add structured data for homepage
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Voiture.in - Premium Vehicle Marketplace",
      "description": "India's trusted platform for buying and selling premium cars and bikes online",
      "url": "https://voiture.in",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Featured Vehicles",
        "description": "Premium cars and bikes available for sale"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup structured data on unmount
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript && existingScript.textContent?.includes('WebPage')) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Show pending vehicle match popup on homepage if present (run once per user)
  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const raw = localStorage.getItem('pending-vehicle-match');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as {
          make: string;
          model: string;
          year: number;
          vehicle_type: 'car' | 'bike';
        };

        if (!parsed.make || !parsed.model || !parsed.year || !parsed.vehicle_type) return;

        const matchKey = `vehicle-match-dismissed:${user.id}:${parsed.vehicle_type}:${parsed.make}:${parsed.model}:${parsed.year}`;
        const dismissed = localStorage.getItem(matchKey);
        if (dismissed === '1') {
          console.log('⚠️ Home: pending vehicle match was previously dismissed, clearing flag:', parsed);
          localStorage.removeItem('pending-vehicle-match');
          return;
        }

        (async () => {
          console.log('🔍 Home: found pending vehicle match context, re-checking matches with:', parsed);
          setVehicleMatchContext(parsed);
          const found = await checkPartialMatches(parsed);
          if (found.length > 0) {
            console.log('✅ Home: matches still found on re-check, showing popup. Count:', found.length);
            setShowMatchingPopup(true);
          } else {
            console.log('ℹ️ Home: no matches found on re-check, clearing pending flag');
            localStorage.removeItem('pending-vehicle-match');
          }
        })();
      } catch {
        console.log('❌ Home: failed to parse pending-vehicle-match, clearing');
        localStorage.removeItem('pending-vehicle-match');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  // Check if we should open requirement form from navigation state or URL parameters
  useEffect(() => {
    if (location.state?.openRequirementForm) {
      setShowRequirementForm(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location.state, navigate, location.pathname]);

  // Listen for custom events to open requirement form (for backward compatibility)
  useEffect(() => {
    const handleOpenRequirementForm = () => {
      setShowRequirementForm(true);
    };

    window.addEventListener('openRequirementForm', handleOpenRequirementForm);
    
    return () => {
      window.removeEventListener('openRequirementForm', handleOpenRequirementForm);
    };
  }, []);

  const handlePostRequirement = () => {
    setShowRequirementForm(true);
  };

  const handlePostVehicle = () => {
    if (user) {
      navigate('/vehicles/post');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <Hero onPostRequirement={handlePostRequirement} />

      {/* Search Filters */}
      <SearchFilters />

      {/* Featured Vehicles */}
      <FeaturedVehicles />

      {/* How It Works */}
      <section className="py-12 sm:py-20 bg-white" itemScope itemType="https://schema.org/HowTo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4" itemProp="name">
              How It Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600" itemProp="description">
              Simple steps to buy or sell your vehicle on India's trusted marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center" itemScope itemType="https://schema.org/HowToStep">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-search-line text-xl sm:text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4" itemProp="name">
                Browse &amp; Search
              </h3>
              <p className="text-sm sm:text-base text-gray-600" itemProp="text">
                Find the perfect vehicle from thousands of verified listings or post your
                requirements to get matched with sellers
              </p>
            </div>

            <div className="text-center" itemScope itemType="https://schema.org/HowToStep">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-message-2-line text-xl sm:text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4" itemProp="name">
                Connect &amp; Negotiate
              </h3>
              <p className="text-sm sm:text-base text-gray-600" itemProp="text">
                Contact verified sellers directly, schedule vehicle inspections, and negotiate the
                best price with confidence
              </p>
            </div>

            <div className="text-center sm:col-span-2 lg:col-span-1" itemScope itemType="https://schema.org/HowToStep">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-car-line text-xl sm:text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4" itemProp="name">
                Complete Deal
              </h3>
              <p className="text-sm sm:text-base text-gray-600" itemProp="text">
                Verify all documents, complete the transaction safely with our guidance, and drive away
                happy with your new vehicle
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Join thousands of satisfied buyers and sellers who trust our platform for
            their vehicle needs across India
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => navigate('/vehicles')}
              className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              aria-label="Browse available vehicles for sale"
            >
              <i className="ri-search-line mr-2"></i>
              Browse Vehicles
            </button>

            <button
              onClick={handlePostRequirement}
              className="w-full sm:w-auto bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              aria-label="Post your vehicle requirement to find matching sellers"
            >
              <i className="ri-add-line mr-2"></i>
              Post Your Requirement
            </button>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-blue-100 text-sm mb-3 sm:mb-4">For sellers:</p>
            <button
              onClick={handlePostVehicle}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
              aria-label="List your vehicle for sale on our marketplace"
            >
              <i className="ri-car-line mr-2"></i>
              List Your Vehicle
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* Requirement Form Modal */}
      {showRequirementForm && (
        <RequirementForm onClose={() => setShowRequirementForm(false)} />
      )}

      {vehicleMatchContext && (
        <MatchingPopup
          isOpen={showMatchingPopup}
          onClose={() => {
            // Session-only hide: do NOT clear pending-vehicle-match so it can reappear on next login
            setShowMatchingPopup(false);
          }}
          onDontShowAgain={() => {
            if (typeof window !== 'undefined' && user && vehicleMatchContext) {
              const key = `vehicle-match-dismissed:${user.id}:${vehicleMatchContext.vehicle_type}:${vehicleMatchContext.make}:${vehicleMatchContext.model}:${vehicleMatchContext.year}`;
              localStorage.setItem(key, '1');
              localStorage.removeItem('pending-vehicle-match');
            }
            setShowMatchingPopup(false);
          }}
          type="vehicle-matches-requirement"
          vehicleData={vehicleMatchContext}
          matches={matches}
        />
      )}
    </div>
  );
}
