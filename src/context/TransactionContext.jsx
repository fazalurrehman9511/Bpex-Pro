import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { applyExpiry } from '../utils/transactions'
import {
  createTransaction as apiCreateTransaction,
  fetchUserTransactions,
} from '../utils/api'
import {
  getBpexchUsername,
  subscribeBpexchUsername,
} from '../utils/bpexchAuth'

const TransactionContext = createContext(null)

export function TransactionProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState('deposit')
  const [options, setOptions] = useState({})
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(() => getBpexchUsername())

  const refreshTransactions = useCallback(async () => {
    const activeUsername = String(getBpexchUsername() || '').trim()
    if (!activeUsername) {
      setTransactions([])
      return
    }

    try {
      const list = await fetchUserTransactions({ username: activeUsername })
      setTransactions(applyExpiry(list))
    } catch (err) {
      console.error('Failed to load transactions:', err.message)
    }
  }, [])

  useEffect(() => {
    refreshTransactions()
    const tick = setInterval(refreshTransactions, 5000)
    return () => clearInterval(tick)
  }, [refreshTransactions])

  useEffect(() => {
    return subscribeBpexchUsername((nextUsername) => {
      setUsername(String(nextUsername || '').trim())
    })
  }, [])

  useEffect(() => {
    refreshTransactions()
  }, [username, refreshTransactions])

  const openTransaction = useCallback((txType = 'deposit', opts = {}) => {
    setType(txType)
    setOptions(opts)
    setIsOpen(true)
    refreshTransactions()
  }, [refreshTransactions])

  const closeTransaction = useCallback(() => {
    setIsOpen(false)
    setOptions({})
  }, [])

  const submitTransaction = useCallback(async (data) => {
    const txType = data.type || type
    setLoading(true)
    try {
      const tx = await apiCreateTransaction({ ...data, type: txType })
      setTransactions((prev) => {
        const rest = prev.filter((item) => item.id !== tx.id)
        return applyExpiry([tx, ...rest])
      })
      return tx
    } finally {
      setLoading(false)
    }
  }, [type])

  return (
    <TransactionContext.Provider
      value={{
        isOpen,
        type,
        options,
        transactions,
        loading,
        openTransaction,
        closeTransaction,
        submitTransaction,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransaction() {
  const ctx = useContext(TransactionContext)
  if (!ctx) {
    throw new Error('useTransaction must be used within TransactionProvider')
  }
  return ctx
}
