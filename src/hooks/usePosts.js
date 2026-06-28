import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export function usePosts(filters = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filterKey = JSON.stringify(filters)

  useEffect(() => {
    let alive = true
    const activeFilters = JSON.parse(filterKey)
    setLoading(true)
    api
      .listPosts(activeFilters)
      .then((data) => {
        if (alive) setPosts(data || [])
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [filterKey])

  return { posts, loading, error }
}
