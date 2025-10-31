
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchFilters() {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState('all');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const vehicleData = {
    car: {
      Toyota: ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Prius', 'Etios', 'Yaris'],
      Honda: ['City', 'Civic', 'Accord', 'CR-V', 'Jazz', 'WR-V', 'Amaze'],
      BMW: ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'Z4', '7 Series'],
      Mercedes: ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class'],
      Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'A8'],
      Ford: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Mustang', 'Freestyle'],
      Hyundai: ['i20', 'Creta', 'Verna', 'Venue', 'Tucson', 'Elantra'],
      'Maruti Suzuki': ['Alto', 'Swift', 'Baleno', 'Dzire', 'Vitara Brezza', 'Ertiga', 'Ciaz']
    },
    bike: {
      Honda: ['Activa', 'CB Shine', 'Dio', 'CBR', 'Unicorn', 'Grazia'],
      Yamaha: ['FZ', 'R15', 'MT-15', 'Fascino', 'Ray ZR', 'FZ25'],
      Bajaj: ['Pulsar', 'Avenger', 'Dominar', 'CT100', 'Platina', 'KTM Duke'],
      TVS: ['Apache', 'Jupiter', 'XL100', 'Ntorq', 'Sport', 'Radeon'],
      KTM: ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 390'],
      'Royal Enfield': ['Classic 350', 'Bullet 350', 'Himalayan', 'Interceptor 650', 'Continental GT', 'Meteor 350'],
      Hero: ['Splendor', 'HF Deluxe', 'Passion Pro', 'Xtreme', 'Maestro', 'Destini'],
      Suzuki: ['Access', 'Gixxer', 'Burgman', 'Hayabusa', 'V-Strom']
    }
  };

  // Get all makes from both car and bike
  const carMakes = Object.keys(vehicleData.car);
  const bikeMakes = Object.keys(vehicleData.bike);
  const allMakes = [...new Set([...carMakes, ...bikeMakes])].sort();
  
  // Determine available makes based on vehicle type
  const availableMakes = vehicleType === 'all' 
    ? allMakes 
    : vehicleType === 'bike' 
      ? bikeMakes 
      : carMakes;

  // Filter makes based on user input
  const filteredMakes = availableMakes.filter(makeName =>
    makeName.toLowerCase().includes(make.toLowerCase())
  );

  // Get available models based on make and vehicle type
  const getAvailableModels = () => {
    if (!make) return [];
    
    const models: string[] = [];
    
    if (vehicleType === 'all') {
      // Check both car and bike data
      const carModels = (vehicleData.car as Record<string, string[]>)[make];
      if (carModels) models.push(...carModels);
      const bikeModels = (vehicleData.bike as Record<string, string[]>)[make];
      if (bikeModels) models.push(...bikeModels);
    } else if (vehicleType === 'car') {
      const data = (vehicleData.car as Record<string, string[]>)[make];
      if (data) models.push(...data);
    } else if (vehicleType === 'bike') {
      const data = (vehicleData.bike as Record<string, string[]>)[make];
      if (data) models.push(...data);
    }
    
    return [...new Set(models)]; // Remove duplicates
  };

  const availableModels = getAvailableModels();

  // Filter models based on user input
  const filteredModels = availableModels.filter(modelName =>
    modelName.toLowerCase().includes(model.toLowerCase())
  );

  const handleMakeChange = (newMake: string) => {
    setMake(newMake);
    setShowMakeDropdown(true);
  };

  const handleMakeSelect = (selectedMake: string) => {
    setMake(selectedMake);
    setModel(''); // Reset model when make changes
    setShowMakeDropdown(false);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setShowModelDropdown(true);
  };

  const handleModelSelect = (selectedModel: string) => {
    setModel(selectedModel);
    setShowModelDropdown(false);
  };

  const handleVehicleTypeChange = (type: string) => {
    setVehicleType(type);
    setMake('');
    setModel('');
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (vehicleType !== 'all') params.set('vehicleType', vehicleType);
    if (make) params.set('make', make);
    if (model) params.set('model', model);
    if (searchQuery) params.set('search', searchQuery);
    
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Find Your Vehicle</h2>
          <p className="text-gray-600 text-base sm:text-lg">Use our advanced filters to find exactly what you're looking for</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleVehicleTypeChange('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    vehicleType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleVehicleTypeChange('car')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    vehicleType === 'car' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-car-line mr-1"></i>
                  Cars
                </button>
                <button
                  onClick={() => handleVehicleTypeChange('bike')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    vehicleType === 'bike' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-motorbike-line mr-1"></i>
                  Bikes
                </button>
              </div>
            </div>

            {/* Make - Typable with Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => handleMakeChange(e.target.value)}
                onFocus={() => setShowMakeDropdown(true)}
                onBlur={() => setTimeout(() => setShowMakeDropdown(false), 200)}
                placeholder="Type or select make"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              
              {/* Make Dropdown */}
              {showMakeDropdown && filteredMakes.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredMakes.map((makeName, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMakeSelect(makeName)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {makeName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model - Typable with Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                onFocus={() => setShowModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                placeholder="Type or select model"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />

              {/* Model Dropdown */}
              {showModelDropdown && filteredModels.length > 0 && make && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredModels.map((modelName, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleModelSelect(modelName)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {modelName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-search-line mr-2"></i>
                Search
              </button>
            </div>
          </div>

          {/* Search Query - Full width row */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Vehicle</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vehicle name, model, features, or any specific details..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: "Swift Dzire", "automatic transmission", "sunroof", "diesel engine"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
