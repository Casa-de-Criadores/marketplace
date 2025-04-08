// Copyright 2023-2025 the Deno authors. All rights reserved. MIT license.

/// <reference lib="deno.unstable" />

import { ulid } from "$std/ulid/mod.ts";
import Chance from "https://esm.sh/chance";
const chance = new Chance();


const DENO_KV_PATH_KEY = "DENO_KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: DENO_KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(DENO_KV_PATH_KEY);
}
export const kv = await Deno.openKv(
    Deno.env.get("DENO_DEPLOYMENT_ID") ? undefined : "./dev-kv.sqlite3",
);
/**
 * Returns an array of values of a given {@linkcode Deno.KvListIterator} that's
 * been iterated over.
 *
 * @example
 * ```ts
 * import { collectValues, listProducts, type product } from "@/utils/db.ts";
 *
 * const produtos = await collectValues<product>(listItems());
 * produtos[0].id; // Returns "01H9YD2RVCYTBVJEYEJEV5D1S1";
 * produtos[0].userLogin; // Returns "snoop"
 * produtos[0].title; // Returns "example-title"
 * produtos[0].url; // Returns "http://example.com"
 * produtos[0].score; // Returns 420
 * ```
 */
export async function collectValues<T>(iter: Deno.KvListIterator<T>) {
  return await Array.fromAsync(iter, ({ value }) => value);
}

/**
 * Random data generators for testing & seeding.
 *
 * Collapse this whole block in your editor for meowmeow :3.
 */
