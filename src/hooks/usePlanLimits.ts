import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface LimitAlert {
  feature: string
  usage: number
  limit: number
  percent: number
  level: 'ok' | 'warning' | 'exceeded'
}

interface PlanUsage {
  feature: string
  label: string
  used: number
  limit: number
  percent: number
  remaining: number
}

const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboards',
  upload: 'Linhas processadas',
  chatbot: 'Chatbots',
  integration: 'Integrações',
  api_call: 'Chamadas de API',
}

interface UsePlanLimitsReturn {
  usage: PlanUsage[]
  alerts: LimitAlert[]
  loading: boolean
  allowed: (feature: string, quantity?: number) => Promise<boolean>
  refresh: () => void
}

export function usePlanLimits(): UsePlanLimitsReturn {
  const { user, plan } = useAuth()
  const [usage, setUsage] = useState<PlanUsage[]>([])
  const [alerts, setAlerts] = useState<LimitAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user || !plan) {
      setUsage([])
      setAlerts([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)

      const features = [
        'dashboard',
        'upload',
        'chatbot',
        'integration',
        'api_call',
      ] as const

      const limitMap: Record<string, number> = {
        dashboard: plan.limits_dashboards,
        upload: plan.limits_rows,
        chatbot: plan.limits_chatbots,
        integration: plan.limits_marketplaces,
        api_call: plan.limits_api_calls,
      }

      const period = new Date().toISOString().slice(0, 7)

      const { data: logs } = await supabase
        .from('usage_logs')
        .select('feature, quantity')
        .eq('user_id', user.id)
        .gte('period', `${period}-01`)
        .lte('period', `${period}-31`)

      const aggregated: Record<string, number> = {}
      if (logs) {
        for (const row of logs) {
          aggregated[row.feature] =
            (aggregated[row.feature] || 0) + (row.quantity || 1)
        }
      }

      if (cancelled) return

      const usageList: PlanUsage[] = []
      const alertList: LimitAlert[] = []

      for (const feature of features) {
        const used = aggregated[feature] || 0
        const limit = limitMap[feature]
        const isUnlimited = limit >= 999999
        const percent = isUnlimited
          ? 0
          : limit > 0
          ? Math.round((used / limit) * 100)
          : 0
        const remaining = isUnlimited ? 999999 : Math.max(0, limit - used)

        usageList.push({
          feature,
          label: FEATURE_LABELS[feature],
          used,
          limit: isUnlimited ? -1 : limit,
          percent: isUnlimited ? 0 : percent,
          remaining,
        })

        if (!isUnlimited) {
          let level: LimitAlert['level'] = 'ok'
          if (percent >= 100) level = 'exceeded'
          else if (percent >= 80) level = 'warning'

          if (level !== 'ok') {
            alertList.push({ feature, usage: used, limit, percent, level })
          }
        }
      }

      setUsage(usageList)
      setAlerts(alertList)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user, plan, refreshKey])

  const allowed = async (
    feature: string,
    quantity: number = 1
  ): Promise<boolean> => {
    if (!user) return false

    const { data } = await supabase.rpc('check_plan_limit', {
      p_user_id: user.id,
      p_feature: feature,
      p_quantity: quantity,
    })

    return data === true
  }

  const refresh = () => setRefreshKey((k) => k + 1)

  return { usage, alerts, loading, allowed, refresh }
}
