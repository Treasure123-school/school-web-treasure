import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { Slider } from './slider';
import { getCroppedImg } from '@/lib/cropImage';
import { Crop, ZoomIn, RotateCw } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
  shape?: 'rect' | 'round';
}

export function ImageCropDialog({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  shape = 'rect'
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]" data-testid="dialog-crop-image">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-muted/30 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={shape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
          />
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
              data-testid="slider-zoom"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation
              </label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
              data-testid="slider-rotation"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            data-testid="button-cancel-crop"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCropConfirm}
            disabled={isProcessing || !croppedAreaPixels}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
            data-testid="button-confirm-crop"
          >
            {isProcessing ? 'Processing...' : 'Crop & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
