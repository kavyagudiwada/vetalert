import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaletteMode } from '@mui/material'
import { setLanguage } from '../i18n'

interface AppNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: number
  read: boolean
}

interface AppState {
  sidebarOpen: boolean
  language: string
  theme: PaletteMode
  notifications: AppNotification[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setLanguage: (lang: string) => void
  toggleTheme: () => void
  setTheme: (theme: PaletteMode) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      language: 'en',
      theme: 'light',
      notifications: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLanguage: (lang) => {
        setLanguage(lang)
        set({ language: lang })
      },
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setTheme: (theme) => set({ theme }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'vetalert-app',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        language: state.language,
        theme: state.theme,
        notifications: state.notifications,
      }),
    },
  ),
)
