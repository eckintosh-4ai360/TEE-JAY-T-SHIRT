'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  orderId: string
}

export default function DeleteButton({ orderId }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      router.push('/orders')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-danger btn-sm"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="btn-secondary btn-sm"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-danger btn-sm">
      Delete order
    </button>
  )
}
