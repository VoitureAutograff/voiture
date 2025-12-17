
import { useState, useRef } from 'react';

interface ProfilePictureProps {
  userId?: string;
  currentPicture?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onUpdate?: (newPictureUrl: string) => void;
  onUpload?: (file: File) => Promise<{ data: { url: string } | null; error: Error | null }>;
  src?: string | null;
}

export default function ProfilePicture({ 
  currentPicture, 
  name = 'User', 
  size = 'md', 
  editable = false,
  onUpdate,
  onUpload,
  src
}: ProfilePictureProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    setError(null);
    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file: File) => {
    if (!onUpload) return;

    try {
      setUploading(true);
      setUploadProgress(25);

      const result = await onUpload(file);

      setUploadProgress(75);

      if (result.error) {
        throw result.error;
      }

      if (result.data?.url) {
        setUploadProgress(100);
        
        // Call callback if provided
        if (onUpdate) {
          onUpdate(result.data.url);
        }

        console.log('✅ Profile picture updated successfully');
      }
      
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error.message);
      setError(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setError(null);
      }, 2000);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
    
    return name
      .trim()
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Use src prop or currentPicture, with proper fallback
  const imageSource = src || currentPicture;
  const displayName = name || 'User';

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold relative`}>
        {imageSource ? (
          <img
            src={imageSource}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <span>{getInitials(displayName)}</span>
        )}
        
        {/* Fallback initials (hidden by default) */}
        <span className={`absolute inset-0 flex items-center justify-center ${imageSource ? 'hidden' : ''}`}>
          {getInitials(displayName)}
        </span>

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-xs">
              {uploadProgress < 100 ? `${uploadProgress}%` : '✓'}
            </div>
          </div>
        )}
      </div>

      {/* Edit button */}
      {editable && onUpload && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full p-1.5 shadow-lg transition-colors cursor-pointer"
            title="Change profile picture"
          >
            <i className="ri-camera-line text-xs"></i>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-50 border border-red-200 text-red-600 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
