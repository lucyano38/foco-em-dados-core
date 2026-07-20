import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Addon {
  id: string
  slug: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  category: string | null
  features: string[]
  is_active: boolean
}

interface UserAddon {
  id: string
  user_id: string
  addon_id: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  addon: Addon
}

interface UseAddonsReturn {
  available: Addon[]
  active: UserAddon[]
  loading: boolean
  error: string | null
  subscribe: (addonId: string) => Promise<void>
  cancel: (userAddonId: string) => Promise<void>
  refresh: () => void
}

export function useAddons(): UseAddonsReturn {
  const { user } = useAuth()
  const [available, setAvailable] = useState<Addon[]>([])
  const [active, setActive] = useState<UserAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [availableRes, activeRes] = await Promise.all([
          supabase
            .from('addons')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          user
            ? supabase
                .from('user_addons')
                .select('*, addon:addon_id(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: null, error: null }),
        ])

        if (cancelled) return

        if (availableRes.error) throw availableRes.error
        if (activeRes.error) throw activeRes.error

        setAvailable((availableRes.data as Addon[]) || [])
        setActive((activeRes.data as UserAddon[]) || [])
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Erro ao carregar add-ons')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user, refreshKey])

  const subscribe = async (addonId: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    const exists = active.some((ua) => ua.addon_id === addonId)
    if (exists) throw new Error('Add-on já está ativo')

    const { error: insertError } = await supabase
      .from('user_addons')
      .insert({ user_id: user.id, addon_id: addonId, status: 'active' })

    if (insertError) throw insertError

    setRefreshKey((k) => k + 1)
  }

  const cancel = async (userAddonId: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    const { error: updateError } = await supabase
      .from('user_addons')
      .update({ status: 'canceled', cancel_at_period_end: true })
      .eq('id', userAddonId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    setRefreshKey((k) => k + 1)
  }

  const refresh = () => setRefreshKey((k) => k + 1)

  return { available, active, loading, error, subscribe, cancel, refresh }
}
