export async function uploadFileToApi(params: {
  endpoint: string
  file: File
}): Promise<{ url: string; s3Key?: string; fileName?: string }> {
  const fd = new FormData()
  fd.append('file', params.file)

  const res = await fetch(params.endpoint, { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Upload failed')
  }
  if (!data?.url) throw new Error('Upload did not return a URL')
  return data
}

