
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Header from '../../components/feature/Header'
import Footer from '../../components/feature/Footer'
import ImageGallery from './components/ImageGallery'
import ContactForm from './components/ContactForm'
import SimilarVehicles from './components/SimilarVehicles'

interface Vehicle {
  id: string
  title: string
  description: string | null
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
  body_type: string | null
  color: string | null
  engine_capacity: number | null
  registration_year: number | null
  ownership: string | null
  insurance_validity: string | null
  // New detailed fields
  num_owners: number | null
  insurance_expiry: string | null
  accident_history: string | null
  claim_history: string | null
  seller_type: string | null
  registration_state: string | null
  fitness_valid_until: string | null
  pollution_valid_until: string | null
  service_history: string | null
  tyres_condition: string | null
  exterior_condition: string | null
  interior_condition: string | null
  engine_condition: string | null
  parking_type: string | null
  duplicate_key: boolean | null
  loan_available: boolean | null
  exchange_accepted: boolean | null
  negotiable: boolean | null
  test_drive_available: boolean | null
  additional_notes: string | null
  contact_number: string | null // Contact number should not be visible to users
  created_at: string
  seller_id: string
  seller_name: string | null
  seller_phone: string | null
  seller_whatsapp?: string | null
  status: string
}

interface LoanFormData {
  name: string
  whatsapp: string
  place: string
  amount: string
}

/**
 * VehicleDetail – displays a single vehicle's information.
 * Contact number is hidden from regular users for privacy.
 */
