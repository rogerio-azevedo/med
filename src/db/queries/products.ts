import { db } from "../index";
import { products } from "../schema";
import { asc, eq, and } from "drizzle-orm";

export async function getProducts(clinicId: string) {
    return db
        .select()
        .from(products)
        .where(eq(products.clinicId, clinicId))
        .orderBy(asc(products.name));
}

export async function getProductById(id: string) {
    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
    return product;
}

export async function createProduct(data: typeof products.$inferInsert) {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct;
}

export async function updateProduct(
    id: string,
    data: Partial<typeof products.$inferInsert>
) {
    const [updatedProduct] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
    return updatedProduct;
}

export async function deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
}

export async function toggleProductStatus(id: string, isActive: boolean) {
    const [updatedProduct] = await db
        .update(products)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
    return updatedProduct;
}
