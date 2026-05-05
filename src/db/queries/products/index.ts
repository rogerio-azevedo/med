import { db } from "@/db";
import { products } from "@/db/schema";
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

export async function getProductByIdForClinic(id: string, clinicId: string) {
    const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.clinicId, clinicId)))
        .limit(1);
    return product;
}

export async function createProduct(data: typeof products.$inferInsert) {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct;
}

export async function updateProduct(
    id: string,
    clinicId: string,
    data: Partial<typeof products.$inferInsert>
) {
    const [updatedProduct] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.clinicId, clinicId)))
        .returning();
    return updatedProduct;
}

export async function deleteProduct(id: string, clinicId: string) {
    await db
        .delete(products)
        .where(and(eq(products.id, id), eq(products.clinicId, clinicId)));
}

export async function toggleProductStatus(id: string, clinicId: string, isActive: boolean) {
    const [updatedProduct] = await db
        .update(products)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.clinicId, clinicId)))
        .returning();
    return updatedProduct;
}