export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanFormData, setLoanFormData] = useState<LoanFormData>({
    name: user?.name || '',
    whatsapp: '',
    place: '',
    amount: '',
  })

  // SEO: Update page title and meta tags when vehicle loads
  useEffect(() => {
    if (vehicle) {
      const pageTitle = `${vehicle.title} - ${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale | Voiture.in`;
      document.title = pageTitle;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        const description = `Buy ${vehicle.title} - ${vehicle.year} ${vehicle.make} ${vehicle.model} for ₹${vehicle.price.toLocaleString()} in ${vehicle.location || 'India'}. ${vehicle.fuel_type ? vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1) : ''} ${vehicle.transmission ? vehicle.transmission : ''} ${vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : ''}. Contact verified seller on Voiture.in.`;
        metaDescription.setAttribute('content', description);
      }

      // Add canonical URL
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', `https://voiture.in/vehicles/${vehicle.id}`);

      // Add structured data for vehicle
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        "name": vehicle.title,
        "description": vehicle.description || `${vehicle.year} ${vehicle.make} ${vehicle.model} for sale`,
        "brand": {
          "@type": "Brand",
          "name": vehicle.make
        },
        "model": vehicle.model,
        "vehicleModelDate": vehicle.year.toString(),
        "mileageFromOdometer": vehicle.mileage ? {
          "@type": "QuantitativeValue",
          "value": vehicle.mileage,
          "unitCode": "KMT"
        } : undefined,
        "fuelType": vehicle.fuel_type,
        "vehicleTransmission": vehicle.transmission,
        "color": vehicle.color,
        "vehicleEngine": vehicle.engine_capacity ? {
          "@type": "EngineSpecification",
          "engineDisplacement": {
            "@type": "QuantitativeValue",
            "value": vehicle.engine_capacity,
            "unitCode": "CMQ"
          }
        } : undefined,
        "offers": {
          "@type": "Offer",
          "price": vehicle.price,
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Person",
            "name": vehicle.seller_name || "Verified Seller"
          }
        },
        "image": vehicle.images && vehicle.images.length > 0 ? vehicle.images : undefined,
        "url": `https://voiture.in/vehicles/${vehicle.id}`
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        // Cleanup structured data on unmount
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript && existingScript.textContent?.includes('Vehicle')) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [vehicle]);

  // -------------------------------------------------------------------------
  // Fetch vehicle when `id` changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (id) {
      loadVehicle(id)
    }
  }, [id])

  // Check if vehicle is in favorites when user or vehicle changes
  useEffect(() => {
    if (user && vehicle) {
      checkFavoriteStatus()
    }
  }, [user, vehicle])

  /**
   * Load a single vehicle from Supabase.
   * NOTE: Contact number is excluded from regular user queries for privacy
   */
  const loadVehicle = async (vehicleId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('vehicle_listings')
        .select(`
          id,
          title,
          description,
          make,
          model,
          year,
          price,
          mileage,
          location,
          images,
          fuel_type,
          transmission,
          vehicle_type,
          body_type,
          color,
          engine_capacity,
          registration_year,
          ownership,
          insurance_validity,
          num_owners,
          insurance_expiry,
          accident_history,
          claim_history,
          seller_type,
          registration_state,
          fitness_valid_until,
          pollution_valid_until,
          service_history,
          tyres_condition,
          exterior_condition,
          interior_condition,
          engine_condition,
          parking_type,
          duplicate_key,
          loan_available,
          exchange_accepted,
          negotiable,
          test_drive_available,
          additional_notes,
          created_at,
          posted_by,
          status,
          users!vehicle_listings_posted_by_fkey (
            name,
            phone
          )
        `)
        .eq('id', vehicleId)
        .eq('status', 'active')
        .single()

      if (fetchError) {
        // Supabase returns a code when the row is not found
        if ((fetchError as any).code === 'PGRST116') {
          setError('Vehicle not found')
        } else {
          console.error('Error fetching vehicle:', fetchError)
          setError('Failed to load vehicle details')
        }
        return
      }

      if (data) {
        // Map Supabase‑joined columns to our Vehicle interface
        // NOTE: contact_number is intentionally excluded for privacy
        const joinedUser = Array.isArray((data as any).users) ? (data as any).users[0] : (data as any).users;
        setVehicle({
          ...data,
          seller_id: (data as any).posted_by,
          seller_name: joinedUser?.name ?? null,
          seller_phone: joinedUser?.phone ?? null,
          seller_whatsapp: joinedUser?.phone ?? null, // Use phone as WhatsApp for now
          contact_number: null, // Always null for regular users
        })
      }
    } catch (err) {
      console.error('Unexpected error while loading vehicle:', err)
      setError('Failed to load vehicle details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!vehicle) return

    setFavoriteLoading(true)

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicle.id)

        if (error) {
          console.error('Delete favorite error:', error)
          throw error
        }

        setIsFavorite(false)
        showNotification('Removed from favorites', 'success')
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            vehicle_id: vehicle.id,
          })

        if (error) {
          console.error('Insert favorite error:', error)
          
          // Handle duplicate key error
          if (error.code === '23505') {
            setIsFavorite(true)
            showNotification('Vehicle already in favorites', 'success')
            return
          }
          
          throw error
        }

        setIsFavorite(true)
        showNotification('Added to favorites', 'success')
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err)
      showNotification('Failed to update favorites. Please try again.', 'error')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const checkFavoriteStatus = async () => {
    if (!user || !vehicle) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicle.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking favorite status:', error)
        setIsFavorite(false)
        return
      }

      setIsFavorite(!!data)
    } catch (err) {
      console.error('Error checking favorite status:', err)
      setIsFavorite(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  const handleContactSeller = () => {
    if (!user) {
      navigate('/login')
      return
    }

    const message = `Hi, I'm interested in your ${vehicle?.title}.

Vehicle Details:
- Vehicle ID: ${vehicle?.id.slice(-8).toUpperCase()}
- Make: ${vehicle?.make}
- Model: ${vehicle?.model}
- Year: ${vehicle?.year}
- Price: ₹${vehicle?.price.toLocaleString()}
- Location: ${vehicle?.location || 'Not specified'}

My Details:
- Name: ${user?.name || user?.email}
- Email: ${user?.email}
- Phone: ${user?.phone || 'Not provided'}

Is this vehicle still available? Please share more details.`

    const whatsappUrl = `https://wa.me/919746725111?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleGetContactDetails = () => {
    if (!user) {
      navigate('/login')
      return
    }

    const message = `Hi, I would like to get contact details for the ${vehicle?.title}.

Vehicle Details:
- Vehicle ID: ${vehicle?.id.slice(-8).toUpperCase()}
- Make: ${vehicle?.make}
- Model: ${vehicle?.model}
- Year: ${vehicle?.year}
- Price: ₹${vehicle?.price.toLocaleString()}
- Location: ${vehicle?.location || 'Not specified'}

My Details:
- Name: ${user?.name || user?.email}
- Email: ${user?.email}
- Phone: ${user?.phone || 'Not provided'}

Please share the seller's contact information so I can connect directly.`

    const whatsappUrl = `https://wa.me/919746725111?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle) return

    const message = `Hi, I'm interested in a loan for the ${vehicle.title}.

Vehicle Details:
- Vehicle ID: ${vehicle.id.slice(-8).toUpperCase()}
- Make: ${vehicle.make}
- Model: ${vehicle.model}
- Year: ${vehicle.year}
- Price: ₹${vehicle.price.toLocaleString()}
- Location: ${vehicle.location || 'Not specified'}

My Loan Details:
- Name: ${loanFormData.name}
- WhatsApp: ${loanFormData.whatsapp}
- Location: ${loanFormData.place}
- Desired Loan Amount: ₹${loanFormData.amount}

Please help me with the loan process and required documentation.`

    const whatsappUrl = `https://wa.me/919746725111?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setShowLoanForm(false)
    setLoanFormData({ name: user?.name || '', whatsapp: '', place: '', amount: '' })
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatPrice = (price: number) => {
    if (price >= 10_000_000) {
      return `₹${(price / 10_000_000).toFixed(1)} Cr`
    }
    if (price >= 100_000) {
      return `₹${(price / 100_000).toFixed(1)} L`
    }
    if (price >= 1_000) {
      return `₹${(price / 1_000).toFixed(0)}K`
    }
    return `₹${price.toLocaleString()}`
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8">
              <i className="ri-error-warning-line text-3xl sm:text-4xl text-red-500 mb-4"></i>
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">{error || 'Vehicle not found'}</h3>
              <p className="text-red-600 mb-4 sm:mb-6 text-sm sm:text-base">
                The vehicle you're looking for might have been removed or doesn't exist
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/vehicles')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-sm sm:text-base"
                >
                  <i className="ri-car-line mr-2"></i>
                  Browse Vehicles
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-sm sm:text-base"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Successful fetch – render the full details page
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" itemScope itemType="https://schema.org/Product">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600" itemScope itemType="https://schema.org/BreadcrumbList">
            <span itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors cursor-pointer" itemProp="name">
                Home
              </button>
              <meta itemProp="position" content="1" />
            </span>
            <i className="ri-arrow-right-s-line"></i>
            <span itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <button onClick={() => navigate('/vehicles')} className="hover:text-blue-600 transition-colors cursor-pointer" itemProp="name">
                Vehicles
              </button>
              <meta itemProp="position" content="2" />
            </span>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-gray-900 font-medium truncate" itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <span itemProp="name">{vehicle.title}</span>
              <meta itemProp="position" content="3" />
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column – Images + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-100"
                aria-label="Go back to previous page"
              >
                <i className="ri-arrow-left-line"></i>
                <span>Back</span>
              </button>

              {/* Image Gallery */}
              <ImageGallery images={vehicle.images ?? []} title={vehicle.title} />

              {/* Vehicle Details Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {/* Header – title, year, etc. */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" itemProp="name">{vehicle.title}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <span className="flex items-center" itemProp="vehicleModelDate">
                        <i className="ri-calendar-line mr-1"></i>
                        {vehicle.year}
                      </span>
                      {vehicle.mileage && (
                        <span className="flex items-center" itemProp="mileageFromOdometer">
                          <i className="ri-dashboard-line mr-1"></i>
                          {vehicle.mileage.toLocaleString()} km
                        </span>
                      )}
                      {vehicle.location && (
                        <span className="flex items-center">
                          <i className="ri-map-pin-line mr-1"></i>
                          {vehicle.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right" itemScope itemType="https://schema.org/Offer" itemProp="offers">
                    <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1" itemProp="price" content={vehicle.price.toString()}>{formatPrice(vehicle.price)}</div>
                    <div className="text-sm text-gray-500">Best Price</div>
                    <meta itemProp="priceCurrency" content="INR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>

                {/* Key Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <i className="ri-car-line text-xl text-gray-600 mb-2"></i>
                    <div className="text-sm text-gray-500">Make</div>
                    <div className="font-semibold text-gray-900" itemProp="brand">{vehicle.make}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <i className="ri-settings-line text-xl text-gray-600 mb-2"></i>
                    <div className="text-sm text-gray-500">Model</div>
                    <div className="font-semibold text-gray-900" itemProp="model">{vehicle.model}</div>
                  </div>

                  {vehicle.fuel_type && (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <i className="ri-gas-station-line text-xl text-gray-600 mb-2"></i>
                      <div className="text-sm text-gray-500">Fuel</div>
                      <div className="font-semibold text-gray-900 capitalize" itemProp="fuelType">{vehicle.fuel_type}</div>
                    </div>
                  )}

                  {vehicle.transmission && (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <i className="ri-steering-line text-xl text-gray-600 mb-2"></i>
                      <div className="text-sm text-gray-500">Transmission</div>
                      <div className="font-semibold text-gray-900 capitalize" itemProp="vehicleTransmission">{vehicle.transmission}</div>
                    </div>
                  )}
                </div>

                {/* Vehicle Details */}
                {(vehicle.body_type ||
                  vehicle.color ||
                  vehicle.engine_capacity ||
                  vehicle.ownership ||
                  vehicle.registration_year ||
                  vehicle.insurance_validity ||
                  vehicle.num_owners ||
                  vehicle.registration_state ||
                  vehicle.accident_history ||
                  vehicle.service_history) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vehicle.body_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Body Type:</span>
                          <span className="font-medium capitalize">{vehicle.body_type}</span>
                        </div>
                      )}
                      {vehicle.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium capitalize" itemProp="color">{vehicle.color}</span>
                        </div>
                      )}
                      {vehicle.engine_capacity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engine:</span>
                          <span className="font-medium">{vehicle.engine_capacity} cc</span>
                        </div>
                      )}
                      {vehicle.num_owners && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Owners:</span>
                          <span className="font-medium">{vehicle.num_owners} Owner{vehicle.num_owners > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {vehicle.registration_year && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Registration Year:</span>
                          <span className="font-medium">{vehicle.registration_year}</span>
                        </div>
                      )}
                      {vehicle.registration_state && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Registration State:</span>
                          <span className="font-medium">{vehicle.registration_state}</span>
                        </div>
                      )}
                      {vehicle.insurance_expiry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insurance Expiry:</span>
                          <span className="font-medium">{new Date(vehicle.insurance_expiry).toLocaleDateString()}</span>
                        </div>
                      )}
                      {vehicle.seller_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seller Type:</span>
                          <span className="font-medium capitalize">{vehicle.seller_type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Condition */}
                {(vehicle.service_history ||
                  vehicle.tyres_condition ||
                  vehicle.exterior_condition ||
                  vehicle.interior_condition ||
                  vehicle.engine_condition ||
                  vehicle.accident_history ||
                  vehicle.claim_history ||
                  vehicle.parking_type) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vehicle.service_history && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service History:</span>
                          <span className="font-medium capitalize">{vehicle.service_history.replace('_', ' ')}</span>
                        </div>
                      )}
                      {vehicle.tyres_condition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tyres:</span>
                          <span className="font-medium capitalize">{vehicle.tyres_condition.replace('_', ' ')}</span>
                        </div>
                      )}
                      {vehicle.exterior_condition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Exterior:</span>
                          <span className="font-medium capitalize">{vehicle.exterior_condition}</span>
                        </div>
                      )}
                      {vehicle.interior_condition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interior:</span>
                          <span className="font-medium capitalize">{vehicle.interior_condition}</span>
                        </div>
                      )}
                      {vehicle.engine_condition && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engine:</span>
                          <span className="font-medium capitalize">{vehicle.engine_condition}</span>
                        </div>
                      )}
                      {vehicle.accident_history && vehicle.accident_history !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accident History:</span>
                          <span className="font-medium capitalize">{vehicle.accident_history} Accident</span>
                        </div>
                      )}
                      {vehicle.claim_history && vehicle.claim_history !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insurance Claims:</span>
                          <span className="font-medium">Previous Claims</span>
                        </div>
                      )}
                      {vehicle.parking_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Parking:</span>
                          <span className="font-medium capitalize">{vehicle.parking_type} Parked</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Features */}
                {(vehicle.duplicate_key ||
                  vehicle.loan_available ||
                  vehicle.exchange_accepted ||
                  vehicle.negotiable ||
                  vehicle.test_drive_available) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.duplicate_key && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          <i className="ri-key-line mr-1"></i>
                          Second Key Available
                        </span>
                      )}
                      {vehicle.loan_available && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          <i className="ri-bank-line mr-1"></i>
                          Loan Available
                        </span>
                      )}
                      {vehicle.exchange_accepted && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                          <i className="ri-exchange-line mr-1"></i>
                          Exchange Accepted
                        </span>
                      )}
                      {vehicle.negotiable && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                          <i className="ri-price-tag-line mr-1"></i>
                          Price Negotiable
                        </span>
                      )}
                      {vehicle.test_drive_available && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-teal-100 text-teal-800">
                          <i className="ri-steering-line mr-1"></i>
                          Test Drive Available
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Certificate Validity */}
                {(vehicle.fitness_valid_until || vehicle.pollution_valid_until) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Validity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vehicle.fitness_valid_until && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fitness Valid Until:</span>
                          <span className="font-medium">{new Date(vehicle.fitness_valid_until).toLocaleDateString()}</span>
                        </div>
                      )}
                      {vehicle.pollution_valid_until && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pollution Valid Until:</span>
                          <span className="font-medium">{new Date(vehicle.pollution_valid_until).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {vehicle.additional_notes && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{vehicle.additional_notes}</p>
                  </div>
                )}

                {/* Description */}
                {vehicle.description && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap" itemProp="description">{vehicle.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column – Contact & Tips */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Seller</h3>

                {vehicle.seller_name && (
                  <div className="flex items-center space-x-3 mb-4" itemScope itemType="https://schema.org/Person" itemProp="seller">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-blue-600"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900" itemProp="name">{vehicle.seller_name}</div>
                      <div className="text-sm text-gray-500">Verified Seller</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                    aria-label="Send message to seller via WhatsApp"
                  >
                    <i className="ri-message-line mr-2"></i>
                    Send Message
                  </button>

                  <button
                    onClick={handleGetContactDetails}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                    aria-label="Get seller contact details"
                  >
                    <i className="ri-phone-line mr-2"></i>
                    Get Contact Details
                  </button>

                  <button
                    onClick={() => setShowLoanForm(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                    aria-label="Apply for vehicle loan"
                  >
                    <i className="ri-bank-line mr-2"></i>
                    Looking for Loan
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer ${
                      isFavorite
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favoriteLoading ? (
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                    ) : (
                      <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'} mr-2`}></i>
                    )}
                    {favoriteLoading
                      ? 'Updating...'
                      : isFavorite
                      ? 'Remove from Favorites'
                      : 'Save to Favorites'}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-500 text-center space-y-1">
                    <p>Listed {new Date(vehicle.created_at).toLocaleDateString()}</p>
                    <p>Vehicle ID: {vehicle.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                  <i className="ri-shield-check-line mr-2"></i>
                  Safety Tips
                </h4>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the vehicle thoroughly</li>
                  <li>• Verify all documents</li>
                  <li>• Don't pay advance without inspection</li>
                  <li>• Contact details will be shared after verification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Similar Vehicles */}
          <div className="mt-8 sm:mt-12">
            <SimilarVehicles vehicleType={vehicle.vehicle_type} currentVehicleId={vehicle.id} make={vehicle.make} />
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && <ContactForm vehicle={vehicle} onClose={() => setShowContactForm(false)} />}

      {/* Loan Form Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Loan Inquiry</h3>
                <p className="text-sm text-gray-600 mt-1">Get loan assistance for {vehicle.title}</p>
              </div>
              <button
                onClick={() => setShowLoanForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close loan form"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>

            <form onSubmit={handleLoanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={loanFormData.name}
                  onChange={(e) => setLoanFormData({ ...loanFormData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={loanFormData.whatsapp}
                  onChange={(e) => setLoanFormData({ ...loanFormData, whatsapp: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Enter your WhatsApp number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  required
                  value={loanFormData.place}
                  onChange={(e) => setLoanFormData({ ...loanFormData, place: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desired Loan Amount</label>
                <input
                  type="text"
                  required
                  value={loanFormData.amount}
                  onChange={(e) => setLoanFormData({ ...loanFormData, amount: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="e.g. 500000"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLoanForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center"
                >
                  <i className="ri-logo-whatsapp mr-2"></i>
                  Send via WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
