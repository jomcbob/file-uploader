import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION,
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,   
});
