"use client";

import { useCallback, useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import Resizer from 'react-image-file-resizer';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
  position?: { x: number; y: number };
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onCancel,
  onConfirm,
  position = { x: 100, y: 100 },
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 160,
    height: 214,
    x: 50,
    y: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = 160;
      canvas.height = 214;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        160,
        214
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', 0.8);
      });
    },
    []
  );

  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        160, // maxWidth - sesuai dengan crop size
        214, // maxHeight - sesuai dengan crop size
        'JPEG', // compressFormat
        85, // quality
        0, // rotation
        (uri) => {
          // Convert base64 to File
          fetch(uri as string)
            .then(res => res.blob())
            .then(blob => {
              const compressedFile = new File([blob], `compressed-${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            });
        },
        'base64' // outputType
      );
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Compress the cropped image
      const compressedFile = await compressImage(croppedFile);
      onConfirm(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image');
    }
  }, [completedCrop, getCroppedImg, compressImage, onConfirm]);

  if (!isOpen) return null;

  const modalStyle = {
    position: 'absolute' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    maxWidth: '400px',
    backgroundColor: '#121212',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    zIndex: 50,
    padding: '16px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    margin: 0
  };

  const closeButtonStyle = {
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'color 0.2s ease'
  };

  const closeButtonHoverStyle = {
    color: '#374151'
  };

  const cropContainerStyle = {
    marginBottom: '12px'
  };

  const imageStyle = {
    maxHeight: '300px',
    maxWidth: '100%'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  };

  const cancelButtonStyle = {
    padding: '4px 12px',
    fontSize: '14px',
    border: '1px solid #3fc0ff',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  };

  const cancelButtonHoverStyle = {
    backgroundColor: '#3fc0ff'
  };

  const confirmButtonStyle = {
    padding: '4px 12px',
    fontSize: '14px',
    backgroundColor: '#039be5',
    color: 'white',
    border: '1px solid #3fc0ff',
    borderRadius: '4px',
    cursor: completedCrop ? 'pointer' : 'not-allowed',
    transition: 'background-color 0.2s ease'
  };

  const confirmButtonHoverStyle = {
    backgroundColor: '#2563eb'
  };

  return (
    <div style={modalStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Crop Image</h3>
        <button 
          onClick={onCancel}
          style={closeButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = closeButtonHoverStyle.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = closeButtonStyle.color;
          }}
        >
          ×
        </button>
      </div>
      
      <div style={cropContainerStyle}>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={160/214}
          minWidth={160}
          minHeight={214}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            style={imageStyle}
            onLoad={() => {
              // Set initial crop when image loads
              if (imgRef.current) {
                const { width, height } = imgRef.current;
                const centerX = Math.max(0, (width - 160) / 2);
                const centerY = Math.max(0, (height - 214) / 2);
                
                setCompletedCrop({
                  unit: 'px',
                  x: centerX,
                  y: centerY,
                  width: 160,
                  height: 214,
                });
              }
            }}
          />
        </ReactCrop>
      </div>

      <div style={buttonContainerStyle}>
        <button
          onClick={onCancel}
          style={cancelButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = cancelButtonHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = cancelButtonStyle.backgroundColor;
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          style={confirmButtonStyle}
          disabled={!completedCrop}
          onMouseEnter={(e) => {
            if (completedCrop) {
              e.currentTarget.style.backgroundColor = confirmButtonHoverStyle.backgroundColor;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = confirmButtonStyle.backgroundColor;
          }}
        >
          Crop & Save
        </button>
      </div>
    </div>
  );
};

export default ImageCropModal;