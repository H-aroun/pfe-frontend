'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Music,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { getApiErrorMessage, mediaApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatBytes, formatDate } from '@/lib/utils'
import type { MediaAsset, MediaType } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const typeFilters: { label: string; value: MediaType | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Images', value: 'IMAGE' },
  { label: 'Videos', value: 'VIDEO' },
  { label: 'Audio', value: 'AUDIO' },
  { label: 'Documents', value: 'DOCUMENT' },
]

const typeIcon: Record<MediaType, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: Film,
  AUDIO: Music,
  DOCUMENT: FileText,
}

const typeColor: Record<MediaType, string> = {
  IMAGE: 'text-[#83BFA1] bg-[#0F6B4A]/18',
  VIDEO: 'text-[#83BFA1] bg-[#0F6B4A]/18',
  AUDIO: 'text-green-400 bg-green-500/10',
  DOCUMENT: 'text-amber-400 bg-amber-500/10',
}

function assetUrl(asset: MediaAsset): string {
  return asset.url.startsWith('http') ? asset.url : `${API_URL}${asset.url}`
}

function PreviewModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const url = assetUrl(asset)

  return (
    <Modal open onClose={onClose} title={asset.originalName} size="lg">
      <div className="space-y-4">
        {asset.type === 'IMAGE' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={asset.originalName} className="max-h-80 w-full rounded-lg object-contain" />
        )}
        {asset.type === 'VIDEO' && (
          <video src={url} controls className="max-h-80 w-full rounded-lg" />
        )}
        {asset.type === 'AUDIO' && <audio src={url} controls className="w-full" />}
        {asset.type === 'DOCUMENT' && (
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/4 py-10 text-slate-500">
            <FileText size={40} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Size</span>
            <p className="text-slate-200">{formatBytes(asset.size)}</p>
          </div>
          <div>
            <span className="text-slate-500">Uploaded</span>
            <p className="text-slate-200">{formatDate(asset.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Link2 size={13} className="flex-shrink-0 text-slate-500" />
          <code className="min-w-0 flex-1 truncate text-xs text-slate-300">{url}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url)
              toast.success('URL copied')
            }}
            className="flex-shrink-0 text-xs text-[#83BFA1] hover:text-[#9bd7b7]"
          >
            Copy
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function MediaPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [typeFilter, setTypeFilter] = useState<MediaType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<MediaAsset | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { data, isLoading } = useQuery<MediaAsset[]>({
    queryKey: ['media', typeFilter, search],
    queryFn: () =>
      mediaApi
        .getAll({
          type: typeFilter === 'ALL' ? undefined : typeFilter,
          search: search || undefined,
        })
        .then((response) => response.data),
  })

  const { mutate: uploadFile, isPending: uploading } = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
    onSuccess: () => {
      toast.success('File uploaded')
      qc.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Upload failed')),
  })

  const { mutate: deleteAsset } = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['media'] })
    },
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => uploadFile(file))
  }

  const assets = data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Media Library</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
          <Upload size={14} className="mr-1" /> Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.currentTarget.value = ''
          }}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-8 transition-all ${
          isDragging ? 'border-[#0F6B4A] bg-[#0F6B4A]/12' : 'border-white/10 hover:border-white/20 hover:bg-white/2'
        }`}
      >
        <Upload size={20} className={isDragging ? 'text-[#83BFA1]' : 'text-slate-500'} />
        <p className="text-sm text-slate-400">
          Drop files here or <span className="text-[#83BFA1]">browse</span>
        </p>
        <p className="text-xs text-slate-600">Images, videos, audio, documents</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="max-w-xs flex-1">
          <Input
            id="media-search"
            placeholder="Search files..."
            icon={<Search size={14} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/5 p-1">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === filter.value
                  ? 'bg-[#0F6B4A] text-[#FFF8EC]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState icon={<ImageIcon size={22} />} title="No media files" description="Upload images, videos, audio or documents" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => {
            const Icon = typeIcon[asset.type] ?? FileText
            const colorCls = typeColor[asset.type] ?? 'bg-white/5 text-slate-400'

            return (
              <div
                key={asset.id}
                className="group overflow-hidden rounded-xl border border-white/7 bg-[#111318] transition-all hover:border-white/14"
              >
                <button
                  type="button"
                  className="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden bg-white/3"
                  onClick={() => setPreview(asset)}
                >
                  {asset.type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assetUrl(asset)} alt={asset.originalName} className="h-full w-full object-cover" />
                  ) : asset.type === 'VIDEO' ? (
                    <video src={assetUrl(asset)} className="h-full w-full object-cover" muted />
                  ) : (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorCls}`}>
                      <Icon size={18} />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-[#081012]/55 opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye size={18} className="text-[#FFF8EC]" />
                  </span>
                </button>

                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-slate-200">{asset.originalName}</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">{formatBytes(asset.size)}</p>
                  <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this file?')) deleteAsset(asset.id)
                      }}
                      className="rounded p-1 text-slate-500 transition-colors hover:bg-red-500/8 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {preview && <PreviewModal asset={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
