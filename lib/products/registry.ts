import "server-only";

import { appEnv, type AppEnv } from "@/lib/env/app";
import {
  productRolesByProduct,
  type ProductKey,
  type ProductRole,
} from "@/lib/products/definitions";

export type RegisteredProduct = {
  key: ProductKey;
  displayName: string;
  description: string;
  enabled: boolean;
  launchUrl: string | null;
  roles: readonly ProductRole[];
};

export type ProductRegistry = Record<ProductKey, RegisteredProduct>;

export function createProductRegistry(env: Pick<AppEnv, "KVISA_ASSISTANT_ENABLED" | "KVISA_ASSISTANT_LAUNCH_URL">): ProductRegistry {
  return {
    kvisa_assistant: {
      key: "kvisa_assistant",
      displayName: "K Visa Assistant",
      description: "Immigration workflow support for K visa matters.",
      enabled: env.KVISA_ASSISTANT_ENABLED,
      launchUrl: env.KVISA_ASSISTANT_LAUNCH_URL ?? null,
      roles: productRolesByProduct.kvisa_assistant,
    },
  };
}

export const productRegistry = createProductRegistry(appEnv);

export function getRegisteredProduct(
  productKey: ProductKey,
  registry: ProductRegistry = productRegistry
): RegisteredProduct {
  return registry[productKey];
}

export function listRegisteredProducts(
  registry: ProductRegistry = productRegistry
): RegisteredProduct[] {
  return Object.values(registry);
}

export function listEnabledProducts(
  registry: ProductRegistry = productRegistry
): RegisteredProduct[] {
  return listRegisteredProducts(registry).filter((product) => product.enabled);
}