export const random = {
  product(params: { brandId: string; categoryId: string }): Product {
    return {
      id: ulid(),
      brandId: params.brandId,
      categoryId: params.categoryId,
      title: `${chance.word({ length: 4 })} ${chance.animal()}`,
      price: chance.integer({ min: 5000, max: 25000 }),
      description:`${chance.word({ length: 4 })} ${chance.animal()}`,
      images: [chance.url({ domain: "cdn.example.com" })],
      createdAt: new Date().toISOString(),
      inventory: chance.integer({ min: 0, max: 100 }),
      isAvailable: chance.bool({ likelihood: 90 }),
    };
  },

  productCategory(): ProductCategory {
    const nameEn = chance.word({ length: 6 });
    const nameJa = "カテゴリ";
    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return {
      id: ulid(),
      slug,
      name: {
        en: nameEn.charAt(0).toUpperCase() + nameEn.slice(1),
        ja: nameJa,
      },
    };
  },

  cartItem(productId: string): CartItem {
    return {
      productId,
      quantity: chance.integer({ min: 1, max: 4 }),
      addedAt: new Date().toISOString(),
    };
  },

  wishlistItem(productId: string): WishlistItem {
    return {
      productId,
      addedAt: new Date().toISOString(),
    };
  },

  brandProfile(params: { userId: string }): BrandProfile {
    const company = chance.company();
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    return {
      id: ulid(),
      userId: params.userId,
      title: company,
      slug,
      bio: chance.sentence({ words: 10 }),
      website: chance.url(),
      logoUrl: `https://cdn.example.com/logos/${slug}.png`,
      createdAt: new Date().toISOString(),
      status: chance.pickone<ProfileStatus>(["active", "pending", "inactive"]),
    };
  },

  customerProfile(params: { userId: string }): CustomerProfile {
    return {
      id: ulid(),
      userId: params.userId,
      displayName: `${chance.first()} ${chance.last()}`,
      avatarUrl: chance.avatar(),
      preferences: {
        theme: chance.pickone(["light", "dark", "void"]),
        showNSFW: chance.bool({ likelihood: 20 }),
      },
      createdAt: new Date().toISOString(),
      status: chance.pickone<ProfileStatus>(["active", "pending", "inactive"]),
      language: chance.pickone(["en", "ja", "pt", "es", "fr"]),
    };
  },

  user(overrides: Partial<User> = {}): User {
    const role = overrides.role ?? chance.pickone<UserRole>(["brand", "customer", "admin"]);
    const login = overrides.login ?? chance.twitter().replace("@", "").toLowerCase();
    const email = overrides.email ?? `${login}@${chance.domain()}`;

    return {
      id: ulid(),
      login,
      email,
      role,
      passwordHash: "fake$2b$10$" + chance.hash({ length: 40 }),
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  },

  address(params: { userId: string }): Address {
    return {
      id: ulid(),
      userId: params.userId,
      name: `${chance.first()} ${chance.last()}`,
      street: chance.address(),
      city: chance.city(),
      state: chance.state(),
      zip: chance.zip(),
      country: chance.country({ full: false }),
      phone: chance.phone(),
    };
  },

  shipping(params: { orderId: string }): Shipping {
    const carrier = chance.pickone<ShippingCarrier>([
      "correios",
      "custom",
      "manual",
    ]);

    const now = new Date();
    const deliveryETA = new Date(now.getTime() + chance.integer({ min: 3, max: 10 }) * 24 * 60 * 60 * 1000); // 3-10 days later

    return {
      id: ulid(),
      orderId: params.orderId,
      carrier,
      trackingCode: carrier === "correios"
          ? `BR${chance.integer({ min: 100000000, max: 999999999 })}BR`
          : undefined,
      estimatedDelivery: deliveryETA.toISOString(),
      status: chance.pickone<ShippingStatus>([
        "pending",
        "in_transit",
        "delivered",
        "failed",
      ]),
      lastUpdated: now.toISOString(),
      history: [
        {
          status: "pending",
          timestamp: now.toISOString(),
          location: chance.city(),
          note: "Shipment created",
        },
      ],
    };
  },

  paymentMethod(params: { userId: string }): PaymentMethod {
    const last4 = chance.cc({ type: "Visa" }).slice(-4);
    return {
      id: ulid(),
      userId: params.userId,
      provider: "stripe",
      label: `Visa ending in ${last4}`,
      lastUsedAt: new Date().toISOString(),
      isDefault: chance.bool({ likelihood: 80 }),
    };
  },

  order(params: {
    userId: string;
    productPool: Array<Pick<Product, "id" | "price">>;
    addressId: string;
    paymentMethodId: string;
  }): Order {
    const numItems = chance.integer({ min: 1, max: 5 });

    const selectedProducts = chance.pickset(
        params.productPool,
        numItems
    ) as Array<Pick<Product, "id" | "price">>;

    const items: OrderItem[] = selectedProducts.map((product) => ({
      productId: product.id,
      quantity: chance.integer({ min: 1, max: 3 }),
    }));

    const total = items.reduce((acc, item) => {
      const price = params.productPool.find((p) => p.id === item.productId)?.price ?? 0;
      return acc + price * item.quantity;
    }, 0);

    return {
      id: ulid(),
      userId: params.userId,
      items,
      total,
      placedAt: new Date().toISOString(),
      notes:`${chance.word({ length: 4 })} ${chance.animal()}`,
      status: chance.pickone<OrderStatus>([
        "pending",
        "paid",
        "shipped",
        "cancelled",
        "delivered",
      ]),
      shippingAddressId: params.addressId,
      paymentMethodId: params.paymentMethodId,
    };
  },
};

/**
 * Creates a new product in the database, indexing it by both product ID
 * and the brand that owns it. Fails if the product already exists under
 * either index.
 *
 * This operation is atomic. If a product with the same ID or
 * (brandId + productId) already exists, it will not be overwritten.
 *
 * @example
 * ```ts
 * import { createProduct } from "@/utils/db.ts";
 * import { ulid } from "$std/ulid/mod.ts";
 *
 * await createProduct({
 *   id: ulid(),
 *   brandId: "brand_01HXYZ...",
 *   title: "Cybercore Harness",
 *   price: 18900, // in BRL cents
 *   images: ["https://cdn.example.com/products/harness.jpg"],
 *   categoryId: "cat_01HX...",
 *   createdAt: new Date().toISOString(),
 *   inventory: 12,
 *   isAvailable: true,
 * });
 * ```
 */
export async function createProduct(product: Product) {
  const productKey = ["product", product.id];
  const productByBrandKey = ["product_by_brand", product.brandId, product.id];

  const res = await kv.atomic()
      .check({ key: productKey, versionstamp: null })
      .check({ key: productByBrandKey, versionstamp: null })
      .set(productKey, product)
      .set(productByBrandKey, product)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to create product:", product.id);

    const existing = await Promise.all([
      kv.get(productKey),
      kv.get(productByBrandKey),
    ]);
    console.log("🔍 Existing product?", existing[0].value);
    console.log("🔍 Existing product_by_brand?", existing[1].value);

    throw new Error("Failed to create product");
  }

  console.log("✅ Product created:", product.id);
}

/**
 * Updates an existing product in the database.
 * This will overwrite the product at both:
 * - `["product", product.id]`
 * - `["product_by_brand", product.brandId, product.id]`
 *
 * This operation is atomic and ensures consistency across both primary
 * and secondary indexes.
 *
 * @example
 * ```ts
 * import { updateProduct } from "@/utils/db.ts";
 *
 * await updateProduct({
 *   id: "prod_01HX...",
 *   brandId: "brand_01HX...",
 *   title: "Updated Title",
 *   price: 19900,
 *   images: ["https://cdn.example.com/products/new.jpg"],
 *   categoryId: "cat_01HX...",
 *   createdAt: "2025-04-01T12:00:00Z",
 *   inventory: 30,
 *   isAvailable: true,
 * });
 * ```
 *
 * @param product - The full product object to overwrite in both indexes.
 * @throws If the atomic update operation fails.
 */
