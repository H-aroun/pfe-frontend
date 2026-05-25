'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/context/AuthContext'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface CollaborationUser {
  id: number | string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export interface ScenarioEditEvent {
  scenarioId: string
  entityType?: 'scenario' | 'course' | 'branching_scenario' | 'module' | 'sequence' | 'activity' | 'quiz'
  entityId?: number | string
  action?: 'create' | 'update' | 'delete' | 'reorder'
  patch?: Record<string, unknown>
  requestId?: string
  socketId?: string
  user?: CollaborationUser
  sentAt?: string
}

export interface ScenarioCursorEvent {
  scenarioId: string
  elementId?: string
  elementType?: string
  activityId?: number | string
  field?: string
  position?: {
    x?: number
    y?: number
    index?: number
  }
  selection?: {
    start: number
    end: number
  }
  socketId?: string
  user?: CollaborationUser
  sentAt?: string
}

export interface ScenarioLockInfo {
  scenarioId: string
  elementId: string
  elementType?: string
  socketId: string
  user: CollaborationUser
  lockedAt: string
}

interface JoinPayload {
  scenarioId: string
  collaborators?: CollaborationUser[]
  locks?: ScenarioLockInfo[]
}

interface PresencePayload {
  scenarioId: string
  action: 'join' | 'leave'
  socketId?: string
  user?: CollaborationUser
  collaborators?: CollaborationUser[]
  sentAt?: string
}

interface UnlockPayload {
  scenarioId: string
  elementId: string
  socketId?: string
  user?: CollaborationUser
  releasedAt?: string
}

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  joinScenario: (scenarioId: string) => void
  leaveScenario: (scenarioId: string) => void
  broadcastScenarioEdit: (payload: Omit<ScenarioEditEvent, 'sentAt'>) => void
  broadcastCursor: (payload: Omit<ScenarioCursorEvent, 'sentAt'>) => void
  lockElement: (payload: { scenarioId: string; elementId: string; elementType?: string }) => void
  unlockElement: (payload: { scenarioId: string; elementId: string; elementType?: string }) => void
}

export type {
  JoinPayload as ScenarioJoinedPayload,
  PresencePayload as ScenarioPresencePayload,
  UnlockPayload as ScenarioUnlockPayload,
}

const SocketContext = createContext<SocketContextValue | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const socket = useMemo(() => {
    if (!token) return null
    return io(`${SOCKET_URL}/scenario-collaboration`, {
      auth: { token },
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
  }, [token])

  const subscribeConnection = useCallback(
    (listener: () => void) => {
      if (!socket) return () => undefined
      socket.on('connect', listener)
      socket.on('disconnect', listener)
      return () => {
        socket.off('connect', listener)
        socket.off('disconnect', listener)
      }
    },
    [socket],
  )

  const getConnectionSnapshot = useCallback(() => socket?.connected ?? false, [socket])
  const isConnected = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    () => false,
  )

  useEffect(() => {
    if (!socket) return
    socket.connect()
    return () => {
      socket.disconnect()
    }
  }, [socket])

  const joinScenario = useCallback(
    (scenarioId: string) => {
      socket?.emit('scenario:join', { scenarioId })
    },
    [socket],
  )

  const leaveScenario = useCallback(
    (scenarioId: string) => {
      socket?.emit('scenario:leave', { scenarioId })
    },
    [socket],
  )

  const broadcastScenarioEdit = useCallback(
    (payload: Omit<ScenarioEditEvent, 'sentAt'>) => {
      socket?.emit('scenario:edit', payload)
    },
    [socket],
  )

  const broadcastCursor = useCallback(
    (payload: Omit<ScenarioCursorEvent, 'sentAt'>) => {
      socket?.emit('scenario:cursor', payload)
    },
    [socket],
  )

  const lockElement = useCallback(
    (payload: { scenarioId: string; elementId: string; elementType?: string }) => {
      socket?.emit('scenario:lock', payload)
    },
    [socket],
  )

  const unlockElement = useCallback(
    (payload: { scenarioId: string; elementId: string; elementType?: string }) => {
      socket?.emit('scenario:unlock', payload)
    },
    [socket],
  )

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      isConnected,
      joinScenario,
      leaveScenario,
      broadcastScenarioEdit,
      broadcastCursor,
      lockElement,
      unlockElement,
    }),
    [
      socket,
      isConnected,
      joinScenario,
      leaveScenario,
      broadcastScenarioEdit,
      broadcastCursor,
      lockElement,
      unlockElement,
    ],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
