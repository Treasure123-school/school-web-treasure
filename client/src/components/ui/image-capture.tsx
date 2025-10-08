import { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Camera, Upload, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageCaptureProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  required?: boolean;
  className?: string;
  shape?: 'circle' | 'square';
}

export function ImageCapture({
  value,
  onChange,
  label = 'Upload Image',
  required = false,
  className = '',
  shape = 'circle'
}: ImageCaptureProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStream(stream);
      setIsCameraMode(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraMode(false);
  }, [cameraStream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onChange(file);
            stopCamera();
            setShowDialog(false);
            toast({
              title: "Photo Captured",
              description: "Your photo has been captured successfully.",
            });
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      onChange(file);
      setShowDialog(false);
      toast({
        title: "Image Selected",
        description: `${file.name} ready to upload`,
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    setShowDialog(false);
  };

  const previewUrl = value ? URL.createObjectURL(value) : null;

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className={`${
            shape === 'circle' ? 'rounded-full' : 'rounded-xl'
          } h-32 w-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg`}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                data-testid="image-preview"
              />
            ) : (
              <Camera className="h-12 w-12 text-gray-400" />
            )}
          </div>
          {value && (
            <button
              onClick={() => onChange(null)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
              data-testid="button-remove-image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setShowDialog(true)}
            variant="outline"
            size="sm"
            data-testid="button-upload-image"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
        </div>

        {value ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>{value.name}</span>
          </div>
        ) : required ? (
          <p className="text-sm text-red-500 dark:text-red-400 text-center">
            <span className="text-red-500">*</span> {label}
          </p>
        ) : null}
      </div>

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {label}</DialogTitle>
          </DialogHeader>
          
          {!isCameraMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={startCamera}
                  className="h-24 flex flex-col gap-2"
                  variant="outline"
                  data-testid="button-start-camera"
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 flex flex-col gap-2"
                  variant="outline"
                  data-testid="button-choose-file"
                >
                  <Upload className="h-8 w-8" />
                  <span>Choose File</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="file-input"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full"
                  autoPlay
                  playsInline
                  data-testid="camera-video"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1"
                  data-testid="button-capture-photo"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button
                  type="button"
                  onClick={stopCamera}
                  variant="outline"
                  data-testid="button-cancel-camera"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
