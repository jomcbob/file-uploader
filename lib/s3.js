import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION,
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,   
});

export async function getPresignedUrl(key, options) {
  const params = {
    Bucket: process.env.RAILWAY_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition:
      `${options.inline ? "inline" : "attachment"}; filename="${options.filename}"`,
  };

  // ONLY set content-type for previews
  if (options.inline && options.mimeType) {
    params.ResponseContentType = options.mimeType;
  }

  const command = new GetObjectCommand(params);

  return getSignedUrl(s3, command, {
    expiresIn: options.expiresIn || 3600,
  });
}


