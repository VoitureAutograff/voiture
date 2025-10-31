import { useState, useRef, useEffect } from 'react';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  watermarkOpacity?: number;
}

export default function WatermarkedImage({ 
  src, 
  alt, 
  className = '', 
  watermarkOpacity = 0.3 
}: WatermarkedImageProps) {
  const [watermarkedSrc, setWatermarkedSrc] = useState<string>(src);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src || src.includes('voiture-watermark')) {
      setWatermarkedSrc(src);
      return;
    }

    const addWatermark = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load main image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = async () => {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw main image
          ctx.drawImage(img, 0, 0);

          // Load watermark logo
          const watermarkImg = new Image();
          watermarkImg.crossOrigin = 'anonymous';
          
          watermarkImg.onload = () => {
            // Calculate watermark size (10% of image width, max 150px)
            const watermarkSize = Math.min(img.width * 0.1, 150);
            const aspectRatio = watermarkImg.width / watermarkImg.height;
            const watermarkWidth = watermarkSize;
            const watermarkHeight = watermarkSize / aspectRatio;

            // Position watermark at bottom right with padding
            const padding = 20;
            const x = img.width - watermarkWidth - padding;
            const y = img.height - watermarkHeight - padding;

            // Apply opacity
            ctx.globalAlpha = watermarkOpacity;
            
            // Draw watermark
            ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);

            // Convert to data URL
            const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setWatermarkedSrc(watermarkedDataUrl);
          };

          watermarkImg.onerror = () => {
            // If watermark fails to load, use original image
            setWatermarkedSrc(src);
          };

          watermarkImg.src = 'https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/6946ab200827b1a3dad2a3b3ab7d0afe.jfif';
        };

        img.onerror = () => {
          setWatermarkedSrc(src);
        };

        img.src = src;
      } catch (error) {
        console.error('Error adding watermark:', error);
        setWatermarkedSrc(src);
      }
    };

    addWatermark();
  }, [src, watermarkOpacity]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img
        src={watermarkedSrc}
        alt={alt}
        className={className}
        loading="lazy"
      />
    </>
  );
}