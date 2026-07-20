import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

interface UploadResult {
  id: string
  storage_path: string
  filename: string
  original_name: string
  status: string
}

interface UseDataUploadReturn {
  upload: (
    file: File,
    dashboardId?: string
  ) => Promise<UploadResult>
  progress: UploadProgress | null
  uploading: boolean
  error: string | null
  reset: () => void
}

export function useDataUpload(): UseDataUploadReturn {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setProgress(null)
    setUploading(false)
    setError(null)
  }, [])

  const upload = useCallback(
    async (file: File, dashboardId?: string): Promise<UploadResult> => {
      if (!user) throw new Error('Usuário não autenticado')

      setUploading(true)
      setError(null)
      setProgress({ loaded: 0, total: file.size, percent: 0 })

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`
        const filePath = `uploads/${fileName}`

        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (storageError) throw storageError

        setProgress({ loaded: file.size, total: file.size, percent: 100 })

        const { data: dbRecord, error: dbError } = await supabase
          .from('data_uploads')
          .insert({
            user_id: user.id,
            dashboard_id: dashboardId || null,
            filename: fileName,
            original_name: file.name,
            storage_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending',
          })
          .select()
          .single()

        if (dbError) throw dbError

        return dbRecord as UploadResult
      } catch (err: any) {
        const message = err.message || 'Erro ao fazer upload'
        setError(message)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [user]
  )

  return { upload, progress, uploading, error, reset }
}
