'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  Upload, Search, Trash2, Image as ImageIcon, Film, FileText,
  Music, Link2, Tag, Eye,
} from 'lucide-react'
import { mediaApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { formatBytes, formatDate } from '@/lib/utils'
import type { MediaAsset, MediaType } from '@/types'

const typeFilters: { label: string; value: MediaType | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Images', value: 'IMAGE' },
  { label: 'Videos', value: 'VIDEO' },
  { label: 'Audio', value: 'AUDIO' },
  { label: 'Documents', value: 'DOCUMENT' },
]

const typeIcon: Record<string, React.ElementType> = {
  IMAGE: ImageIcon, VIDEO: Film, AUDIO: Music, DOCUMENT: FileText,
}

const typeColor: Record<string, string> = {
  IMAGE: 'text-[#83BFA1] bg-[#0F6B4A]/18',
  VIDEO: 'text-[#83BFA1] bg-[#0F6B4A]/18',
  AUDIO: 'text-green-400 bg-green-500/10',
  DOCUMENT: 'text-amber-400 bg-amber-500/10',
}

function PreviewModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={asset.originalName} size="lg">
      <div className="space-y-4">
        {asset.type === 'IMAGE' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`http://localhost:3001${asset.url}`} alt={asset.originalName} className="w-full rounded-lg object-contain max-h-80" />
        )}
        {asset.type === 'VIDEO' && (
          <video src={`http://localhost:3001${asset.url}`} controls className="w-full rounded-lg max-h-80" />
        )}
        {asset.type === 'AUDIO' && (
          <audio src={`http://localhost:3001${asset.url}`} controls className="w-full" />
        )}
        {asset.type === 'DOCUMENT' && (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <FileText size={40} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Size</span><p className="text-slate-200">{formatBytes(asset.size)}</p></div>
          <div><span className="text-slate-500">Uploaded</span><p className="text-slate-200">{formatDate(asset.createdAt)}</p></div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <Link2 size={13} className="text-slate-500 flex-shrink-0" />
          <code className="text-xs text-slate-300 truncate flex-1">{`http://localhost:3001${asset.url}`}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(`http://localhost:3001${asset.url}`); toast.success('URL copied!') }}
            className="text-xs text-[#83BFA1] hover:text-[#83BFA1] flex-shrink-0"
          >Copy</button>
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
  const [editTagsFor, setEditTagsFor] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const { data, isLoading } = useQuery<MediaAsset[]>({
    queryKey: ['media', typeFilter, search],
    queryFn: () => mediaApi.getAll({
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      search: search || undefined,
    }).then(r => r.data),
  })

  const { mutate: uploadFile, isPending: uploading } = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return mediaApi.upload(fd)
    },
    onSuccess: () => { toast.success('File uploaded!'); qc.invalidateQueries({ queryKey: ['media'] }) },
    onError: () => toast.error('Upload failed'),
  })

  const { mutate: deleteAsset } = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['media'] }) },
  })

  const { mutate: saveTags } = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => mediaApi.updateTags(id, tags),
    onSuccess: () => { toast.success('Tags saved'); qc.invalidateQueries({ queryKey: ['media'] }); setEditTagsFor(null) },
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadFile(f))
  }

  const assets = data ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Media Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
          <Upload size={14} className="mr-1" /> Upload
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${
          isDragging ? 'border-[#0F6B4A] bg-[#0F6B4A]/12' : 'border-white/10 hover:border-white/20 hover:bg-white/2'
        }`}
      >
        <Upload size={20} className={isDragging ? 'text-[#83BFA1]' : 'text-slate-500'} />
        <p className="text-sm text-slate-400">Drop files here or <span className="text-[#83BFA1]">browse</span></p>
        <p className="text-xs text-slate-600">Images, videos, audio, documents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input placeholder="Search files…" icon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} id="media-search" />
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
          {typeFilters.map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.value ? 'bg-[#0F6B4A] text-[#FFF8EC]' : 'text-slate-400 hover:text-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : assets.length === 0 ? (
        <EmptyState icon={<ImageIcon size={22} />} title="No media files" description="Upload images, videos, audio or documents" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {assets.map((asset: MediaAsset) => {
            const Icon = typeIcon[asset.type] ?? FileText
            const colorCls = typeColor[asset.type] ?? 'text-slate-400 bg-white/5'
            const isEditingTags = editTagsFor === asset.id

            return (
              <div key={asset.id} className="group bg-[#111318] border border-white/7 rounded-xl overflow-hidden hover:border-white/14 transition-all">
                {/* Thumbnail */}
                <div
                  className="aspect-video flex items-center justify-center bg-white/3 cursor-pointer relative overflow-hidden"
                  onClick={() => setPreview(asset)}
                >
                  {asset.type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`http://localhost:3001${asset.url}`} alt={asset.originalName} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorCls}`}>
                      <Icon size={18} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#081012]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye size={18} className="text-[#FFF8EC]" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-medium text-slate-200 truncate">{asset.originalName}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{formatBytes(asset.size)}</p>

                  {/* Tags */}
                  {isEditingTags ? (
                    <div className="mt-2 space-y-1.5">
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        placeholder="tag1, tag2…"
                        className="w-full text-[10px] bg-white/8 border border-white/15 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-[#0F6B4A]"
                      />
                      <div className="flex gap-1">
                        <button onClick={() => saveTags({ id: asset.id, tags: tagInput.split(',').map(t => t.trim()).filter(Boolean) })}
                          className="flex-1 text-[10px] bg-[#0F6B4A] text-[#FFF8EC] rounded px-1.5 py-0.5">Save</button>
                        <button onClick={() => setEditTagsFor(null)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 px-1">✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(asset.tags ?? []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] bg-white/6 text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditTagsFor(asset.id); setTagInput((asset.tags ?? []).join(', ')) }}
                      className="p-1 rounded text-slate-500 hover:text-[#83BFA1] hover:bg-white/6 transition-colors" title="Edit tags">
                      <Tag size={11} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this file?')) deleteAsset(asset.id) }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-colors" title="Delete">
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
