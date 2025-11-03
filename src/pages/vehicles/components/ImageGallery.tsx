
import { useState } from 'react';
import WatermarkedImage from '../../../components/base/WatermarkedImage';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Default images if none provided
  const defaultImages = [
    `https://readdy.ai/api/search-image?query=modern%20$%7Btitle.toLowerCase%28%29%7D%20luxury%20vehicle%20interior%20dashboard%20steering%20wheel%20premium%20leather%20seats%20clean%20bright%20automotive%20photography%20professional%20lighting&width=800&height=600&seq=gallery1&orientation=landscape`,
    `https://readdy.ai/api/search-image?query=$%7Btitle.toLowerCase%28%29%7D%20exterior%20side%20view%20profile%20sleek%20design%20modern%20automotive%20photography%20clean%20background%20professional%20studio%20lighting&width=800&height=600&seq=gallery2&orientation=landscape`,
    `https://readdy.ai/api/search-image?query=$%7Btitle.toLowerCase%28%29%7D%20front%20view%20headlights%20grille%20modern%20design%20automotive%20photography%20clean%20background%20professional%20lighting&width=800&height=600&seq=gallery3&orientation=landscape`,
    `https://readdy.ai/api/search-image?query=$%7Btitle.toLowerCase%28%29%7D%20rear%20view%20back%20lights%20modern%20design%20automotive%20photography%20clean%20background%20professional%20studio%20lighting&width=800&height=600&seq=gallery4&orientation=landscape`
  ];

  const displayImages = images && images.length > 0 ? images : defaultImages;

  const goToPrevious = () => {
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : displayImages.length - 1);
  };

  const goToNext = () => {
    setSelectedIndex(selectedIndex < displayImages.length - 1 ? selectedIndex + 1 : 0);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Main Image */}
        <div className="relative mb-4">
          <WatermarkedImage
            src={displayImages[selectedIndex]}
            alt={`Vehicle image ${selectedIndex + 1}`}
            className="w-full h-96 object-cover rounded-xl"
          />
          
          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-line text-xl"></i>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {displayImages.length}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute bottom-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-fullscreen-line text-lg"></i>
          </button>
        </div>

        {/* Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 relative cursor-pointer ${
                  selectedIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <WatermarkedImage
                  src={image}
                  alt={`Vehicle thumbnail ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                  watermarkOpacity={0.2}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative max-w-7xl max-h-full p-4">
            <img
              src={displayImages[selectedIndex]}
              alt={`${title} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>

            {/* Navigation in Fullscreen */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-right-line text-xl"></i>
                </button>
              </>
            )}

            {/* Image Counter in Fullscreen */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
