import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || ''

/** Must match the bucket’s actual AWS region (see S3 → bucket → Properties). */
export function getConfiguredS3Region(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
}

const REGION = getConfiguredS3Region()

export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  /** Retry on 301 when bucket region ≠ configured region (avoids PermanentRedirect failures). */
  followRegionRedirects: true,
})

export function getCleanUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const urlObj = new URL(url)
    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    return url
  }
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // bucket.s3.region.amazonaws.com/<key> or s3.region.amazonaws.com/bucket/<key>
    const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname
    if (!path) return null

    // If URL style contains bucket in path (s3.<region>.amazonaws.com/<bucket>/<key>)
    if (BUCKET_NAME && path.startsWith(`${BUCKET_NAME}/`)) {
      return path.slice(BUCKET_NAME.length + 1)
    }
    return path
  } catch {
    return null
  }
}

export async function presignGetObjectUrl(params: {
  key: string
  expiresInSeconds: number
}): Promise<string> {
  if (!BUCKET_NAME) throw new Error('AWS_S3_BUCKET_NAME is not configured')
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: params.key })
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds })
}

/** User-facing message for common S3 failures (e.g. wrong AWS_REGION). */
export function formatS3UploadError(error: unknown): string {
  const errObj = error && typeof error === 'object' ? (error as Record<string, unknown>) : null
  const code =
    errObj && typeof errObj.Code === 'string'
      ? errObj.Code
      : errObj && typeof errObj.name === 'string'
        ? errObj.name
        : ''
  if (code === 'IllegalLocationConstraintException') {
    return (
      `S3 region does not match your bucket. Set AWS_REGION in .env to the bucket’s region ` +
      `(e.g. ap-south-1 for Mumbai). The app is using "${getConfiguredS3Region()}". ` +
      `In AWS: S3 → your bucket → Properties → AWS Region.`
    )
  }
  if (code === 'PermanentRedirect') {
    return (
      `S3 returned a region/endpoint redirect. Set AWS_REGION in .env to exactly match your bucket ` +
      `(S3 → bucket → Properties → AWS Region). Current value: "${getConfiguredS3Region()}". ` +
      `For buckets in us-east-1 (N. Virginia), use AWS_REGION=us-east-1.`
    )
  }
  if (error instanceof Error && error.message) return error.message
  return 'Upload failed'
}

