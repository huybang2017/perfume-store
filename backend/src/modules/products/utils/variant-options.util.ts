import { VariantOptionInput, VariantInput } from '../repositories/variant.repository';

export const COLOR_OPTION_NAMES = ['Màu sắc', 'Color', 'Màu'] as const;
export const SIZE_OPTION_NAMES = ['Size', 'Kích thước', 'Kích cỡ'] as const;

export function normalizeOptionKey(value: string): string {
  return value.trim().toLowerCase();
}

export function deriveOptionInputs(
  optionInputs: VariantOptionInput[],
  variantInputs: VariantInput[],
): VariantOptionInput[] {
  if (optionInputs.length) return optionInputs;

  const valueMap = new Map<string, Set<string>>();
  for (const variant of variantInputs) {
    for (const [name, value] of Object.entries(variant.optionValues ?? {})) {
      const trimmedName = name.trim();
      const trimmedValue = value?.trim();
      if (!trimmedName || !trimmedValue) continue;
      if (!valueMap.has(trimmedName)) valueMap.set(trimmedName, new Set());
      valueMap.get(trimmedName)!.add(trimmedValue);
    }
  }

  return [...valueMap.entries()].map(([name, values]) => ({
    name,
    values: [...values],
  }));
}

export function resolveOptionValueId(
  optionValueMap: Map<string, string>,
  optName: string,
  optVal: string,
): string | undefined {
  const name = optName.trim();
  const value = optVal.trim();
  if (!name || !value) return undefined;

  const direct = optionValueMap.get(`${name}::${value}`);
  if (direct) return direct;

  const targetName = normalizeOptionKey(name);
  const targetValue = normalizeOptionKey(value);

  for (const [key, id] of optionValueMap.entries()) {
    const sep = key.indexOf('::');
    if (sep === -1) continue;
    const keyName = key.slice(0, sep);
    const keyValue = key.slice(sep + 2);
    if (
      normalizeOptionKey(keyName) === targetName &&
      normalizeOptionKey(keyValue) === targetValue
    ) {
      return id;
    }
  }

  return undefined;
}
