export const productKeys = ["kvisa_assistant"] as const;

export const productRolesByProduct = {
  kvisa_assistant: ["owner", "admin", "reviewer", "support"],
} as const satisfies Record<(typeof productKeys)[number], readonly string[]>;

export type ProductKey = (typeof productKeys)[number];

export type ProductRole<TProductKey extends ProductKey = ProductKey> =
  (typeof productRolesByProduct)[TProductKey][number];

export function isProductKey(value: string): value is ProductKey {
  return (productKeys as readonly string[]).includes(value);
}
