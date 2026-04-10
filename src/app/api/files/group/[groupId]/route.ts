import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patientFiles } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { createPresignedGetUrl } from "@/infra/storage/presign";

export const runtime = "nodejs";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const files = await db.query.patientFiles.findMany({
        where: and(
            eq(patientFiles.uploadGroupId, groupId),
            eq(patientFiles.clinicId, session.user.clinicId)
        ),
        orderBy: [asc(patientFiles.groupOrder), asc(patientFiles.createdAt)],
        with: {
            uploader: { columns: { name: true } },
        },
    });

    if (files.length === 0) {
        return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // Gera URLs presignadas para visualização (GET, 60 min)
    const filesWithUrls = await Promise.all(
        files.map(async (f) => {
            let viewUrl: string | null = null;
            try {
                viewUrl = await createPresignedGetUrl(f.remoteKey);
            } catch {
                // URL pode falhar; o cliente trata graciosamente
            }
            return {
                id: f.id,
                title: f.title,
                fileName: f.fileName,
                mimeType: f.mimeType,
                groupOrder: f.groupOrder ?? 0,
                viewUrl,
                uploader: f.uploader ? { name: f.uploader.name } : null,
            };
        })
    );


    return NextResponse.json({ files: filesWithUrls });
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const session = await auth();
    if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // 1. Busca todos para obter as remote_keys
    const files = await db.query.patientFiles.findMany({
        where: and(
            eq(patientFiles.uploadGroupId, groupId),
            eq(patientFiles.clinicId, session.user.clinicId)
        ),
    });

    if (files.length === 0) {
        return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    // 2. Remove do banco de dados (o Drizzle/SQL lida bem com multidelete via condition)
    await db
        .delete(patientFiles)
        .where(
            and(
                eq(patientFiles.uploadGroupId, groupId),
                eq(patientFiles.clinicId, session.user.clinicId)
            )
        );

    // 3. Remove os arquivos e thumbnails do S3/R2 em paralelo
    const { deleteObjectFromR2 } = await import("@/infra/storage/presign");

    await Promise.allSettled(
        files.map(async (f) => {
            try {
                await deleteObjectFromR2(f.remoteKey);
            } catch (e) {
                console.error(`Erro ao apagar arquivo ${f.id} via DELETE group:`, e);
            }
        })
    );

    return NextResponse.json({ success: true, count: files.length });
}