export async function updateProduct(product: Product): Promise<void> {
  const productKey = ["product", product.id];
  const byBrandKey = ["product_by_brand", product.brandId, product.id];

  const res = await kv.atomic()
      .set(productKey, product)
      .set(byBrandKey, product)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to update product:", product.id);
    throw new Error("Failed to update product");
  }

  console.log("✅ Product updated:", product.id);
}

/**
 * Deletes a product from the database using its ID and brand ID.
 * This operation is atomic and removes the product from both:
 * - `["product", id]`
 * - `["product_by_brand", brandId, id]`
 *
 * @example
 * ```ts
 * import { deleteProduct } from "@/utils/db.ts";
 *
 * await deleteProduct("prod_01HX...", "brand_01HX...");
 * ```
 *
 * @param id - The ID of the product to delete.
 * @param brandId - The brand ID associated with the product, used for reverse index cleanup.
 * @throws If the atomic delete operation fails.
 */
export async function deleteProduct(id: string, brandId: string): Promise<void> {
  const productKey = ["product", id];
  const byBrandKey = ["product_by_brand", brandId, id];
  const res = await kv.atomic()
      .delete(productKey)
      .delete(byBrandKey)
      .commit();

  if (!res.ok) throw new Error("Failed to delete product");
}

/**
 * Gets the product with the given ID from the database.
 *
 * @example
 * ```ts
 * import { getProduct } from "@/utils/db.ts";
 *
 * const product = await getProduct("01H9YD2RVCYTBVJEYEJEV5D1S1");
 * product?.id;         // → "01H9YD2RVCYTBVJEYEJEV5D1S1"
 * product?.title;      // → "Cybercore Harness"
 * product?.brandId;    // → "brand_01HX..."
 * product?.price;      // → 18900
 * product?.categoryId; // → "cat_01HX..."
 * ```
 */
export async function getProduct(id: string): Promise<Product | null> {
  const res = await kv.get<Product>(["product", id]);
  return res.value;
}

/**
 * Creates a new product category in the database.
 * The category is stored at the key: `["product_category", categoryId]`.
 *
 * This operation is atomic and will fail if a category with the same ID already exists.
 *
 * @example
 * ```ts
 * await createProductCategory({
 *   id: "cat_01HX...",
 *   slug: "altwear",
 *   name: {
 *     en: "Altwear",
 *     ja: "オルトウェア"
 *   }
 * });
 * ```
 *
 * @param category - The full `ProductCategory` object to insert.
 * @throws If the category already exists or the atomic operation fails.
 */
export async function createProductCategory(category: ProductCategory): Promise<void> {
  const key = ["product_category", category.id];
  const res = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, category)
      .commit();

  if (!res.ok) throw new Error("Failed to create product category");
}

/**
 * Updates an existing product category in the database.
 * This will overwrite the category stored at `["product_category", categoryId]`.
 *
 * @example
 * ```ts
 * await updateProductCategory({
 *   id: "cat_01HX...",
 *   slug: "altwear",
 *   name: {
 *     en: "Updated Altwear",
 *     ja: "オルトウェア"
 *   }
 * });
 * ```
 *
 * @param category - The full `ProductCategory` object to update.
 * @throws If the atomic update operation fails.
 */
export async function updateProductCategory(category: ProductCategory): Promise<void> {
  const key = ["product_category", category.id];
  const res = await kv.atomic().set(key, category).commit();
  if (!res.ok) throw new Error("Failed to update product category");
}

/**
 * Deletes a product category from the database.
 * Removes the category stored at `["product_category", categoryId]`.
 *
 * @example
 * ```ts
 * await deleteProductCategory("cat_01HX...");
 * ```
 *
 * @param id - The ID of the product category to delete.
 * @throws If the deletion operation fails.
 */
export async function deleteProductCategory(id: string): Promise<void> {
  await kv.delete(["product_category", id]);
}

/**
 * Retrieves a product category from the database by its ID.
 * Looks up the category stored at `["product_category", categoryId]`.
 *
 * @example
 * ```ts
 * const category = await getProductCategory("cat_01HX...");
 * console.log(category?.name.en); // → "Altwear"
 * ```
 *
 * @param id - The ID of the product category to fetch.
 * @returns The `ProductCategory` object, or `null` if not found.
 */
export async function getProductCategory(id: string): Promise<ProductCategory | null> {
  const res = await kv.get<ProductCategory>(["product_category", id]);
  return res.value;
}

