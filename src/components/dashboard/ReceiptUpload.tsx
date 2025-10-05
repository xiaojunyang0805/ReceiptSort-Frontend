'use client'

import { useState, useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

interface UploadFile {
  file: File
  id: string
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
}

export default function ReceiptUpload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large (max 10MB)`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} has invalid file type`)
        } else {
          toast.error(`${file.name}: ${error.message}`)
        }
      })
    })

    // Add accepted files to upload queue
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
    }))

    setUploadFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setUploadFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading', progress: 10 } : f))
      )

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Update progress
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: 60 } : f))
      )

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('receipts').getPublicUrl(filePath)

      // Create database record
      const { error: dbError } = await supabase.from('receipts').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'pending',
      })

      if (dbError) throw dbError

      // Success
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'success', progress: 100 } : f))
      )

      toast.success(`${file.name} uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
                progress: 0,
              }
            : f
        )
      )
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)

    // Upload files sequentially
    for (const file of uploadFiles) {
      if (file.status === 'pending') {
        await uploadFile(file)
      }
    }

    setIsUploading(false)
  }

  const clearCompleted = () => {
    setUploadFiles((prev) => {
      prev.forEach((f) => {
        if (f.preview && f.status === 'success') {
          URL.revokeObjectURL(f.preview)
        }
      })
      return prev.filter((f) => f.status !== 'success')
    })
  }

  const pendingCount = uploadFiles.filter((f) => f.status === 'pending').length
  const hasFiles = uploadFiles.length > 0
  const hasCompleted = uploadFiles.some((f) => f.status === 'success')

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          isUploading && 'cursor-not-allowed opacity-50',
          !isDragActive && !isUploading && 'hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'rounded-full p-4 bg-muted',
              isDragActive && 'bg-primary/10'
            )}
          >
            <Upload className={cn('h-8 w-8', isDragActive && 'text-primary')} />
          </div>

          <div>
            <p className="text-lg font-semibold">
              {isDragActive ? 'Drop files here' : 'Drop receipt files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Supported formats: PNG, JPG, JPEG, WEBP, PDF</p>
            <p>Maximum file size: 10MB per file</p>
          </div>
        </div>
      </Card>

      {/* Upload Queue */}
      {hasFiles && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upload Queue ({uploadFiles.length})</h3>
            <div className="flex gap-2">
              {hasCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  Clear Completed
                </Button>
              )}
              {pendingCount > 0 && (
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                {/* Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                      <Image
                        src={uploadFile.preview}
                        alt={uploadFile.file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-sm text-destructive mt-1">{uploadFile.error}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
