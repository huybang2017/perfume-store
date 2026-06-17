'use client';

import { useId } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/images';
import { vi } from '@/lib/i18n';
import { useUploadImageMutation } from '@/store/api/uploadApi';

interface ProductImagesManagerProps {
  images: string[];
  thumbnailUrl: string | null;
  onImagesChange: (images: string[]) => void;
  onThumbnailChange: (url: string | null) => void;
}

export function ProductImagesManager({
  images,
  thumbnailUrl,
  onImagesChange,
  onThumbnailChange,
}: ProductImagesManagerProps) {
  const inputId = useId();
  const [uploadImage, { isLoading }] = useUploadImageMutation();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file).unwrap();
      const url = resolveMediaUrl(res.data?.imageUrl);
      if (!url) return;
      const next = [...images, url];
      onImagesChange(next);
      if (!thumbnailUrl) onThumbnailChange(url);
    } catch {
      window.alert(vi.admin.uploadImageFailed);
    } finally {
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    const next = images.filter((_, i) => i !== index);
    onImagesChange(next);
    if (thumbnailUrl === removed) {
      onThumbnailChange(next[0] ?? null);
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onImagesChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {vi.admin.uploadImage}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isLoading}
        />
        <span className="text-xs text-slate-500">{vi.admin.productImagesHint}</span>
      </div>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {vi.admin.noProductImages}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, index) => {
            const resolved = resolveMediaUrl(url) ?? url;
            const isThumbnail = thumbnailUrl === url;
            return (
              <div
                key={`${url}-${index}`}
                className={`overflow-hidden rounded-lg border bg-white ${
                  isThumbnail ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="aspect-square bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolved} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-1 border-t border-slate-100 p-2">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                      isThumbnail
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => onThumbnailChange(url)}
                  >
                    <Star className={`h-3 w-3 ${isThumbnail ? 'fill-current' : ''}`} />
                    {isThumbnail ? vi.admin.thumbnailSelected : vi.admin.setThumbnail}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