/**
 * Replaces the entire shopping cart for the specified user.
 * Overwrites the cart stored at `["cart", userId]` with a new list of items.
 *
 * This is a full replacement — not a partial or additive update.
 *
 * @example
 * ```ts
 * await setCart("user_01HX...", [
 *   { productId: "prod_01HX...", quantity: 2, addedAt: new Date().toISOString() },
 *   { productId: "prod_01HZ...", quantity: 1, addedAt: new Date().toISOString() },
 * ]);
 * ```
 *
 * @param userId - The ID of the user whose cart is being replaced.
 * @param items - An array of `CartItem` objects to store.
 */
export async function setCart(userId: string, items: CartItem[]): Promise<void> {
  await kv.set(["cart", userId], items);
}

/**
 * Adds a product to the user's shopping cart.
 * If the product is already in the cart, it increments the quantity.
 * If not, it adds a new `CartItem` with quantity = 1.
 *
 * Internally reads from and updates the cart stored at `["cart", userId]`.
 *
 * @example
 * ```ts
 * await addToCart("user_01HX...", "prod_01ABC...");
 * ```
 *
 * @param userId - The ID of the user.
 * @param productId - The product to add to the cart.
 * @param quantity - (Optional) Quantity to add. Defaults to 1.
 */
export async function addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
): Promise<void> {
  const cartKey = ["cart", userId];
  const res = await kv.get<CartItem[]>(cartKey);
  const existingCart = res.value ?? [];

  const updatedCart = [...existingCart];
  const existingIndex = updatedCart.findIndex((item) => item.productId === productId);

  if (existingIndex >= 0) {
    updatedCart[existingIndex].quantity += quantity;
  } else {
    updatedCart.push({
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    });
  }

  await kv.set(cartKey, updatedCart);
}

/**
 * Removes a product from the user's shopping cart.
 * If the product is not in the cart, this is a no-op.
 *
 * Internally reads from and updates the cart stored at `["cart", userId]`.
 *
 * @example
 * ```ts
 * await removeFromCart("user_01HX...", "prod_01ABC...");
 * ```
 *
 * @param userId - The ID of the user.
 * @param productId - The product to remove from the cart.
 */
export async function removeFromCart(
    userId: string,
    productId: string,
): Promise<void> {
  const cartKey = ["cart", userId];
  const res = await kv.get<CartItem[]>(cartKey);
  const existingCart = res.value ?? [];

  const updatedCart = existingCart.filter((item) => item.productId !== productId);

  await kv.set(cartKey, updatedCart);
}

/**
 * Retrieves the full cart for the specified user.
 * Reads from the key `["cart", userId]`.
 *
 * If the cart does not exist, an empty array is returned.
 *
 * @example
 * ```ts
 * const cart = await getCart("user_01HX...");
 * console.log(cart.length); // → 2
 * ```
 *
 * @param userId - The ID of the user whose cart is being fetched.
 * @returns An array of `CartItem` objects, or an empty array if no cart exists.
 */
export async function getCart(userId: string): Promise<CartItem[]> {
  const res = await kv.get<CartItem[]>(["cart", userId]);
  return res.value ?? [];
}

/**
 * Deletes the entire shopping cart for the specified user.
 * Removes the cart stored at `["cart", userId]`.
 *
 * @example
 * ```ts
 * await clearCart("user_01HX...");
 * ```
 *
 * @param userId - The ID of the user whose cart should be cleared.
 */
export async function clearCart(userId: string): Promise<void> {
  await kv.delete(["cart", userId]);
}

/**
 * Replaces the entire wishlist for the specified user.
 * Overwrites the wishlist stored at `["wishlist", userId]` with the provided items.
 *
 * This is a full replacement — existing entries are discarded.
 *
 * @example
 * ```ts
 * await setWishlist("user_01HX...", [
 *   { productId: "prod_01HX...", addedAt: new Date().toISOString() },
 *   { productId: "prod_01HZ...", addedAt: new Date().toISOString() },
 * ]);
 * ```
 *
 * @param userId - The ID of the user whose wishlist is being set.
 * @param items - An array of `WishlistItem` objects to store.
 */
export async function setWishlist(userId: string, items: WishlistItem[]): Promise<void> {
  await kv.set(["wishlist", userId], items);
}

/**
 * Retrieves the entire wishlist for the specified user.
 * Reads from the key `["wishlist", userId]`.
 *
 * If the wishlist does not exist, an empty array is returned.
 *
 * @example
 * ```ts
 * const wishlist = await getWishlist("user_01HX...");
 * console.log(wishlist.length); // → 2
 * ```
 *
 * @param userId - The ID of the user whose wishlist is being fetched.
 * @returns An array of `WishlistItem` objects, or an empty array if none exist.
 */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const res = await kv.get<WishlistItem[]>(["wishlist", userId]);
  return res.value ?? [];
}

