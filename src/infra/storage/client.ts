import { S3Client } from "@aws-sdk/client-s3";

let cached: S3Client | null = null;

export function getR2Bucket(): string {
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    if (!bucket) {
        throw new Error("CLOUDFLARE_R2_BUCKET is not set");
    }
    return bucket;
}

export function getR2Client(): S3Client {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error("R2 credentials are not configured (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY)");
    }
    if (!cached) {
        cached = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
            // Evita query params de CRC32 na URL assinada; uploads pelo browser só precisam de host + Content-Type.
            requestChecksumCalculation: "WHEN_REQUIRED",
        });
    }
    return cached;
}
