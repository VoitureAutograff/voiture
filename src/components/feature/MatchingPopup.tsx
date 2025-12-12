import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface VehicleMatch {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  location?: string
  contact_number?: string
  posted_by: string
  created_at: string
}

interface RequirementMatch {
  id: string
  make?: string
  model?: string
  year_range_min?: number
  year_range_max?: number
  price_range_min?: number
  price_range_max?: number
  location?: string
  description?: string
  posted_by: string
  users?: {
    name: string
    email: string
    phone?: string
  }
}

interface MatchingPopupProps {
  isOpen: boolean
  onClose: () => void
  onDontShowAgain?: () => void
  type: 'vehicle-matches-requirement' | 'requirement-matches-vehicle'
  vehicleData?: {
    make: string
    model: string
    year: number
    vehicle_type: 'car' | 'bike'
  }
  requirementData?: {
    make?: string
    model?: string
    year_range_min?: number
    year_range_max?: number
    vehicle_type: 'car' | 'bike'
  }
  matches: VehicleMatch[] | RequirementMatch[]
}

export default function MatchingPopup({
  isOpen,
  onClose,
  onDontShowAgain,
  type,
  vehicleData,
  requirementData,
  matches
}: MatchingPopupProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<VehicleMatch | RequirementMatch | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleContactClick = (match: VehicleMatch | RequirementMatch) => {
    setSelectedMatch(match)
    setShowContactForm(true)
  }

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedMatch) return

    const whatsappNumber = '919746725111'

    let matchDetails = ''

    if (type === 'vehicle-matches-requirement') {
      const req = selectedMatch as RequirementMatch
      matchDetails = `Requirement Details:
- Make: ${req.make || 'Any'}
- Model: ${req.model || 'Any'}
- Year Range: ${req.year_range_min || 'Any'} - ${req.year_range_max || 'Any'}
- Price Range: ${req.price_range_min || 'Any'} - ${req.price_range_max || 'Any'}
- Location: ${req.location || 'Any'}
Description: ${req.description || 'N/A'}`
    } else {
      const veh = selectedMatch as VehicleMatch
      matchDetails = `Vehicle Details:
- Title: ${veh.title}
- Make: ${veh.make}
- Model: ${veh.model}
- Year: ${veh.year}
- Price: ₹${veh.price.toLocaleString('en-IN')}
- Location: ${veh.location || 'Not specified'}`
    }

    const message = `New match contact from matching popup.

Context: ${
      type === 'vehicle-matches-requirement'
        ? 'User has posted a vehicle that matches a requirement.'
        : 'User has a requirement that matches a vehicle.'
    }

${matchDetails}

Contact Details:
- Name: ${contactForm.name}
- Phone: ${contactForm.phone}
- Email: ${contactForm.email}

Message from user:
${contactForm.message || 'No additional message provided.'}`

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')

    setShowContactForm(false)
    setSelectedMatch(null)
    setContactForm({ name: '', phone: '', email: '', message: '' })
  }

  const getMatchTitle = () => {
    if (type === 'vehicle-matches-requirement') {
      return 'Your vehicle matches these requirements!'
    } else {
      return 'Your requirement matches these vehicles!'
    }
  }

  const getMatchDescription = () => {
    if (type === 'vehicle-matches-requirement') {
      return `People are looking for a ${vehicleData?.year} ${vehicleData?.make} ${vehicleData?.model}. Contact them to sell your vehicle!`
    } else {
      return `These vehicles match your requirement for a ${requirementData?.make || 'any make'} ${requirementData?.model || 'any model'}.`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{getMatchTitle()}</h2>
              <p className="text-blue-100">{getMatchDescription()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Matches List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-search-line text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No matches found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {type === 'vehicle-matches-requirement' ? (
                        // Requirement match display
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            Looking for: {(match as RequirementMatch).make} {(match as RequirementMatch).model}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            {(match as RequirementMatch).year_range_min && (
                              <p>Year: {(match as RequirementMatch).year_range_min} - {(match as RequirementMatch).year_range_max || 'Any'}</p>
                            )}
                            {(() => {
                              const req = match as RequirementMatch
                              if (req.price_range_min === undefined) return null

                              return (
                                <p>
                                  Budget: {formatPrice(req.price_range_min)} -{' '}
                                  {req.price_range_max !== undefined
                                    ? formatPrice(req.price_range_max)
                                    : 'Any'}
                                </p>
                              )
                            })()}
                            {(match as RequirementMatch).location && (
                              <p>Location: {(match as RequirementMatch).location}</p>
                            )}
                            {(match as RequirementMatch).description && (
                              <p className="mt-2">{(match as RequirementMatch).description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Posted by: {(match as RequirementMatch).users?.name || 'Anonymous'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Vehicle match display
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {(match as VehicleMatch).year} {(match as VehicleMatch).make} {(match as VehicleMatch).model}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Price: {formatPrice((match as VehicleMatch).price)}</p>
                            {(match as VehicleMatch).location && (
                              <p>Location: {(match as VehicleMatch).location}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Posted on: {new Date((match as VehicleMatch).created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {type === 'vehicle-matches-requirement' ? (
                        <a
                          href="/requirements"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap inline-block"
                          onClick={onClose}
                        >
                          View Requirement
                        </a>
                      ) : (
                        <Link
                          to={`/vehicles/${match.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                          onClick={onClose}
                        >
                          View Vehicle
                        </Link>
                      )}
                      
                      <button
                        onClick={() => handleContactClick(match)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Found {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </p>
          <div className="flex gap-2 justify-end">
            {onDontShowAgain && (
              <button
                onClick={onDontShowAgain}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Don't show again
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactForm && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Contact Poster</h3>
            
            {type === 'vehicle-matches-requirement' ? (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  You're contacting someone looking for: {(selectedMatch as RequirementMatch).make} {(selectedMatch as RequirementMatch).model}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  You're contacting the seller of: {(selectedMatch as VehicleMatch).year} {(selectedMatch as VehicleMatch).make} {(selectedMatch as VehicleMatch).model}
                </p>
              </div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone *</label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add a message (optional)"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
