import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompactImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function CompactImageUpload({
  value,
  onChange,
  label = "Imagem",
  placeholder = "URL da imagem ou carregar arquivo",
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8,
}: CompactImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Create FormData
      const formData = new FormData();
      formData.append("file", compressedFile);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onChange(result.url);
        toast({
          title: "Sucesso",
          description: "Imagem carregada e comprimida com sucesso!",
        });
      } else {
        throw new Error("Falha no upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-center space-x-2">
        {/* URL Input */}
        <div className="flex-1">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>

        {/* Clear Button */}
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearImage}
            className="shrink-0 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Image preview */}
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt="Preview"
            className="w-20 h-20 object-cover rounded border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
