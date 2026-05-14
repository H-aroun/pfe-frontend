'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Save, Video, FileText, Link2, File, HelpCircle } from 'lucide-react'
import { scenariosApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { Activity, ActivityType } from '@/types'

interface Props {
  scenarioId: string
  moduleId: string
  sequenceId: string
  activity: Activity
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; label: string; color: string }> = {
  VIDEO:  { icon: Video,      label: 'Video',    color: 'text-[#83BFA1]' },
  TEXT:   { icon: FileText,   label: 'Text',     color: 'text-[#83BFA1]'    },
  QUIZ:   { icon: HelpCircle, label: 'Quiz',     color: 'text-amber-400'  },
  FILE:   { icon: File,       label: 'File',     color: 'text-green-400'  },
  LINK:   { icon: Link2,      label: 'Link',     color: 'text-rose-400'   },
}

export function ActivityEditor({ scenarioId, moduleId, sequenceId, activity }: Props) {
  const qc = useQueryClient()
  const [title, setTitle]     = useState(activity.title)
  const [content, setContent] = useState(activity.content ?? '')
  const [type, setType]       = useState<ActivityType>(activity.type)
  const [points, setPoints]   = useState(String(activity.points ?? ''))
  const [duration, setDuration] = useState(String(activity.duration ?? ''))

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      scenariosApi.updateActivity(scenarioId, moduleId, sequenceId, activity.id, {
        title,
        type,
        content,
        points: points ? Number(points) : undefined,
        duration: duration ? Number(duration) : undefined,
      }),
    onSuccess: () => {
      toast.success('Activity saved')
      qc.invalidateQueries({ queryKey: ['scenario', scenarioId] })
    },
    onError: () => toast.error('Failed to save activity'),
  })

  const TypeIcon = typeConfig[type]?.icon ?? FileText

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Type selector */}
      <div className="flex gap-1 p-3 border-b border-white/7">
        {(Object.entries(typeConfig) as [ActivityType, typeof typeConfig[ActivityType]][]).map(([t, cfg]) => {
          const Icon = cfg.icon
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                type === t
                  ? 'border-[#0F6B4A]/50 bg-[#0F6B4A]/18 text-[#83BFA1]'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
            >
              <Icon size={11} className={type === t ? cfg.color : ''} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Form */}
      <div className="flex-1 p-4 space-y-4">
        <Input
          id="act-title"
          label="Activity title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          icon={<TypeIcon size={13} className={typeConfig[type]?.color} />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="act-points"
            label="Points"
            type="number"
            min={0}
            placeholder="0"
            value={points}
            onChange={e => setPoints(e.target.value)}
          />
          <Input
            id="act-duration"
            label="Duration (min)"
            type="number"
            min={1}
            placeholder="—"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        </div>

        {/* Content area varies by type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">
            {type === 'VIDEO' ? 'Video URL' : type === 'LINK' ? 'URL' : 'Content'}
          </label>
          {type === 'TEXT' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              placeholder="Write your content here…"
              className="w-full bg-white/5 border border-white/10 rounded-xl text-slate-100 text-sm px-4 py-3 resize-none placeholder:text-slate-600 focus:outline-none focus:border-[#0F6B4A] focus:ring-2 focus:ring-[#0F6B4A]/25 transition-all"
            />
          ) : type === 'QUIZ' ? (
            <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-center text-sm text-slate-500">
              Configure quiz questions in the <span className="text-amber-400 font-medium">Quiz</span> tab above.
            </div>
          ) : (
            <Input
              id="act-content"
              placeholder={type === 'VIDEO' ? 'https://youtube.com/watch?v=...' : type === 'LINK' ? 'https://...' : 'File URL or path'}
              value={content}
              onChange={e => setContent(e.target.value)}
              icon={type === 'VIDEO' ? <Video size={13} /> : type === 'LINK' ? <Link2 size={13} /> : <File size={13} />}
            />
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="border-t border-white/7 p-3 flex justify-end bg-[#0d0f17]">
        <Button size="sm" onClick={() => save()} loading={isPending}>
          <Save size={13} className="mr-1" /> Save activity
        </Button>
      </div>
    </div>
  )
}
