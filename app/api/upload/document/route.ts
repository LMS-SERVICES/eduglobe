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
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid file object' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'application/rtf',
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf']

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only document files (PDF, DOC, DOCX, TXT, etc.) are allowed.' },
        { status: 400 }
      )
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    const finalExtension = fileExtension || 'pdf'
    const fileName = `documents/${randomUUID()}.${finalExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    )

    const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN
    if (cloudFrontDomain) {
      return NextResponse.json({
        url: `https://${cloudFrontDomain}/${fileName}`,
        s3Key: fileName,
        fileName,
        size: file.size,
        type: file.type,
      })
    }

    const presignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
      { expiresIn: 7 * 24 * 60 * 60 }
    )

    return NextResponse.json({
      url: presignedUrl,
      s3Key: fileName,
      fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error: unknown) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: formatS3UploadError(error) }, { status: 500 })
  }
}

