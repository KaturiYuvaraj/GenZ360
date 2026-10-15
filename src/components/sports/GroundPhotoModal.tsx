import { useState, useRef, useEffect } from "react";
import { updateGroundPhoto } from "@/lib/data/actions";
import {
  UploadCloud,
  Camera,
  X,
  Check,
  Sparkles,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface GroundPhotoModalProps {
  ground: {
    id: string;
    name: string;
    city?: string;
    image_url?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newImageUrl: string) => void;
}

const PRESET_TURFS = [
  {
    name: "Floodlit Night Box Turf",
    category: "Night Box",
    url: "/grounds/koramangala.jpg",
  },
  {
    name: "Powai Lakeview Floodlit Cage",
    category: "Outdoor Cage",
    url: "/grounds/powai.jpg",
  },
  {
    name: "College Practice Nets",
    category: "Practice Nets",
    url: "/grounds/chennai.jpg",
  },
  {
    name: "HITEC Indoor LED Cage",
    category: "Indoor Box",
    url: "/grounds/hyderabad.jpg",
  },
  {
    name: "Cyber Hub Glass Pavilion",
    category: "Premium Turf",
    url: "/grounds/gurugram.jpg",
  },
  {
    name: "Riverside Natural Turf",
    category: "Open Nets",
    url: "/grounds/pune.jpg",
  },
  {
    name: "All-Weather Floodlit Arena",
    category: "Pro Turf",
    url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "5-a-Side Box Turf",
    category: "AstroTurf",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  },
];

/**
 * Resizes and optimizes an uploaded image file on an HTML5 canvas to prevent huge base64 payloads
 */
function processGroundImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid image file (JPG, PNG, or WebP)."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Image size exceeds 12MB. Please choose a smaller photo."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        // Max dimensions: 1280x800 for high-res web banner
        const maxW = 1280;
        const maxH = 800;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        // Save as optimized JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function GroundPhotoModal({
  ground,
  isOpen,
  onClose,
  onSuccess,
}: GroundPhotoModalProps) {
  const [tab, setTab] = useState<"upload" | "presets" | "url">("upload");
  const [previewUrl, setPreviewUrl] = useState<string>(ground.image_url || "/grounds/koramangala.jpg");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ground.image_url) {
      setPreviewUrl(ground.image_url);
    }
    setError("");
    setSuccessMsg("");
  }, [ground, isOpen]);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const dataUrl = await processGroundImage(file);
      setPreviewUrl(dataUrl);
    } catch (err: any) {
      setError(err?.message || "Failed to process photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!previewUrl) {
      setError("Please select or upload a photo first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateGroundPhoto({
        data: {
          groundId: ground.id,
          imageUrl: previewUrl,
        },
      });
      setSuccessMsg("Ground picture updated and live!");
      onSuccess(previewUrl);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Failed to update ground photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleApplyCustomUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setPreviewUrl(customUrl.trim());
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-gz-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-[24px] bg-white border border-line p-6 sm:p-7 shadow-2xl z-10 animate-gz-scale-in max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 mb-1">
              <Camera className="h-4 w-4" />
              <span>FACILITY MEDIA MANAGER</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">
              Upload Ground Pictures
            </h3>
            <p className="text-xs text-mute mt-0.5">
              {ground.name} {ground.city ? `· ${ground.city}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-mute hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Picture Preview Card */}
        <div className="mb-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-mute mb-2">
            Live Preview on Booking Portal
          </p>
          <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border-2 border-line bg-paper-2 shadow-xs group">
            {uploading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper/80 backdrop-blur-xs text-xs text-mute gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                <span>Optimizing and loading photograph…</span>
              </div>
            ) : (
              <>
                <img
                  src={previewUrl}
                  alt={ground.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => {
                    setError("Failed to load image preview. Please check the URL or select another picture.");
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="font-display font-semibold text-sm truncate">{ground.name}</span>
                  <span className="gz-chip !bg-white/20 !text-white !border-white/30 backdrop-blur-xs text-[10px]">
                    Current Preview
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload Mode Selector */}
        <div className="grid grid-cols-3 gap-2 mb-5 p-1 rounded-xl bg-paper border border-line text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "upload" ? "bg-white text-ink font-bold shadow-xs" : "text-mute hover:text-ink"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("presets")}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "presets" ? "bg-white text-ink font-bold shadow-xs" : "text-mute hover:text-ink"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Turf Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "url" ? "bg-white text-ink font-bold shadow-xs" : "text-mute hover:text-ink"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Tab 1: Device File Upload */}
        {tab === "upload" && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-accent rounded-2xl p-6 text-center cursor-pointer transition-colors bg-paper/30 hover:bg-accent/[0.02] flex flex-col items-center justify-center gap-2 group"
            >
              <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-ink">
                Click to browse or take a turf photo
              </p>
              <p className="text-xs text-mute">
                Supports JPG, PNG, WebP (up to 12MB). Automatically optimized for crisp display.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Curated Turf Presets */}
        {tab === "presets" && (
          <div className="space-y-2">
            <p className="text-xs text-mute">
              Pick from our collection of high-resolution cricket turf photography:
            </p>
            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {PRESET_TURFS.map((p) => {
                const isSelected = previewUrl === p.url;
                return (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(p.url);
                      setError("");
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition-all p-1 group cursor-pointer ${
                      isSelected
                        ? "border-accent ring-2 ring-accent/30 bg-accent/5"
                        : "border-line hover:border-line-2 bg-paper/40"
                    }`}
                  >
                    <div className="h-20 w-full rounded-lg overflow-hidden relative">
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-1">
                      <p className="text-xs font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-mute">{p.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Direct URL */}
        {tab === "url" && (
          <form onSubmit={handleApplyCustomUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Direct Image Link (HTTPS):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="gz-input text-xs"
                  placeholder="https://images.unsplash.com/... or cloud URL"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <button type="submit" className="gz-btn gz-btn-ghost !min-h-9 !px-3 text-xs shrink-0">
                  Preview
                </button>
              </div>
            </div>
            <p className="text-[11px] text-mute">
              Paste any hosted image URL. It will instantly preview above before saving.
            </p>
          </form>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-coral/10 border border-coral/25 text-coral text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-mint/10 border border-mint/25 text-mint text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-line flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={busy || uploading}
            className="gz-btn gz-btn-primary !min-h-9 !px-6 text-xs font-semibold flex items-center gap-2"
          >
            {busy ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Picture…</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save & Publish Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
