"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProductByIdForClinic,
} from "@/db/queries/products";
import {
    createProductSchema,
    type CreateProductInput,
} from "@/validations/products";

function normalizeProductInsert<T extends { type: CreateProductInput["type"]; durationMonths?: number | null }>(
    data: T
): T & { durationMonths: number | null } {
    return {
        ...data,
        durationMonths:
            data.type === "plan_package" ? (data.durationMonths ?? null) : null,
    };
}

export async function getProductsAction() {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        const data = await getProducts(session.user.clinicId);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Erro ao carregar produtos" };
    }
}

export async function createProductAction(data: any) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    const validated = createProductSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dados inválidos", details: validated.error.flatten() };
    }

    try {
        const payload = normalizeProductInsert({
            ...validated.data,
            clinicId: session.user.clinicId,
        });
        const newProduct = await createProduct(payload);
        revalidatePath("/packages");
        return { success: true, data: newProduct };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Erro ao criar produto" };
    }
}

export async function updateProductAction(id: string, data: any) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    const productRow = await getProductByIdForClinic(id, session.user.clinicId);
    if (!productRow) {
        return { success: false, error: "Produto não encontrado" };
    }

    const validated = createProductSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dados inválidos", details: validated.error.flatten() };
    }

    try {
        const normalized = normalizeProductInsert(validated.data);
        const updated = await updateProduct(id, session.user.clinicId, {
            type: normalized.type,
            name: normalized.name,
            description: normalized.description ?? null,
            costPrice: normalized.costPrice,
            sellingPrice: normalized.sellingPrice,
            isActive: normalized.isActive,
            durationMonths: normalized.durationMonths,
        });
        revalidatePath("/packages");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Erro ao atualizar produto" };
    }
}

export async function deleteProductAction(id: string) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        await deleteProduct(id, session.user.clinicId);
        revalidatePath("/packages");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao excluir produto" };
    }
}

export async function toggleProductStatusAction(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        await toggleProductStatus(id, session.user.clinicId, isActive);
        revalidatePath("/packages");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao alterar status do produto" };
    }
}
