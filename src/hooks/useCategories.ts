import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async () => {
    if (!user) {
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: nextError } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (nextError) {
      setError(nextError.message)
      setCategories([])
    } else {
      setError(null)
      setCategories(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadCategories()
  }, [user?.id])

  return { categories, loading, error, reload: loadCategories }
}

