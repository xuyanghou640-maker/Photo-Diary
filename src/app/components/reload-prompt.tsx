import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // eslint-disable-next-line no-console
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (offlineReady) {
      toast.success('App is ready to work offline')
    }
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span>New content available, click on reload button to update.</span>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        </div>
      ), { duration: Infinity })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}