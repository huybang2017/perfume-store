'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGenerateVariantsMutation,
  useBulkUpdateVariantsMutation,
  type CreateProductBody,
} from '@/store/api/productApi';
import { useGetCategoriesQuery } from '@/store/api/categoryApi';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import { formatVND, vi } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/images';
import { ensureOptionRecord, getVariantPrimaryImage, normalizeVariantOptions } from '@/lib/variants';
import { useUploadImageMutation } from '@/store/api/uploadApi';
import { ROUTES } from '@/constants/routes';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { ProductImagesManager } from '@/features/admin/components/ProductImagesManager';
import {
  normalizeProductStatus,
  type ProductStatus,
  PRODUCT_STATUSES,
  getProductStatusLabel,
} from '@/lib/product-status';
import type { ProductOption, ProductVariant } from '@/types/api';

type OptionRow = { name: string; values: string };
type VariantRow = ProductVariant & { optionValues?: Record<string, string> };

const DEFAULT_OPTIONS: OptionRow[] = [
  { name: 'Color', values: 'Black, White' },
  { name: 'Size', values: 'S, M, L, XL' },
];

function mapVariantToRow(variant: ProductVariant): VariantRow {
  const rawOptions =
    variant.options ??
    (variant as ProductVariant & { optionValues?: Record<string, string> }).optionValues;
  return {
    ...variant,
    optionValues: normalizeVariantOptions(ensureOptionRecord(rawOptions)),
    imageUrl: variant.imageUrl ?? variant.imageUrls?.[0] ?? null,
    imageUrls: Array.isArray(variant.imageUrls) ? variant.imageUrls : [],
  };
}

function VariantImageCell({
  imageUrl,
  onChange,
}: {
  imageUrl?: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputId = useId();
  const [uploadImage, { isLoading }] = useUploadImageMutation();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(() =>
    resolveMediaUrl(imageUrl),
  );

  useEffect(() => {
    setPreviewUrl(resolveMediaUrl(imageUrl));
  }, [imageUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const res = await uploadImage(file).unwrap();
      const uploadedUrl = resolveMediaUrl(res.data?.imageUrl);
      if (uploadedUrl) {
        setPreviewUrl(uploadedUrl);
        onChange(uploadedUrl);
      } else {
        setPreviewUrl(resolveMediaUrl(imageUrl));
      }
    } catch (err: unknown) {
      setPreviewUrl(resolveMediaUrl(imageUrl));
      const msg =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        err.data &&
        typeof err.data === 'object' &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : vi.admin.uploadImageFailed;
      window.alert(msg);
    } finally {
      URL.revokeObjectURL(objectUrl);
      e.target.value = '';
    }
  };

  return (
    <div className="flex min-w-[112px] flex-col items-center gap-1.5 py-1">
      <label
        htmlFor={inputId}
        className="group relative block h-20 w-20 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-[10px] font-medium">{vi.admin.uploadImage}</span>
              </>
            )}
          </div>
        )}
        {previewUrl && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <ImagePlus className="h-5 w-5 text-white" />
          </div>
        )}
        {isLoading && previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={isLoading}
      />
      {previewUrl && !isLoading && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600"
          onClick={() => {
            setPreviewUrl(undefined);
            onChange(null);
          }}
        >
          <X className="h-3 w-3" />
          {vi.admin.removeImage}
        </button>
      )}
    </div>
  );
}

function mapProductOptions(productOptions?: ProductOption[]): OptionRow[] {
  if (!Array.isArray(productOptions) || !productOptions.length) {
    return [{ name: '', values: '' }];
  }
  return productOptions.map((o) => ({
    name: o.name ?? '',
    values: Array.isArray(o.values)
      ? o.values.map((v) => v.value).filter(Boolean).join(', ')
      : '',
  }));
}

function variantRowKey(variant: VariantRow, index: number): string {
  return variant.id?.trim() ? variant.id : `idx-${index}`;
}

function parseBulkNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface AdminProductEditorProps {
  productId?: string;
}

export function AdminProductEditor({ productId }: AdminProductEditorProps) {
  const router = useRouter();
  const isNew = !productId;
  const { data, isLoading, isError } = useGetProductQuery(productId!, { skip: isNew });
  const { data: categories } = useGetCategoriesQuery({ limit: 100 });
  const { data: brands } = useGetBrandsQuery({ limit: 100 });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [generateVariants] = useGenerateVariantsMutation();
  const [bulkUpdate] = useBulkUpdateVariantsMutation();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [baseSku, setBaseSku] = useState('');
  const [basePrice, setBasePrice] = useState(250000);
  const [options, setOptions] = useState<OptionRow[]>(DEFAULT_OPTIONS);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStock, setBulkStock] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkComparePrice, setBulkComparePrice] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const variantsTouchedRef = useRef(false);

  useEffect(() => {
    variantsTouchedRef.current = false;
  }, [productId]);

  useEffect(() => {
    const p = data?.data;
    if (!p) return;
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description ?? '');
    setCategoryId(p.categoryId ?? '');
    setBrandId(p.brandId ?? '');
    setBaseSku(p.sku ?? '');
    setBasePrice(p.price ?? 0);
    setOptions(mapProductOptions(p.options));
    setProductImages(Array.isArray(p.images) ? p.images : []);
    setThumbnailUrl(p.thumbnailUrl ?? p.images?.[0] ?? null);
    setStatus(normalizeProductStatus(p.status, p.isActive));
    setIsFeatured(Boolean(p.isFeatured));
    if (!variantsTouchedRef.current) {
      setVariants(Array.isArray(p.variants) ? p.variants.map(mapVariantToRow) : []);
    }
  }, [data]);

  const updateVariantAt = (idx: number, patch: Partial<VariantRow>) => {
    variantsTouchedRef.current = true;
    setVariants((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const parsedOptions = () =>
    options
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name.trim(),
        values: (o.values ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      }));

  const handleGenerate = async () => {
    const opts = parsedOptions();
    if (!opts.length) return;

    if (isNew) {
      const combos: VariantRow[] = [];
      const build = (
        idx: number,
        current: Record<string, string>,
      ) => {
        if (idx >= opts.length) {
          const suffix = Object.values(current)
            .map((v) => v.replace(/\s/g, '').toUpperCase().slice(0, 4))
            .join('-');
          combos.push({
            id: '',
            sku: `${baseSku || 'SKU'}-${suffix}`,
            price: basePrice,
            comparePrice: null,
            stock: 10,
            isActive: true,
            options: current,
            optionValues: current,
            imageUrl: null,
            imageUrls: [],
          });
          return;
        }
        for (const val of opts[idx].values) {
          build(idx + 1, { ...current, [opts[idx].name]: val });
        }
      };
      build(0, {});
      setVariants(combos);
      setSelectedIds([]);
      return;
    }

    const res = await generateVariants({
      id: productId!,
      options: opts,
      baseSku: baseSku || slug.toUpperCase(),
      basePrice,
      baseStock: 10,
    }).unwrap();
    if (Array.isArray(res.data)) {
      setVariants(res.data.map(mapVariantToRow));
      setSelectedIds([]);
    }
  };

  const handleSave = async () => {
    const opts = parsedOptions();
    const variantPayload = variants.map((v) => ({
      id: v.id || undefined,
      sku: v.sku,
      price: Number(v.price),
      comparePrice: v.comparePrice != null ? Number(v.comparePrice) : undefined,
      stock: Number(v.stock),
      isActive: v.isActive,
      optionValues: ensureOptionRecord(v.optionValues ?? v.options),
      imageUrl: getVariantPrimaryImage(v) ?? null,
      imageUrls: getVariantPrimaryImage(v)
        ? [getVariantPrimaryImage(v)!]
        : Array.isArray(v.imageUrls)
          ? v.imageUrls
          : [],
    }));

    const body: CreateProductBody = {
      name,
      slug,
      description,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      price: basePrice,
      sku: baseSku,
      stock: variants.reduce((s, v) => s + Number(v.stock), 0),
      options: opts,
      variants: variantPayload,
      images: productImages,
      thumbnailUrl: thumbnailUrl ?? productImages[0] ?? null,
      status,
      isFeatured,
    };

    if (isNew) {
      const res = await createProduct(body).unwrap();
      if (res.success) router.push(`${ROUTES.admin.products}/${res.data.id}`);
    } else {
      await updateProduct({ id: productId!, body }).unwrap();
      variantsTouchedRef.current = false;
    }
  };

  const applyBulk = async () => {
    if (!variants.length) return;

    const stockNum =
      bulkStock !== '' ? Math.max(0, parseBulkNumber(bulkStock) ?? 0) : undefined;
    const priceNum = parseBulkNumber(bulkPrice);
    const compareNum = parseBulkNumber(bulkComparePrice);

    const hasUpdates =
      stockNum !== undefined || priceNum !== undefined || compareNum !== undefined;
    if (!hasUpdates) return;

    const targetKeys =
      selectedIds.length > 0
        ? selectedIds
        : variants.map((v, i) => variantRowKey(v, i));

    setVariants((prev) =>
      prev.map((v, i) => {
        const key = variantRowKey(v, i);
        if (!targetKeys.includes(key)) return v;
        return {
          ...v,
          ...(stockNum !== undefined ? { stock: stockNum } : {}),
          ...(priceNum !== undefined ? { price: priceNum } : {}),
          ...(compareNum !== undefined ? { comparePrice: compareNum } : {}),
        };
      }),
    );

    setSelectedIds([]);
    setBulkStock('');
    setBulkPrice('');
    setBulkComparePrice('');

    const savedIds = targetKeys.filter((id) => id && !id.startsWith('idx-'));
    if (savedIds.length) {
      try {
        await bulkUpdate({
          variantIds: savedIds,
          ...(stockNum !== undefined ? { stock: stockNum } : {}),
          ...(priceNum !== undefined ? { price: priceNum } : {}),
          ...(compareNum !== undefined ? { comparePrice: compareNum } : {}),
        }).unwrap();
      } catch {
        // Local state already updated; "Lưu sản phẩm" will persist on save.
      }
    }
  };

  const allVariantKeys = variants.map((v, i) => variantRowKey(v, i));
  const allVariantsSelected =
    variants.length > 0 && allVariantKeys.every((k) => selectedIds.includes(k));
  const hasBulkInput = bulkStock !== '' || bulkPrice !== '' || bulkComparePrice !== '';

  if (!isNew && isLoading) {
    return <p className="text-slate-600">{vi.common.loading}</p>;
  }

  if (!isNew && isError) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <ApiErrorAlert />
        <Button variant="outline" onClick={() => router.push(ROUTES.admin.products)}>
          {vi.common.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? vi.admin.newProduct : vi.admin.editProduct}
        </h1>
        <Button variant="outline" onClick={() => router.push(ROUTES.admin.products)}>
          {vi.common.back}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Product name
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            Slug
            <Input className="mt-1" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Description
            <Input className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block text-sm">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">—</option>
              {categories?.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Brand
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">—</option>
              {brands?.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Base SKU
            <Input className="mt-1" value={baseSku} onChange={(e) => setBaseSku(e.target.value)} />
          </label>
          <label className="block text-sm">
            Base price (VND)
            <Input
              type="number"
              className="mt-1"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            {vi.admin.productStatus}
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getProductStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-slate-300"
            />
            <Star className="h-4 w-4 text-amber-500" />
            {vi.admin.featuredProduct}
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.productImages}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImagesManager
            images={productImages}
            thumbnailUrl={thumbnailUrl}
            onImagesChange={setProductImages}
            onThumbnailChange={setThumbnailUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{vi.admin.productVariants}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.map((opt, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={vi.admin.optionName}
                value={opt.name}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...next[i], name: e.target.value };
                  setOptions(next);
                }}
              />
              <Input
                placeholder={vi.admin.optionValues}
                value={opt.values}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...next[i], values: e.target.value };
                  setOptions(next);
                }}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setOptions([...options, { name: '', values: '' }])}>
            {vi.admin.addOption}
          </Button>
          <Button type="button" onClick={handleGenerate}>
            {vi.admin.generateVariants}
          </Button>
        </CardContent>
      </Card>

      {variants.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variant table ({variants.length})</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder={vi.admin.stock}
                className="w-24"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
              />
              <Input
                placeholder={vi.admin.variantPrice}
                className="w-32"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
              />
              <Input
                placeholder={vi.admin.comparePrice}
                className="w-32"
                value={bulkComparePrice}
                onChange={(e) => setBulkComparePrice(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={applyBulk}
                disabled={!variants.length || !hasBulkInput}
              >
                {vi.admin.bulkUpdate}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allVariantsSelected}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? allVariantKeys : [])
                      }
                    />
                  </th>
                  <th className="min-w-[112px] px-3 py-2">{vi.admin.variantImage}</th>
                  <th className="px-3 py-2">{vi.admin.variantSku}</th>
                  {parsedOptions().map((o) => (
                    <th key={o.name} className="px-3 py-2">
                      {o.name}
                    </th>
                  ))}
                  <th className="px-3 py-2">{vi.admin.variantPrice}</th>
                  <th className="px-3 py-2">{vi.admin.comparePrice}</th>
                  <th className="px-3 py-2">{vi.admin.stock}</th>
                  <th className="px-3 py-2">{vi.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, idx) => (
                  <tr key={v.id || idx} className="border-b border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(variantRowKey(v, idx))}
                        onChange={(e) => {
                          const key = variantRowKey(v, idx);
                          setSelectedIds((ids) =>
                            e.target.checked
                              ? [...ids, key]
                              : ids.filter((x) => x !== key),
                          );
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <VariantImageCell
                        imageUrl={getVariantPrimaryImage(v)}
                        onChange={(url) =>
                          updateVariantAt(idx, {
                            imageUrl: url,
                            imageUrls: url ? [url] : [],
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 min-w-[120px]"
                        value={v.sku}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...next[idx], sku: e.target.value };
                          setVariants(next);
                        }}
                      />
                    </td>
                    {parsedOptions().map((o) => (
                      <td key={o.name} className="px-3 py-2 text-slate-600">
                        {v.optionValues?.[o.name] ?? '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="h-8 w-28"
                        value={v.price}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...next[idx], price: Number(e.target.value) };
                          setVariants(next);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="h-8 w-28"
                        value={v.comparePrice ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const next = [...variants];
                          const val = e.target.value;
                          next[idx] = {
                            ...next[idx],
                            comparePrice: val === '' ? null : Number(val),
                          };
                          setVariants(next);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={v.stock}
                        onChange={(e) => {
                          const next = [...variants];
                          const stock = Math.max(0, Number(e.target.value) || 0);
                          next[idx] = { ...next[idx], stock };
                          setVariants(next);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs text-blue-600"
                        onClick={() => {
                          const next = [...variants];
                          next[idx] = { ...next[idx], isActive: !next[idx].isActive };
                          setVariants(next);
                        }}
                      >
                        {v.isActive ? vi.admin.active : vi.admin.inactive}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Button size="lg" onClick={handleSave} disabled={creating || updating}>
        {creating || updating ? vi.common.loading : vi.admin.saveProduct}
      </Button>
      {variants.length > 0 && (
        <p className="text-sm text-slate-500">
          Total stock: {variants.reduce((s, v) => s + Number(v.stock), 0)} · Price from{' '}
          {formatVND(Math.min(...variants.map((v) => Number(v.price) || 0)))}
        </p>
      )}
    </div>
  );
}