/**
 * Clears the entire wishlist for the specified user.
 * Deletes the key at `["wishlist", userId]`.
 *
 * @example
 * ```ts
 * await clearWishlist("user_01HX...");
 * ```
 *
 * @param userId - The ID of the user whose wishlist should be cleared.
 */
export async function clearWishlist(userId: string): Promise<void> {
  await kv.delete(["wishlist", userId]);
}

/**
 * Returns a {@linkcode Deno.KvListIterator} which can be used to iterate over
 * the produtos in the database, in chronological order.
 *
 * @example
 * ```ts
 * import { listItems } from "@/utils/db.ts";
 *
 * for await (const entry of listItems()) {
 *   entry.value.id; // Returns "01H9YD2RVCYTBVJEYEJEV5D1S1"
 *   entry.value.userLogin; // Returns "pedro"
 *   entry.key; // Returns ["items_voted_by_user", "01H9YD2RVCYTBVJEYEJEV5D1S1", "pedro"]
 *   entry.versionstamp; // Returns "00000000000000010000"
 * }
 * ```
 */
export async function listProducts(options?: Deno.KvListOptions): Promise<Product[]> {
  const iter = kv.list<Product>({ prefix: ["products"] }, options);
  const products: Product[] = [];
  for await (const entry of iter) {
    products.push(entry.value);
  }
  return products;
}

/**
 * Creates a new order under a user's order list.
 *
 * @example
 * ```ts
 * await createOrder(order);
 * ```
 */
export async function createOrder(order: Order): Promise<void> {
  const key = ["order", order.userId, order.id];

  const res = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, order)
      .commit();

  if (!res.ok) throw new Error("Failed to create order");
}

/**
 * Updates an existing order.
 */
export async function updateOrder(order: Order): Promise<void> {
  const key = ["order", order.userId, order.id];

  const res = await kv.atomic()
      .set(key, order)
      .commit();

  if (!res.ok) throw new Error("Failed to update order");
}

/**
 * Deletes an order.
 */
export async function deleteOrder(userId: string, orderId: string): Promise<void> {
  const key = ["order", userId, orderId];
  await kv.delete(key);
}

/**
 * Creates a new address entry in the database for the given user.
 * The address is stored at the key: `["address", userId, addressId]`.
 *
 * This operation is atomic and fails if the address already exists.
 *
 * @example
 * ```ts
 * await createAddress({
 *   id: "addr_01HX...",
 *   userId: "user_01HX...",
 *   name: "Jane Doe",
 *   street: "123 Alt Street",
 *   city: "Neo Tokyo",
 *   state: "CA",
 *   zip: "94107",
 *   country: "JP",
 *   phone: "+81-80-1234-5678",
 * });
 * ```
 *
 * @param address - The full `Address` object to create.
 * @throws If the address already exists or the atomic operation fails.
 */
export async function createAddress(address: Address): Promise<void> {
  const key = ["address", address.userId, address.id];

  const res = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, address)
      .commit();

  if (!res.ok) throw new Error("Failed to create address");
}

/**
 * Updates an existing address entry in the database.
 * This operation overwrites the entire address at:
 * `["address", userId, addressId]`.
 *
 * @example
 * ```ts
 * await updateAddress({
 *   id: "addr_01HX...",
 *   userId: "user_01HX...",
 *   name: "Jane Doe",
 *   street: "456 Post-Cyber Street",
 *   city: "New Kyoto",
 *   state: "CA",
 *   zip: "94016",
 *   country: "JP",
 * });
 * ```
 *
 * @param address - The full `Address` object to update.
 * @throws If the atomic update operation fails.
 */
export async function updateAddress(address: Address): Promise<void> {
  const key = ["address", address.userId, address.id];

  const res = await kv.atomic()
      .set(key, address)
      .commit();

  if (!res.ok) throw new Error("Failed to update address");
}

/**
 * Deletes a user's address by its ID.
 * Removes the entry at `["address", userId, addressId]`.
 *
 * @example
 * ```ts
 * await deleteAddress("user_01HX...", "addr_01HX...");
 * ```
 *
 * @param userId - The ID of the user who owns the address.
 * @param addressId - The ID of the address to delete.
 * @throws If deletion fails.
 */
export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  await kv.delete(["address", userId, addressId]);
}

/**
 * Creates a new payment method entry for the given user.
 * The method is stored at the key: `["payment_method", userId, methodId]`.
 *
 * This operation is atomic and will fail if the payment method already exists.
 *
 * @example
 * ```ts
 * await createPaymentMethod({
 *   id: "pm_01HX...",
 *   userId: "user_01HX...",
 *   provider: "stripe",
 *   label: "Visa ending in 4242",
 *   lastUsedAt: new Date().toISOString(),
 *   isDefault: true,
 * });
 * ```
 *
 * @param method - The full `PaymentMethod` object to create.
 * @throws If the method already exists or the atomic operation fails.
 */
