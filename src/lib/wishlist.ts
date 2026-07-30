import { websiteApi } from "./api";

export const wishlistUpdatedEvent = "annai-wishlist-updated";

export const loadWishlistIds = async () => {
  const { products } = await websiteApi.wishlist();
  return new Set(products.map((product) => String(product.id)));
};

export const notifyWishlistUpdated = () => {
  window.dispatchEvent(new Event(wishlistUpdatedEvent));
};
