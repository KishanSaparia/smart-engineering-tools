import { useRef, useState, useCallback } from "react";
import type { PhotoFile } from "../types/survey";
import { PHOTO_CATEGORIES } from "../lib/equipment-config";
import { savePhoto } from "../lib/indexeddb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PhotoUploaderProps {
  photos: PhotoFile[];
  equipmentName: string;
  onChange: (photos: PhotoFile[]) => void;
}

function makeSequentialName(equipmentName: string, index: number, originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = (equipmentName || "EQ").replace(/[^a-zA-Z0-9\-_]/g, "_").toUpperCase();
  return `${safeName}_${String(index).padStart(2, "0")}.${ext}`;
}

export function PhotoUploader({ photos, equipmentName, onChange }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingLabel, setPendingLabel] = useState("Nameplate");
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");

  const processFiles = useCallback(async (files: File[], label: string) => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);

    const newPhotos: PhotoFile[] = [];
    const startIndex = photos.length + 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const idx = startIndex + i;
      setProcessingMsg(`Processing ${i + 1} of ${files.length}...`);
      setProgress(Math.round(((i + 1) / files.length) * 100));

      const id = crypto.randomUUID();
      const seqName = makeSequentialName(equipmentName, idx, file.name);

      await savePhoto(id, file);

      const preview = URL.createObjectURL(file);

      newPhotos.push({
        id,
        label,
        preview,
        originalName: file.name,
        sequentialName: seqName,
        fileType: file.type,
        fileSize: file.size,
      });

      await new Promise(r => setTimeout(r, 0));
    }

    onChange([...photos, ...newPhotos]);
    setProcessing(false);
    setProgress(0);
    setProcessingMsg("");
  }, [photos, equipmentName, onChange]);

  const handleFiles = (files: FileList | null, label: string) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 50);
    void processFiles(arr, label);
  };

  const removePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.preview) URL.revokeObjectURL(photo.preview);

    const remaining = photos.filter(p => p.id !== id);
    const renumbered = remaining.map((p, i) => ({
      ...p,
      sequentialName: makeSequentialName(equipmentName, i + 1, p.originalName),
    }));
    onChange(renumbered);
  };

  const updateLabel = (id: string, label: string) => {
    onChange(photos.map(p => p.id === id ? { ...p, label } : p));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files, pendingLabel);
  }, [pendingLabel, handleFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Default Category</Label>
          <Select value={pendingLabel} onValueChange={setPendingLabel}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHOTO_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="h-9"
        >
          + Select Photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files, pendingLabel)}
        />
        <p className="text-xs text-muted-foreground self-end pb-1.5">Up to 50 photos per upload. Photos named: <span className="font-mono font-medium text-foreground">{equipmentName ? `${equipmentName.replace(/[^a-zA-Z0-9\-_]/g, "_").toUpperCase()}_01.jpg` : "EQNAME_01.jpg"}</span></p>
      </div>

      {processing && (
        <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary font-medium">{processingMsg}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {photos.length === 0 && !processing ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border hover:border-primary/50 hover:bg-accent/20"
          }`}
        >
          <div className="text-4xl mb-2">📸</div>
          <p className="font-medium text-foreground">Drag and drop photos here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to select files</p>
          <p className="text-xs text-muted-foreground/70 mt-2">JPG, PNG, WebP — up to 50 files at once — high resolution supported</p>
        </div>
      ) : photos.length > 0 ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""}`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={photo.preview}
                    alt={photo.sequentialName}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    ×
                  </button>
                </div>
                <div className="p-1.5 space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground truncate" title={photo.sequentialName}>
                    {photo.sequentialName}
                  </div>
                  <Select value={photo.label} onValueChange={v => updateLabel(photo.id, v)}>
                    <SelectTrigger className="h-6 text-[10px] px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-[9px] text-muted-foreground/60">{formatSize(photo.fileSize)}</div>
                </div>
              </div>
            ))}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all"
            >
              <span className="text-xl text-muted-foreground">+</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Add more</span>
            </div>
          </div>
        </div>
      ) : null}

      {photos.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{photos.length} photo{photos.length !== 1 ? "s" : ""}</Badge>
          <span className="text-xs text-muted-foreground">
            Total: {formatSize(photos.reduce((s, p) => s + p.fileSize, 0))}
          </span>
        </div>
      )}
    </div>
  );
}
