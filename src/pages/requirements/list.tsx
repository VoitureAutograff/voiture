
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import RequirementForm from '../home/components/RequirementForm';

interface Requirement {
  id: string;
  posted_by: string;
  vehicle_type: 'car' | 'bike';
  make: string | null;
  model: string | null;
  year_range_min: number | null;
  year_range_max: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  location: string | null;
  description: string | null;
  status: 'pending' | 'open' | 'matched' | 'closed';
  created_at: string;
  users?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function RequirementsList() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'car' | 'bike'>('all');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    requirement: Requirement | null;
  }>({ isOpen: false, requirement: null });
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);

      // FIXED: Query for open requirements with user details
      const { data, error: fetchError } = await supabase
        .from('requirements')
        .select(`
          *,
          users:posted_by (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ Fetched requirements with users:', data?.length || 0);
      setRequirements(data || []);
    } catch (err: any) {
      console.error('Error fetching requirements:', err.message);
      setError('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredRequirements = requirements.filter(req => 
    filter === 'all' || req.vehicle_type === filter
  );

  const handleContactSeller = (requirement: Requirement) => {
    setContactModal({ isOpen: true, requirement });
    setContactForm({
      name: '',
      phone: '',
      email: '',
      message: `Hi! I have a ${requirement.vehicle_type} that matches your requirements. Here are the details:\n\nRequirement ID: ${requirement.id}\nVehicle Type: ${requirement.vehicle_type}\nMake/Model: ${[requirement.make, requirement.model].filter(Boolean).join(' ')}\nPrice Range: ${requirement.price_range_min && requirement.price_range_max ? `${formatPrice(requirement.price_range_min)} - ${formatPrice(requirement.price_range_max)}` : 'As per requirement'}\n\nI would like to discuss this with you.`
    });
  };

  const handleSubmitContact = () => {
    if (!contactModal.requirement) return;
    
    const requirement = contactModal.requirement;
    const whatsappMessage = `Hi! I have a ${requirement.vehicle_type} that matches your requirements.

*Requirement Details:*
- ID: ${requirement.id}
- Vehicle Type: ${requirement.vehicle_type}
- Make/Model: ${[requirement.make, requirement.model].filter(Boolean).join(' ')}
- Year Range: ${requirement.year_range_min && requirement.year_range_max ? `${requirement.year_range_min} - ${requirement.year_range_max}` : 'As specified'}
- Price Range: ${requirement.price_range_min && requirement.price_range_max ? `${formatPrice(requirement.price_range_min)} - ${formatPrice(requirement.price_range_max)}` : 'As per requirement'}
- Location: ${requirement.location || 'As specified'}

*My Contact Details:*
- Name: ${contactForm.name}
- Phone: ${contactForm.phone}
- Email: ${contactForm.email}

*Message:*
${contactForm.message}

I would like to discuss this vehicle with you.`;

    const whatsappUrl = `https://wa.me/919746725111?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    setContactModal({ isOpen: false, requirement: null });
    setContactForm({ name: '', phone: '', email: '', message: '' });
  };

  const handlePostRequirement = () => {
    setShowRequirementForm(true);
  };

  const handleCloseRequirementForm = () => {
    setShowRequirementForm(false);
    // Refresh requirements after posting
    fetchRequirements();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requirements...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8">
              <i className="ri-error-warning-line text-3xl sm:text-4xl text-red-500 mb-4"></i>
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Failed to Load Requirements</h3>
              <p className="text-red-600 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-sm sm:text-base"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Go Back
                </button>
                <button
                  onClick={fetchRequirements}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center text-sm sm:text-base"
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <button 
                  onClick={() => navigate('/')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Home
                </button>
                <i className="ri-arrow-right-s-line"></i>
                <span className="text-gray-900 font-medium">Requirements</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Vehicle Requirements</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {filteredRequirements.length} active requirement{filteredRequirements.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <i className="ri-arrow-left-line"></i>
                <span>Back</span>
              </button>
              <button
                onClick={handlePostRequirement}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center text-sm sm:text-base"
              >
                <i className="ri-add-line mr-2"></i>
                Post Your Requirement
              </button>
              <Link
                to="/vehicles"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center text-sm sm:text-base"
              >
                <i className="ri-search-line mr-2"></i>
                Browse Vehicles
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'car', 'bike'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Requirements' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-file-search-line text-4xl sm:text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Requirements Found</h3>
              <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                There are currently no active requirements matching your criteria.
              </p>
              <Link
                to="/vehicles"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center text-sm sm:text-base"
              >
                <i className="ri-search-line mr-2"></i>
                Browse Available Vehicles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRequirements.map((requirement) => (
                <div key={requirement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <i className={`${requirement.vehicle_type === 'car' ? 'ri-car-line' : 'ri-motorcycle-line'} text-xl sm:text-2xl text-blue-600 mr-3`}></i>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize text-sm sm:text-base">
                          {requirement.vehicle_type} Required
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Posted by {requirement.users?.name || 'Anonymous'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      requirement.status === 'open' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {requirement.status}
                    </span>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    {(requirement.make || requirement.model) && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <i className="ri-car-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span>
                          {[requirement.make, requirement.model].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}

                    {(requirement.year_range_min || requirement.year_range_max) && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <i className="ri-calendar-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span>
                          {requirement.year_range_min && requirement.year_range_max
                            ? `${requirement.year_range_min} - ${requirement.year_range_max}`
                            : requirement.year_range_min
                            ? `From ${requirement.year_range_min}`
                            : `Up to ${requirement.year_range_max}`}
                        </span>
                      </div>
                    )}

                    {(requirement.price_range_min || requirement.price_range_max) && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <i className="ri-money-dollar-circle-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span>
                          {requirement.price_range_min && requirement.price_range_max
                            ? `${formatPrice(requirement.price_range_min)} - ${formatPrice(requirement.price_range_max)}`
                            : requirement.price_range_min
                            ? `From ${formatPrice(requirement.price_range_min)}`
                            : `Up to ${formatPrice(requirement.price_range_max!)}`
                          }
                        </span>
                      </div>
                    )}

                    {requirement.location && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <i className="ri-map-pin-line mr-2 w-4 h-4 flex items-center justify-center"></i>
                        <span>{requirement.location}</span>
                      </div>
                    )}

                    {requirement.description && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                          {requirement.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(requirement.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleContactSeller(requirement)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center"
                    >
                      <i className="ri-whatsapp-line mr-1"></i>
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Requirement Form Modal */}
      {showRequirementForm && (
        <RequirementForm onClose={handleCloseRequirementForm} />
      )}

      {/* Contact Modal */}
      {contactModal.isOpen && contactModal.requirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Requirement Owner</h3>
                <button
                  onClick={() => setContactModal({ isOpen: false, requirement: null })}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Requirement by:</p>
                <p className="font-medium text-gray-900">{contactModal.requirement.users?.name || 'Anonymous'}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {contactModal.requirement.vehicle_type} • {[contactModal.requirement.make, contactModal.requirement.model].filter(Boolean).join(' ')}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitContact(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter your WhatsApp number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="Describe your vehicle details..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{contactForm.message.length}/500 characters</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setContactModal({ isOpen: false, requirement: null })}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-whatsapp-line mr-2"></i>
                    Send WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
