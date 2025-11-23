
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
  search: string;
  vehicleType: string;
  make: string;
  priceRange: [number, number];
  yearRange: [number, number];
  location: string;
  fuelType: string;
  transmission: string;
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
    search: '',
    vehicleType: 'all',
    make: 'all',
    priceRange: [0, 150000000],
    yearRange: [1990, new Date().getFullYear()],
    location: '',
    fuelType: 'all',
    transmission: 'all'
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
        search: urlSearch,
        vehicleType: urlVehicleType,
        make: urlMake,
        priceRange: [priceMin, priceMax],
        yearRange: [1990, new Date().getFullYear()],
        location: '',
        fuelType: 'all',
        transmission: 'all'
      })

      setInitialFiltersApplied(true)
    }
  }, [dataLoaded, initialFiltersApplied, searchParams])

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

  const handleFilter = (newFilters: {
    search: string;
    vehicleType: string;
    make: string;
    priceRange: [number, number];
    yearRange: [number, number];
    location: string;
    fuelType: string;
    transmission: string;
  }) => {
    setFilters(newFilters)

    let filtered = [...vehicles]

    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase()
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(searchTerm) ||
        v.make.toLowerCase().includes(searchTerm) ||
        v.model.toLowerCase().includes(searchTerm) ||
        v.location?.toLowerCase().includes(searchTerm)
      )
    }

    if (newFilters.vehicleType && newFilters.vehicleType !== 'all') {
      filtered = filtered.filter(v => v.vehicle_type === newFilters.vehicleType)
    }

    if (newFilters.make && newFilters.make !== 'all') {
      filtered = filtered.filter(v =>
        v.make.toLowerCase() === newFilters.make.toLowerCase()
      )
    }

    if (newFilters.priceRange) {
      filtered = filtered.filter(v =>
        v.price >= newFilters.priceRange[0] && v.price <= newFilters.priceRange[1]
      )
    }

    if (newFilters.yearRange) {
      filtered = filtered.filter(v =>
        v.year >= newFilters.yearRange[0] && v.year <= newFilters.yearRange[1]
      )
    }

    if (newFilters.location) {
      filtered = filtered.filter(v =>
        v.location?.toLowerCase().includes(newFilters.location.toLowerCase())
      )
    }

    if (newFilters.fuelType && newFilters.fuelType !== 'all') {
      filtered = filtered.filter(v =>
        v.fuel_type?.toLowerCase() === newFilters.fuelType.toLowerCase()
      )
    }

    if (newFilters.transmission && newFilters.transmission !== 'all') {
      filtered = filtered.filter(v =>
        v.transmission?.toLowerCase() === newFilters.transmission.toLowerCase()
      )
    }

    setFilteredVehicles(filtered)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      vehicleType: 'all',
      make: 'all',
      priceRange: [0, 150000000] as [number, number],
      yearRange: [1990, new Date().getFullYear()] as [number, number],
      location: '',
      fuelType: 'all',
      transmission: 'all'
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
                      search: filters.search,
                      vehicleType: filters.vehicleType,
                      make: filters.make,
                      priceRange: searchParams.get('priceRange') || '',
                      priceMin: filters.priceRange[0],
                      priceMax: filters.priceRange[1],
                      yearFrom: filters.yearRange[0],
                      yearTo: filters.yearRange[1],
                      fuelType: filters.fuelType,
                      transmission: filters.transmission
                    }}
                    onFiltersChange={(newFilters) => {
                      handleFilter({
                        search: newFilters.search || '',
                        vehicleType: newFilters.vehicleType || 'all',
                        make: newFilters.make || 'all',
                        priceRange: [newFilters.priceMin || 0, newFilters.priceMax || 150000000],
                        yearRange: [newFilters.yearFrom || 1990, newFilters.yearTo || new Date().getFullYear()],
                        location: filters.location,
                        fuelType: newFilters.fuelType || 'all',
                        transmission: newFilters.transmission || 'all'
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
