
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Header from '../../components/feature/Header'
import Footer from '../../components/feature/Footer'
import VehicleFilters from './components/VehicleFilters'
import VehicleGrid from './components/VehicleGrid'

interface Vehicle {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage: number | null
  location: string | null
  images: string[] | null
  fuel_type: string | null
  transmission: string | null
  vehicle_type: 'car' | 'bike'
  created_at: string
}

interface Filters {
  search?: string;
  vehicleType?: string;
  make?: string;
  model?: string;  
  priceRange: [number, number];
  yearRange: [number, number];
  location: string;
  fuelType?: string;
  transmission?: string;
}

export default function VehicleList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [_showFilters, _setShowFilters] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [initialFiltersApplied, setInitialFiltersApplied] = useState(false)
  const [filters, setFilters] = useState<Filters>({
  priceRange: [0, 150000000],
  yearRange: [1990, new Date().getFullYear()],
  location: ''
})

  const totalCount = filteredVehicles.length

  // Existing useEffect hooks and loadVehicles function
  useEffect(() => {
    if (!dataLoaded) {
      loadVehicles()
    }
  }, [dataLoaded])

  // Apply URL parameters as initial filters
  useEffect(() => {
    if (dataLoaded && !initialFiltersApplied) {
      const urlVehicleType = searchParams.get('vehicleType') || 'all'
      const urlMake = searchParams.get('make') || 'all'
      const urlModel = searchParams.get('model') || 'all'
      const urlPriceRange = searchParams.get('priceRange') || ''
      const urlSearch = searchParams.get('search') || ''

      // Parse price range
      let priceMin = 0
      let priceMax = 150000000
      if (urlPriceRange) {
        if (urlPriceRange.includes('-')) {
          const [min, max] = urlPriceRange.split('-').map(p => parseInt(p))
          priceMin = min
          priceMax = max
        } else if (urlPriceRange.includes('+')) {
          priceMin = parseInt(urlPriceRange.replace('+', ''))
          priceMax = 150000000
        }
      }

      // Apply filters
      handleFilter({
        search: urlSearch || undefined,
        vehicleType: urlVehicleType === 'all' ? undefined : urlVehicleType,
        make: urlMake === 'all' ? undefined : urlMake,
        model: urlModel === 'all' ? undefined : urlModel,
        priceRange: [priceMin, priceMax],
        yearRange: [1990, new Date().getFullYear()],
        location: '',
        fuelType: undefined,
        transmission: undefined
      })

      setInitialFiltersApplied(true)
    }
  }, [dataLoaded, initialFiltersApplied, searchParams])

  // Apply filters whenever they change (but not on initial load)
  useEffect(() => {
    if (dataLoaded && initialFiltersApplied) {
      // Apply filters
      let filtered = [...vehicles];

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(
          v =>
            v.title.toLowerCase().includes(searchTerm) ||
            v.make.toLowerCase().includes(searchTerm) ||
            v.model.toLowerCase().includes(searchTerm) ||
            v.location?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply vehicle type filter
      if (filters.vehicleType) {
        filtered = filtered.filter(
          v => v.vehicle_type === filters.vehicleType
        );
      }

      // Apply make filter
      if (filters.make) {
        filtered = filtered.filter(v => v.make === filters.make);
      }

      // Apply model filter
      if (filters.model) {
        filtered = filtered.filter(v => v.model === filters.model);
      }

      // Apply price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        filtered = filtered.filter(
          v => v.price >= min && v.price <= max
        );
      }

      // Apply year range filter
      if (filters.yearRange) {
        const [min, max] = filters.yearRange;
        filtered = filtered.filter(
          v => v.year >= min && v.year <= max
        );
      }

      // Apply location filter
      if (filters.location && filters.location !== 'all') {
        filtered = filtered.filter(
          v => v.location?.toLowerCase() === filters.location.toLowerCase()
        );
      }

      // Apply fuel type filter
      if (filters.fuelType) {
        filtered = filtered.filter(
          v => v.fuel_type?.toLowerCase() === filters.fuelType!.toLowerCase()
        );
      }

      // Apply transmission filter
      if (filters.transmission) {
        filtered = filtered.filter(
          v => v.transmission?.toLowerCase() === filters.transmission!.toLowerCase()
        );
      }

      setFilteredVehicles(filtered);
    }
  }, [filters, dataLoaded, initialFiltersApplied, vehicles])

  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching vehicles:', fetchError)
        setError('Failed to load vehicles')
        return
      }

      setVehicles(data || [])
      setFilteredVehicles(data || [])
      setDataLoaded(true)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Failed to load vehicles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = (newFilters: Partial<Filters>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      // Convert 'all' values to undefined for consistency
      if (updatedFilters.make === 'all') {
        updatedFilters.make = undefined;
      }
      if (updatedFilters.model === 'all') {
        updatedFilters.model = undefined;
      }
      if (updatedFilters.vehicleType === 'all') {
        updatedFilters.vehicleType = undefined;
      }
      if (updatedFilters.fuelType === 'all') {
        updatedFilters.fuelType = undefined;
      }
      if (updatedFilters.transmission === 'all') {
        updatedFilters.transmission = undefined;
      }
      
      // If make is changed, reset model
      if (newFilters.make !== undefined && newFilters.make !== prev.make) {
        updatedFilters.model = undefined;
      }

      // Update URL with new filters
      const params = new URLSearchParams();
      if (updatedFilters.search) params.set('search', updatedFilters.search);
      if (updatedFilters.vehicleType) params.set('vehicleType', updatedFilters.vehicleType);
      if (updatedFilters.make) params.set('make', updatedFilters.make);
      if (updatedFilters.model) params.set('model', updatedFilters.model);
      if (updatedFilters.fuelType) params.set('fuelType', updatedFilters.fuelType);
      if (updatedFilters.transmission) params.set('transmission', updatedFilters.transmission);

      // Only update URL if we have any filters
      if (Array.from(params.keys()).length > 0) {
        window.history.pushState({}, '', `?${params.toString()}`);
      } else {
        window.history.pushState({}, '', '/vehicles');
      }

      // Apply filters
      let filtered = [...vehicles];

      // Apply search filter
      if (updatedFilters.search) {
        const searchTerm = updatedFilters.search.toLowerCase();
        filtered = filtered.filter(
          v =>
            v.title.toLowerCase().includes(searchTerm) ||
            v.make.toLowerCase().includes(searchTerm) ||
            v.model.toLowerCase().includes(searchTerm) ||
            v.location?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply vehicle type filter
      if (updatedFilters.vehicleType) {
        filtered = filtered.filter(
          v => v.vehicle_type === updatedFilters.vehicleType
        );
      }

      // Apply make filter
      if (updatedFilters.make) {
        filtered = filtered.filter(v => v.make === updatedFilters.make);
      }

      // Apply model filter
      if (updatedFilters.model) {
        filtered = filtered.filter(v => v.model === updatedFilters.model);
      }

      // Apply price range filter
      if (updatedFilters.priceRange) {
        const [min, max] = updatedFilters.priceRange;
        filtered = filtered.filter(
          v => v.price >= min && v.price <= max
        );
      }

      // Apply year range filter
      if (updatedFilters.yearRange) {
        const [min, max] = updatedFilters.yearRange;
        filtered = filtered.filter(
          v => v.year >= min && v.year <= max
        );
      }

      // Apply location filter
      if (updatedFilters.location && updatedFilters.location !== 'all') {
        filtered = filtered.filter(
          v => v.location?.toLowerCase() === updatedFilters.location.toLowerCase()
        );
      }

      // Apply fuel type filter
      if (updatedFilters.fuelType) {
        filtered = filtered.filter(
          v => v.fuel_type?.toLowerCase() === updatedFilters.fuelType!.toLowerCase()
        );
      }

      // Apply transmission filter
      if (updatedFilters.transmission) {
        filtered = filtered.filter(
          v => v.transmission?.toLowerCase() === updatedFilters.transmission!.toLowerCase()
        );
      }

      setFilteredVehicles(filtered);
      return updatedFilters;
    });
  }

  const handleResetFilters = () => {
    const resetFilters = {
      priceRange: [0, 150000000] as [number, number],
      yearRange: [1990, new Date().getFullYear()] as [number, number],
      location: ''
    }
    
    setFilters(resetFilters)
    setFilteredVehicles(vehicles)
    
    // Clear URL parameters
    navigate('/vehicles', { replace: true })
  }

  // Existing SEO useEffect
  useEffect(() => {
    const vehicleTypeText = filters.vehicleType === 'car' ? 'Cars' : filters.vehicleType === 'bike' ? 'Bikes' : 'Vehicles';
    const makeText = filters.make ? ` ${filters.make}` : '';
    const locationText = filters.location ? ` in ${filters.location}` : ' in India';

    document.title = `${vehicleTypeText}${makeText} for Sale${locationText} | Voiture.in`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const description = `Browse ${vehicleTypeText.toLowerCase()}${makeText.toLowerCase()} for sale${locationText}. Find verified listings, compare prices, and connect with genuine sellers on India's trusted vehicle marketplace.`;
      metaDescription.setAttribute('content', description);
    }

    // Add structured data for vehicle listings
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${vehicleTypeText}${makeText} for Sale${locationText}`,
      "description": `Browse and buy ${vehicleTypeText.toLowerCase()}${makeText.toLowerCase()} for sale${locationText}`,
      "url": `https://voiture.in/vehicles${window.location.search}`,
      "mainEntity": {
        "@type": "ItemList",
        "name": `${vehicleTypeText} Listings`,
        "numberOfItems": totalCount
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup structured data on unmount
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript && existingScript.textContent?.includes('CollectionPage')) {
        document.head.removeChild(existingScript);
      }
    };
  }, [filters, totalCount]);

  // Existing loading and error states
  if (isLoading && !dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading vehicles...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm sm:max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 lg:p-8">
              <i className="ri-error-warning-line text-2xl sm:text-3xl lg:text-4xl text-red-500 mb-3 sm:mb-4"></i>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-red-800 mb-2">{error}</h3>
              <p className="text-red-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">Please check your connection and try again</p>
              <div className="flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Go Back
                </button>
                <button
                  onClick={() => {
                    setDataLoaded(false);
                    loadVehicles();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600" itemScope itemType="https://schema.org/BreadcrumbList">
            <span itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <Link to="/" className="hover:text-blue-600 transition-colors" itemProp="name">
                Home
              </Link>
              <meta itemProp="position" content="1" />
            </span>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-gray-900 font-medium" itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <span itemProp="name">
                {filters.vehicleType === 'car' ? 'Cars' : filters.vehicleType === 'bike' ? 'Bikes' : 'Vehicles'}
                {filters.make && ` - ${filters.make}`}
              </span>
              <meta itemProp="position" content="2" />
            </span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {filters.vehicleType === 'car' ? 'Cars' : filters.vehicleType === 'bike' ? 'Bikes' : 'Vehicles'} for Sale
                {filters.make && ` - ${filters.make}`}
              </h1>
              <p className="text-gray-600 mt-2">
                {isLoading ? 'Loading...' : `${totalCount.toLocaleString()} ${filters.vehicleType === 'car' ? 'cars' : filters.vehicleType === 'bike' ? 'bikes' : 'vehicles'} available`}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm lg:text-base"
              >
                Reset Filters
              </button>
              <Link
                to="/vehicles/post"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center"
                aria-label="Post your vehicle for sale"
              >
                <i className="ri-add-line mr-2"></i>
                <span className="hidden sm:inline">Post Vehicle</span>
                <span className="sm:hidden">Post</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Existing content (filters and vehicle grid) */}
      <div className="flex-1">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:w-1/4">
                <div className="sticky top-20">
                  <VehicleFilters
                    filters={{
                      search: filters.search || '',
                      vehicleType: filters.vehicleType || 'all',
                      make: filters.make || '',
                      model: filters.model || '',
                      location: filters.location || 'all',
                      priceRange: searchParams.get('priceRange') || '',
                      priceMin: filters.priceRange[0],
                      priceMax: filters.priceRange[1],
                      yearFrom: filters.yearRange[0],
                      yearTo: filters.yearRange[1],
                      fuelType: filters.fuelType || 'all',
                      transmission: filters.transmission || 'all'
                    }}
                    onFiltersChange={(newFilters) => {
                      handleFilter({
                        search: newFilters.search || undefined,
                        vehicleType: newFilters.vehicleType || undefined,
                        make: newFilters.make || undefined,
                        model: newFilters.model || undefined,
                        location: newFilters.location === 'all' ? '' : newFilters.location || '',
                        priceRange: [newFilters.priceMin || 0, newFilters.priceMax || 150000000],
                        yearRange: [newFilters.yearFrom || 1990, newFilters.yearTo || new Date().getFullYear()],
                        fuelType: newFilters.fuelType || undefined,
                        transmission: newFilters.transmission || undefined
                      })
                    }}
                  />
                </div>
              </div>

              <div className="lg:w-3/4">
                <VehicleGrid 
                  vehicles={filteredVehicles} 
                  loading={false}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
