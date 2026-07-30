export type CartMap = Record<string, number>;
type CartProduct = {
  id: string | number;
  stock?: number;
  inStock?: boolean;
};

export const cartStorageKey = "annai_cart";
export const cartUpdatedEvent = "annai-cart-updated";

export const readCart = (): CartMap => {
  try {
    const parsed = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const syncCartWithAccount = async (cart: CartMap = readCart()) => {
  let products: Record<string, CartProduct> = {};
  try {
    products = JSON.parse(localStorage.getItem("annai_cart_products") || "{}");
  } catch {
    products = {};
  }
  const items = Object.entries(cart).flatMap(([key, quantity]) => {
    const productId = Number(products[key]?.id);
    return Number.isInteger(productId) && productId > 0 && quantity > 0
      ? [{ productId, quantity: Number(quantity) }]
      : [];
  });
  await fetch(`${API_BASE_URL}/me/cart`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).then((response) => {
    if (!response.ok) throw new Error("Cart sync failed");
  });
};

export const writeCart = (cart: CartMap) => {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(cartUpdatedEvent, { detail: cart }));
  void syncCartWithAccount(cart).catch(() => {
    // The local cart remains usable while the account API is unavailable.
  });
};

export const cartCount = (cart: CartMap) => Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);

export const reconcileCart = (cart: CartMap, products: CartProduct[]) => {
  const next: CartMap = {};
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  Object.entries(cart).forEach(([id, quantity]) => {
    const product = productsById.get(String(id));
    if (!product) return;
    const stock = Math.max(Number(product.stock || 0), 0);
    if (product.inStock === false || stock <= 0) return;
    const nextQuantity = Math.min(Math.max(Number(quantity || 0), 0), stock);
    if (nextQuantity > 0) next[String(id)] = nextQuantity;
  });
  return next;
};

export const cartsEqual = (left: CartMap, right: CartMap) => JSON.stringify(left) === JSON.stringify(right);
import { API_BASE_URL } from "./config";
