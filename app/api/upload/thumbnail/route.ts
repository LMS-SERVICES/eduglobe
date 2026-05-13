import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { s3Client, formatS3UploadError } from '@/lib/s3-helper'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || ''

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'S3 is not configured. Please set AWS environment variables.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image files (JPEG, PNG, WebP, GIF) are allowed.' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `thumbnails/${randomUUID()}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN

    let publicUrl: string
    if (cloudFrontDomain) {
      publicUrl = `https://${cloudFrontDomain}/${fileName}`
    } else {
      const presignedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
        { expiresIn: 7 * 24 * 60 * 60 }
      )
      publicUrl = presignedUrl
    }

    return NextResponse.json({
      url: publicUrl,
      s3Key: fileName,
      fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error: unknown) {
    console.error('Error uploading thumbnail:', error)
    return NextResponse.json({ error: formatS3UploadError(error) }, { status: 500 })
  }
}