export async function createPaymentMethod(method: PaymentMethod): Promise<void> {
  const key = ["payment_method", method.userId, method.id];

  const res = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, method)
      .commit();

  if (!res.ok) throw new Error("Failed to create payment method");
}

/**
 * Updates an existing payment method entry in the database.
 * This will overwrite the method at:
 * `["payment_method", userId, methodId]`.
 *
 * @example
 * ```ts
 * await updatePaymentMethod({
 *   id: "pm_01HX...",
 *   userId: "user_01HX...",
 *   provider: "stripe",
 *   label: "Visa ending in 4242",
 *   isDefault: false,
 * });
 * ```
 *
 * @param method - The full `PaymentMethod` object to update.
 * @throws If the atomic update operation fails.
 */
export async function updatePaymentMethod(method: PaymentMethod): Promise<void> {
  const key = ["payment_method", method.userId, method.id];

  const res = await kv.atomic()
      .set(key, method)
      .commit();

  if (!res.ok) throw new Error("Failed to update payment method");
}

/**
 * Deletes a payment method entry by user ID and method ID.
 * Removes the entry at `["payment_method", userId, methodId]`.
 *
 * @example
 * ```ts
 * await deletePaymentMethod("user_01HX...", "pm_01HX...");
 * ```
 *
 * @param userId - The ID of the user who owns the payment method.
 * @param methodId - The ID of the payment method to delete.
 * @throws If the deletion fails.
 */
export async function deletePaymentMethod(userId: string, methodId: string): Promise<void> {
  await kv.delete(["payment_method", userId, methodId]);
}

/**
 * Creates a new brand profile in the database, indexed by both brand ID
 * and user ID. Throws if the brand already exists in either index.
 *
 * This operation is atomic. If a brand with the same ID or
 * (userId + brandId) already exists, it will not be overwritten.
 *
 * @example
 * ```ts
 * import { createBrand } from "@/utils/db.ts";
 * import { ulid } from "$std/ulid/mod.ts";
 *
 * await createBrand({
 *   id: ulid(),
 *   userId: "user_01HX...",
 *   title: "Sim Sukeban",
 *   slug: "sim-sukeban",
 *   bio: "Post-dystopian luxury at discount prices",
 *   website: "https://sukeban.net",
 *   logoUrl: "https://cdn.example.com/logos/sim.png",
 *   createdAt: new Date().toISOString(),
 *   status: "active",
 * });
 * ```
 */
export async function createBrand(brand: BrandProfile) {
  const brandKey = ["brand", brand.id];
  const brandByUserKey = ["brand_by_user", brand.userId, brand.id];

  const res = await kv.atomic()
      .check({ key: brandKey, versionstamp: null })
      .check({ key: brandByUserKey, versionstamp: null })
      .set(brandKey, brand)
      .set(brandByUserKey, brand)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to create brand:", brand.id);

    const existing = await Promise.all([
      kv.get(brandKey),
      kv.get(brandByUserKey),
    ]);
    console.log("🔍 Existing brand?", existing[0].value);
    console.log("🔍 Existing brand_by_user?", existing[1].value);

    throw new Error("Failed to create brand");
  }

  console.log("✅ Brand created:", brand.id);
}

/**
 * Updates an existing brand profile in the database.
 * This operation is atomic and will overwrite both:
 * - `["brand", brandId]`
 * - `["brand_by_user", userId, brandId]`
 *
 * If the brand does not exist, this will create it.
 * Use `createBrand()` if you want to enforce uniqueness instead.
 *
 * @example
 * ```ts
 * import { updateBrand } from "@/utils/db.ts";
 *
 * await updateBrand({
 *   id: "brand_01HX...",
 *   userId: "user_01HX...",
 *   title: "Sim Sukeban Updated",
 *   slug: "sim-sukeban",
 *   bio: "New aesthetic, same attitude.",
 *   website: "https://sukeban.net",
 *   logoUrl: "https://cdn.example.com/logos/sim.png",
 *   createdAt: "2025-04-01T00:00:00Z",
 *   status: "active",
 * });
 * ```
 *
 * @param brand - The full BrandProfile object to overwrite.
 * @throws If the atomic update operation fails.
 */
export async function updateBrand(brand: BrandProfile): Promise<void> {
  const brandKey = ["brand", brand.id];
  const brandByUserKey = ["brand_by_user", brand.userId, brand.id];

  const res = await kv.atomic()
      .set(brandKey, brand)
      .set(brandByUserKey, brand)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to update brand:", brand.id);
    throw new Error("Failed to update brand");
  }

  console.log("✅ Brand updated:", brand.id);
}

