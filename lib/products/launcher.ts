import "server-only";

import { findEmployeeProductLaunchAuthorization } from "@/features/auth/services/employee-repository";
import {
  appendKVisaLaunchToken,
  signKVisaAssistantLaunchToken,
} from "@/lib/products/kvisa-launch-token";
import {
  getRegisteredProduct,
  productRegistry,
  type ProductRegistry,
  type RegisteredProduct,
} from "@/lib/products/registry";
import { isProductKey } from "@/lib/products/definitions";

export type ProductLaunchResult =
  | {
      status: "launchable";
      product: RegisteredProduct;
      launchUrl: string;
      launchToken: string;
    }
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

  const authorization = await findEmployeeProductLaunchAuthorization({
    employeeAccountId: input.employeeAccountId,
    productKey: product.key,
  });

  if (!authorization) {
    return { status: "unauthorized", product };
  }

  const launchToken = await signKVisaAssistantLaunchToken({
    employee: {
      id: authorization.employee.id,
      companyEmail: authorization.employee.companyEmail,
      firstName: authorization.employee.firstName,
      middleName: authorization.employee.middleName,
      lastName: authorization.employee.lastName,
      globalRole: authorization.employee.globalRole,
    },
    productKey: product.key,
    productRole: authorization.productRole,
  });

  return {
    status: "launchable",
    product,
    launchUrl: appendKVisaLaunchToken(product.launchUrl, launchToken),
    launchToken,
  };
}
