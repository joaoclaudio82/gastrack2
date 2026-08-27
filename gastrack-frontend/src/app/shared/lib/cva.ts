/**
 * Class Variance Authority (CVA) helper for Angular
 * Creates type-safe variant-based class generators
 */

export type VariantProps<T> = T extends (props?: infer P) => string ? Omit<P, 'class'> : never;

interface VariantConfig<V extends Record<string, Record<string, string>>> {
  variants: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
  compoundVariants?: ({
    [K in keyof V]?: keyof V[K];
  } & { class: string })[];
}

/**
 * Creates a variant-based class generator function
 * @param base - Base classes that are always applied
 * @param config - Variant configuration with variants, defaults, and compound variants
 * @returns Function that generates class strings based on variant props
 */
export function cva<V extends Record<string, Record<string, string>>>(
  base: string,
  config: VariantConfig<V>,
) {
  return (props?: { [K in keyof V]?: keyof V[K] } & { class?: string }): string => {
    const { class: className, ...variantProps } = props ?? {};
    const classes = [base];

    // Apply variant classes
    for (const [key, variants] of Object.entries(config.variants)) {
      const variantKey =
        (variantProps as Record<string, unknown>)?.[key] ?? config.defaultVariants?.[key];
      const variantClass = variantKey ? variants[variantKey as string] : undefined;
      if (variantClass) {
        classes.push(variantClass);
      }
    }

    // Apply compound variants
    if (config.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const { class: compoundClass, ...compoundConditions } = compound;
        const matches = Object.entries(compoundConditions).every(([key, value]) => {
          const currentValue =
            (variantProps as Record<string, unknown>)?.[key] ??
            config.defaultVariants?.[key as keyof V];
          return currentValue === value;
        });
        if (matches) {
          classes.push(compoundClass);
        }
      }
    }

    if (className) classes.push(className);
    return classes.filter(Boolean).join(' ');
  };
}
