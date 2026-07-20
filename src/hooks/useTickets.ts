import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Ticket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  response: string | null
  responded_at: string | null
  created_at: string
  resolved_at: string | null
}

interface TicketInput {
  subject: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

interface UseTicketsReturn {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  list: () => Promise<void>
  create: (input: TicketInput) => Promise<Ticket>
  refetch: () => Promise<void>
}

export function useTickets(): UseTicketsReturn {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async () => {
    if (!user) {
      setTickets([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setTickets((data as Ticket[]) || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar chamados')
    } finally {
      setLoading(false)
    }
  }, [user])

  const create = useCallback(
    async (input: TicketInput): Promise<Ticket> => {
      if (!user) throw new Error('Usuário não autenticado')

      setError(null)

      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          subject: input.subject,
          message: input.message,
          priority: input.priority || 'normal',
          status: 'open',
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newTicket = data as Ticket
      setTickets((prev) => [newTicket, ...prev])
      return newTicket
    },
    [user]
  )

  const refetch = useCallback(async () => {
    await list()
  }, [list])

  return { tickets, loading, error, list, create, refetch }
}
