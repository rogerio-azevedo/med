"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
} from "@/db/queries/products";
import { createProductSchema, updateProductSchema } from "@/validations/products";

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
        const newProduct = await createProduct({
            ...validated.data,
            clinicId: session.user.clinicId,
        });
        revalidatePath("/cadastros/planos-pacotes");
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

    const validated = updateProductSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dados inválidos", details: validated.error.flatten() };
    }

    try {
        const updated = await updateProduct(id, validated.data);
        revalidatePath("/cadastros/planos-pacotes");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error: "Erro ao atualizar produto" };
    }
}

export async function deleteProductAction(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        await deleteProduct(id);
        revalidatePath("/cadastros/planos-pacotes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao excluir produto" };
    }
}

export async function toggleProductStatusAction(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Não autorizado" };
    }

    try {
        await toggleProductStatus(id, isActive);
        revalidatePath("/cadastros/planos-pacotes");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erro ao alterar status do produto" };
    }
}
