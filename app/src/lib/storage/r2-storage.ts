import {PutObjectCommand, S3Client, HeadObjectCommand} from "@aws-sdk/client-s3";
import type {PutObjectCommandInput} from "@aws-sdk/client-s3";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";

const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID?.trim();
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim();
const ENDPOINT = process.env.R2_ENDPOINT?.trim();
const BUCKET = process.env.R2_BUCKET_NAME?.trim();

if (!ACCESS_KEY || !SECRET_KEY || !ENDPOINT || !BUCKET) {
  throw new Error("Missing R2 environment variables");
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

export async function uploadToR2(input: {
  key: string;
  body: NonNullable<PutObjectCommandInput["Body"]>;
  contentType: string;
  cacheControl?: string;
}) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
  );
}

export {buildR2PublicUrl};

export async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (err) {
    const error = err as {name?: string; $metadata?: {httpStatusCode?: number}};

    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }

    throw err;
  }
}
