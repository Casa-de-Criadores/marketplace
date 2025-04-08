import {
    random,
    createUser,
    createBrand,
    createProduct,
    createCustomer,
    createAddress,
    createPaymentMethod,
    createOrder,
    setCart,
    setWishlist,
    createProductCategory,
} from "@/utils/db.ts";
import type { User, BrandProfile, Product, CartItem, WishlistItem } from "@/utils/db.ts";

import Chance from "https://esm.sh/chance";
const chance = new Chance();

// Reference: https://github.com/HackerNews/API
// const API_BASE_URL = `https://hacker-news.firebaseio.com/v0`;
// const API_ITEM_URL = `${API_BASE_URL}/item`;
// const API_TOP_STORIES_URL = `${API_BASE_URL}/topstories.json`;
// const TOP_STORIES_COUNT = 10;

const NUM_BRANDS = 5;
const NUM_CUSTOMERS = 10;
const PRODUCTS_PER_BRAND = 8;

// 1. Seed product categories
const categories = Array.from({ length: 4 }, () => random.productCategory());
await Promise.all(categories.map(createProductCategory));

// 2. Seed brands + products
const products: Product[] = [];

const brandUsers: Array<{
    user: User;
    brand: BrandProfile;
    products: Product[];
}> = [];

await Promise.all(
    Array.from({ length: NUM_BRANDS }).map(async () => {
        const user = random.user({ role: "brand" });
        const brand = random.brandProfile({ userId: user.id });

        await createUser(user);
        await createBrand(brand);

        const userProducts = Array.from({ length: PRODUCTS_PER_BRAND }, () =>
            random.product({
                brandId: brand.id,
                categoryId: chance.pickone(categories).id,
            })
        );

        await Promise.all(userProducts.map(createProduct));
        products.push(...userProducts);

        brandUsers.push({ user, brand, products: userProducts });

        return user;
    })
);

// 3. Seed customers + orders + cart + wishlist
await Promise.all(
    Array.from({ length: NUM_CUSTOMERS }).map(async () => {
        const user = random.user({ role: "customer" });
        const profile = random.customerProfile({ userId: user.id });
        const address = random.address({ userId: user.id });
        const payment = random.paymentMethod({ userId: user.id });

        await createUser(user);
        await createCustomer(profile);
        await createAddress(address);
        await createPaymentMethod(payment);

        const order = random.order({
            userId: user.id,
            productPool: products.map(({ id, price }) => ({ id, price })),
            addressId: address.id,
            paymentMethodId: payment.id,
        });

        await createOrder(order);

        const cartItems: CartItem[] = chance
            .pickset(products, 3)
            .map((p: Product) => random.cartItem(p.id));
        await setCart(user.id, cartItems);

        const wishlistItems: WishlistItem[] = chance
            .pickset(products, 3)
            .map((p: Product) => random.wishlistItem(p.id));
        await setWishlist(user.id, wishlistItems);

        await setWishlist(user.id, wishlistItems);

        return user;
    })
);

console.log("🌱 Seed complete: brands, products, customers, orders, and extras are in KV");