/**
 * Deletes a brand profile from the database using its ID and associated user ID.
 * This operation is atomic and removes the brand from both:
 * - `["brand", brandId]`
 * - `["brand_by_user", userId, brandId]`
 *
 * @example
 * ```ts
 * import { deleteBrand } from "@/utils/db.ts";
 *
 * await deleteBrand("brand_01HX...", "user_01HX...");
 * ```
 *
 * @param brandId - The unique ID of the brand to delete.
 * @param userId - The ID of the user who owns the brand, used for secondary index cleanup.
 * @throws If the atomic delete operation fails.
 */
export async function deleteBrand(brandId: string, userId: string): Promise<void> {
  const brandKey = ["brand", brandId];
  const brandByUserKey = ["brand_by_user", userId, brandId];

  const res = await kv.atomic()
      .delete(brandKey)
      .delete(brandByUserKey)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to delete brand:", brandId);
    throw new Error("Failed to delete brand");
  }

  console.log("✅ Brand deleted:", brandId);
}

/**
 * Gets the brand profile with the given ID from the database.
 *
 * @example
 * ```ts
 * import { getBrand } from "@/utils/db.ts";
 *
 * const brand = await getBrand("01H9YD2RVCYTBVJEYEJEV5D1S1");
 * brand?.id;        // → "01H9YD2RVCYTBVJEYEJEV5D1S1"
 * brand?.userId;    // → "user_01H..."
 * brand?.title;     // → "Sim Sukeban"
 * brand?.slug;      // → "sim-sukeban"
 * brand?.website;   // → "https://sukeban.net"
 * ```
 */
export async function getBrand(id: string): Promise<BrandProfile | null> {
  const res = await kv.get<BrandProfile>(["brand", id]);
  return res.value;
}

/**
 * Returns all brand profiles in the database.
 *
 * @example
 * ```ts
 * import { listBrands } from "@/utils/db.ts";
 *
 * const brands = await listBrands();
 * brands.forEach((brand) => {
 *   brand.id;       // → "01H9YD2RVCYTBVJEYEJEV5D1S1"
 *   brand.userId;   // → "user_01HX..."
 *   brand.title;    // → "Sim Sukeban"
 * });
 * ```
 */
export async function listBrands(options?: Deno.KvListOptions): Promise<BrandProfile[]> {
  const iter = kv.list<BrandProfile>({ prefix: ["brand"] }, options);
  const brands: BrandProfile[] = [];
  for await (const entry of iter) {
    brands.push(entry.value);
  }
  return brands;
}

/**
 * Returns an async iterator of brand profiles associated with a given user ID.
 * This allows listing all brands owned by a specific user.
 *
 * @example
 * ```ts
 * import { listBrandsByUser } from "@/utils/db.ts";
 *
 * for await (const entry of listBrandsByUser("user_01HX...")) {
 *   entry.value.id;       // → "01H9YD2RVCYTBVJEYEJEV5D1S1"
 *   entry.value.userId;   // → "user_01HX..."
 *   entry.value.slug;     // → "sim-sukeban"
 * }
 * ```
 */
export function listBrandsByUser(
    userId: string,
    options?: Deno.KvListOptions,
) {
  return kv.list<BrandProfile>({ prefix: ["brand_by_user", userId] }, options);
}

/**
 * Returns a {@linkcode Deno.KvListIterator} which can be used to iterate over
 * the produtos by a given user in the database, in chronological order.
 *
 * @example
 * ```ts
 * import { listItemsByUser } from "@/utils/db.ts";
 *
 * for await (const entry of listItemsByUser("pedro")) {
 *   entry.value.id; // Returns "01H9YD2RVCYTBVJEYEJEV5D1S1"
 *   entry.value.userLogin; // Returns "pedro"
 *   entry.key; // Returns ["items_voted_by_user", "01H9YD2RVCYTBVJEYEJEV5D1S1", "pedro"]
 *   entry.versionstamp; // Returns "00000000000000010000"
 * }
 * ```
 */
export function listProductsByBrand(
  id: string,
  options?: Deno.KvListOptions,
) {
  return kv.list<Product>({ prefix: ["products_by_brand", id] }, options);
}

/**
 * Creates a new customer profile in the database, stored at `["customer", userId]`.
 * Fails if a profile with the same userId already exists.
 *
 * @example
 * ```ts
 * await createCustomerProfile({
 *   id: "cust_01HX...",
 *   userId: "user_01HX...",
 *   displayName: "Lain",
 *   avatarUrl: "https://example.com/avatar.png",
 *   preferences: { theme: "void" },
 *   createdAt: new Date().toISOString(),
 *   status: "active",
 *   language: "ja"
 * });
 * ```
 *
 * @param profile - The full `CustomerProfile` object to insert.
 * @throws If the profile already exists or the atomic operation fails.
 */
