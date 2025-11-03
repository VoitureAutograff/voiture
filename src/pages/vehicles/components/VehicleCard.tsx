
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number | null;
  location: string | null;
  images: string[] | null;
  fuel_type: string | null;
  transmission: string | null;
  vehicle_type: 'car' | 'bike';
  created_at: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if vehicle is already favorited on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicle.id)
          .single();

        if (!error && data) {
          setIsFavorited(true);
        }
      } catch (error) {
        // Not favorited
        setIsFavorited(false);
      }
    };

    checkFavoriteStatus();
  }, [user, vehicle.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicle.id);

        if (!error) {
          setIsFavorited(false);
        } else {
          console.error('Error removing favorite:', error);
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            vehicle_id: vehicle.id,
          });

        if (!error) {
          setIsFavorited(true);
        } else {
          console.error('Error adding favorite:', error);
        }
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(0)}K`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const getImageUrl = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images[0];
    }
    // Fallback to a generated image based on vehicle attributes
    return `https://readdy.ai/api/search-image?query=Modern%20$%7Bvehicle.vehicle_type%7D%20$%7Bvehicle.make%7D%20$%7Bvehicle.model%7D%20professional%20automotive%20photography%20clean%20background&width=400&height=300&seq=${vehicle.id}&orientation=landscape`;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={getImageUrl()}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          disabled={isLoading}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          <i className={`${isFavorited ? 'ri-heart-fill' : 'ri-heart-line'} text-sm sm:text-base`}></i>
        </button>

        {/* Vehicle Type Badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
            {vehicle.vehicle_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
          {vehicle.title}
        </h3>

        {/* Vehicle Details */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600">
          <span className="flex items-center space-x-1">
            <i className="ri-calendar-line text-xs sm:text-sm"></i>
            <span>{vehicle.year}</span>
          </span>
          {vehicle.mileage && (
            <>
              <span className="text-gray-300">•</span>
              <span className="flex items-center space-x-1">
                <i className="ri-gas-station-line text-xs sm:text-sm"></i>
                <span>{vehicle.mileage.toLocaleString()} km</span>
              </span>
            </>
          )}
        </div>

        {/* Fuel & Transmission */}
        {(vehicle.fuel_type || vehicle.transmission) && (
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600">
            {vehicle.fuel_type && (
              <span className="flex items-center space-x-1">
                <i className="ri-fuel-percent-line text-xs sm:text-sm"></i>
                <span>{vehicle.fuel_type}</span>
              </span>
            )}
            {vehicle.fuel_type && vehicle.transmission && (
              <span className="text-gray-300">•</span>
            )}
            {vehicle.transmission && (
              <span className="flex items-center space-x-1">
                <i className="ri-settings-3-line text-xs sm:text-sm"></i>
                <span>{vehicle.transmission}</span>
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {vehicle.location && (
          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
            <i className="ri-map-pin-line text-xs sm:text-sm"></i>
            <span className="truncate">{vehicle.location}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="text-lg sm:text-xl font-bold text-blue-600">{formatPrice(vehicle.price)}</div>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap">
            View Details
            <i className="ri-arrow-right-line ml-1"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
