import "server-only";

import { canEmployeeLaunchProduct } from "@/features/auth/services/employee-repository";
import {
  getRegisteredProduct,
  productRegistry,
  type ProductRegistry,
  type RegisteredProduct,
} from "@/lib/products/registry";
import { isProductKey } from "@/lib/products/definitions";

export type ProductLaunchResult =
  | { status: "launchable"; product: RegisteredProduct; launchUrl: string }
  | { status: "unknown" }
  | { status: "disabled"; product: RegisteredProduct }
  | { status: "unauthorized"; product: RegisteredProduct };

export async function getEmployeeProductLaunch(input: {
  employeeAccountId: string;
  productKey: string;
  registry?: ProductRegistry;
}): Promise<ProductLaunchResult> {
  if (!isProductKey(input.productKey)) {
    return { status: "unknown" };
  }

  const registry = input.registry ?? productRegistry;
  const product = getRegisteredProduct(input.productKey, registry);

  if (!product.enabled || !product.launchUrl) {
    return { status: "disabled", product };
  }

  const canLaunch = await canEmployeeLaunchProduct({
    employeeAccountId: input.employeeAccountId,
    productKey: product.key,
  });

  if (!canLaunch) {
    return { status: "unauthorized", product };
  }

  return {
    status: "launchable",
    product,
    launchUrl: product.launchUrl,
  };
}
