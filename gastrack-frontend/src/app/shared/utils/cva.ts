/**
 * Class Variance Authority (CVA) - Simplified TypeScript Implementation
 *
 * Creates type-safe component variants similar to the cva library.
 * Useful for creating consistent, variant-based component styling.
 *
 * @example
 * ```typescript
 * const buttonVariants = cva(
 *   'inline-flex items-center rounded-lg font-medium',
 *   {
 *     variants: {
 *       variant: {
 *         primary: 'bg-blue-600 text-white',
 *         secondary: 'bg-gray-100 text-gray-900',
 *       },
 *       size: {
 *         sm: 'px-3 py-1.5 text-sm',
 *         md: 'px-4 py-2 text-base',
 *       },
 *     },
 *     defaultVariants: {
 *       variant: 'primary',
 *       size: 'md',
 *     },
 *   }
 * );
 *
 * // Usage
 * buttonVariants({ variant: 'primary', size: 'sm' });
 * // => 'inline-flex items-center rounded-lg font-medium bg-blue-600 text-white px-3 py-1.5 text-sm'
 * ```
 */

type ClassValue = string | undefined | null | false | 0;

/**
 * Configuration for CVA variants
 */
export interface VariantConfig<TVariants extends Record<string, Record<string, string>>> {
  variants: TVariants;
  defaultVariants?: {
    [K in keyof TVariants]?: keyof TVariants[K];
  };
  compoundVariants?: ({
    [K in keyof TVariants]?: keyof TVariants[K];
  } & {
    class: string;
  })[];
}

/**
 * Props type for variant function
 */
export type VariantProps<TVariants extends Record<string, Record<string, string>>> = {
  [K in keyof TVariants]?: keyof TVariants[K];
};

/**
 * Creates a variant-based class name generator
 *
 * @param base - Base classes applied to all variants
 * @param config - Variant configuration
 * @returns Function that generates class names based on variant props
 */
export function cva<TVariants extends Record<string, Record<string, string>>>(
  base: string,
  config: VariantConfig<TVariants>,
): (props?: VariantProps<TVariants>) => string {
  return (props?: VariantProps<TVariants>): string => {
    const classes: string[] = [base];

    // Apply variant classes
    for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
      const selectedVariant =
        props?.[variantKey as keyof TVariants] ??
        config.defaultVariants?.[variantKey as keyof TVariants];

      if (selectedVariant) {
        const variantClass = variantOptions[selectedVariant as string];
        if (variantClass) {
          classes.push(variantClass);
        }
      }
    }

    // Apply compound variants
    if (config.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const { class: compoundClass, ...conditions } = compound;

        const matches = Object.entries(conditions).every(([key, value]) => {
          const selectedValue =
            props?.[key as keyof TVariants] ?? config.defaultVariants?.[key as keyof TVariants];
          return selectedValue === value;
        });

        if (matches) {
          classes.push(compoundClass);
        }
      }
    }

    return classes.filter(Boolean).join(' ');
  };
}

/**
 * Utility to merge class names, filtering out falsy values
 *
 * @param classes - Class values to merge
 * @returns Merged class string
 *
 * @example
 * ```typescript
 * cn('base-class', isActive && 'active', 'always-included');
 * // => 'base-class always-included' (when isActive is false)
 * // => 'base-class active always-included' (when isActive is true)
 * ```
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility to conditionally apply classes based on a boolean
 *
 * @param condition - Boolean condition
 * @param trueClass - Class to apply when condition is true
 * @param falseClass - Optional class to apply when condition is false
 * @returns The appropriate class string or empty string
 *
 * @example
 * ```typescript
 * conditionalClass(isOpen, 'visible', 'hidden');
 * // => 'visible' when isOpen is true
 * // => 'hidden' when isOpen is false
 * ```
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string,
): string {
  return condition ? trueClass : (falseClass ?? '');
}
