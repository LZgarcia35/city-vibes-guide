import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Camera, Upload, X } from "lucide-react";

interface FileUploadProps {
  onUpload: (url: string) => void;
  bucket: string;
  accept?: string;
  maxSize?: number;
  children?: React.ReactNode;
  className?: string;
}

export const FileUpload = ({ 
  onUpload, 
  bucket, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024,
  children,
  className = ""
}: FileUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > maxSize) {
      toast({ 
        title: "Arquivo muito grande", 
        description: `O arquivo deve ter no máximo ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(publicUrl);
      toast({ title: "Upload realizado com sucesso!" });
    } catch (error: any) {
      toast({ 
        title: "Erro no upload", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraCapture = () => {
    // For mobile devices, set capture attribute
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  if (children) {
    return (
      <>
        <div 
          onClick={handleGallerySelect} 
          className={`cursor-pointer ${className}`}
        >
          {children}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGallerySelect}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Enviando..." : "Galeria"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCameraCapture}
          disabled={uploading}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Câmera
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

interface MediaPreviewProps {
  url: string;
  onRemove: () => void;
  className?: string;
}

export const MediaPreview = ({ url, onRemove, className = "" }: MediaPreviewProps) => {
  const isVideo = url.includes('.mp4') || url.includes('.mov');
  
  return (
    <div className={`relative group ${className}`}>
      {isVideo ? (
        <video 
          src={url} 
          className="w-full h-32 object-cover rounded-lg border"
          controls
        />
      ) : (
        <img 
          src={url} 
          alt="Preview" 
          className="w-full h-32 object-cover rounded-lg border"
        />
      )}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};