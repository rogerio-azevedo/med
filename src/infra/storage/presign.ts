import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Bucket, getR2Client } from "./client";

const PUT_EXPIRES_SEC = 60 * 15;
const GET_EXPIRES_SEC = 60 * 60;

export async function createPresignedPutUrl(key: string, contentType: string): Promise<string> {
    const client = getR2Client();
    const bucket = getR2Bucket();
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: PUT_EXPIRES_SEC });
}

export async function createPresignedGetUrl(key: string): Promise<string> {
    const client = getR2Client();
    const bucket = getR2Bucket();
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: GET_EXPIRES_SEC });
}

export async function headObject(key: string) {
    const client = getR2Client();
    const bucket = getR2Bucket();
    return client.send(
        new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}

export async function deleteObjectFromR2(key: string): Promise<void> {
    const client = getR2Client();
    const bucket = getR2Bucket();
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}