export async function createCustomer(profile: CustomerProfile): Promise<void> {
  const key = ["customer", profile.userId];

  const res = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, profile)
      .commit();

  if (!res.ok) throw new Error("Failed to create customer profile");
}

/**
 * Updates an existing customer profile.
 * Overwrites the profile stored at `["customer", userId]`.
 *
 * @example
 * ```ts
 * await updateCustomerProfile({ ...existing, status: "inactive" });
 * ```
 *
 * @param profile - The full `CustomerProfile` object to store.
 * @throws If the atomic update operation fails.
 */
export async function updateCustomer(profile: CustomerProfile): Promise<void> {
  const key = ["customer", profile.userId];

  const res = await kv.atomic()
      .set(key, profile)
      .commit();

  if (!res.ok) throw new Error("Failed to update customer profile");
}

/**
 * Deletes a customer profile from the database.
 * Removes the profile stored at `["customer", userId]`.
 *
 * @example
 * ```ts
 * await deleteCustomerProfile("user_01HX...");
 * ```
 *
 * @param userId - The ID of the user whose customer profile to delete.
 * @throws If the deletion fails.
 */
export async function deleteCustomer(userId: string): Promise<void> {
  await kv.delete(["customer", userId]);
}

/**
 * Creates a user in the database, indexed by user ID.
 * Fails if a user with the same ID already exists.
 *
 * @example
 * ```ts
 * import { createUser } from "@/utils/db.ts";
 * import { ulid } from "std/uuid/mod.ts";
 *
 * await createUser({
 *   id: ulid(),
 *   login: "jack",
 *   email: "jack@example.com",
 *   passwordHash: "fake$2b$10$abc...",
 *   role: "brand",
 *   createdAt: new Date().toISOString(),
 * });
 * ```
 */
export async function createUser(user: User): Promise<void> {
  const userKey = ["user", user.id];

  const res = await kv.atomic()
      .check({ key: userKey, versionstamp: null })
      .set(userKey, user)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to create user:", user.id);
    throw new Error("Failed to create user");
  }

  console.log("✅ User created:", user.id);
}

/**
 * Updates an existing user in the database by ID.
 * This will overwrite the existing data with the provided user object.
 *
 * If the user does not exist, this will silently insert it. Use `createUser`
 * if you want to enforce uniqueness via `.check(...)`.
 *
 * @example
 * ```ts
 * import { updateUser } from "@/utils/db.ts";
 *
 * await updateUser({
 *   id: "user_01HX...",
 *   login: "jack",
 *   email: "jack@example.com",
 *   passwordHash: "updated$2b$...",
 *   role: "customer",
 *   createdAt: "2025-04-01T00:00:00Z",
 * });
 * ```
 *
 * @param user - The full User object to overwrite in the database.
 * @throws If the atomic set operation fails.
 */
export async function updateUser(user: User): Promise<void> {
  const userKey = ["user", user.id];

  const res = await kv.atomic()
      .set(userKey, user)
      .commit();

  if (!res.ok) {
    console.error("❌ Failed to update user:", user.id);
    throw new Error("Failed to update user");
  }

  console.log("✅ User updated:", user.id);
}

/**
 * Deletes a user from the database using their ID.
 * This removes the user from the `["user", id]` key.
 *
 * @example
 * ```ts
 * import { deleteUser } from "@/utils/db.ts";
 *
 * await deleteUser("user_01HX...");
 * ```
 *
 * @param id - The ULID or UUID of the user to delete.
 * @throws If the deletion fails.
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    await kv.delete(["user", id]);
    console.log("✅ User deleted:", id);
  } catch (err) {
    console.error("❌ Failed to delete user:", id);
    throw err;
  }
}

/**
 * Gets the user with the given ID from the database.
 *
 * @example
 * ```ts
 * import { getUser } from "@/utils/db.ts";
 *
 * const user = await getUser("user_01HX...");
 * user?.login;     // → "jack"
 * user?.email;     // → "jack@example.com"
 * user?.role;      // → "brand"
 * ```
 */
export async function getUser(id: string): Promise<User | null> {
  const res = await kv.get<User>(["user", id]);
  return res.value;
}

/**
 * Returns a {@linkcode Deno.KvListIterator} to iterate over all users in the database.
 *
 * @example
 * ```ts
 * import { listUsers } from "@/utils/db.ts";
 *
 * for await (const entry of listUsers()) {
 *   entry.value.id;       // → "user_01HX..."
 *   entry.value.login;    // → "jack"
 *   entry.value.email;    // → "jack@example.com"
 *   entry.value.role;     // → "customer"
 * }
 * ```
 */
export function listUsers(options?: Deno.KvListOptions) {
  return kv.list<User>({ prefix: ["user"] }, options);
}
