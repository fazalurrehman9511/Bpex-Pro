import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [intent, setIntent] = useState('register')
  const [modalOptions, setModalOptions] = useState({})

  const openModal = useCallback((modalIntent = 'register', options = {}) => {
    setIntent(modalIntent)
    setModalOptions(options)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setModalOptions({})
  }, [])

  return (
    <ModalContext.Provider value={{ isOpen, intent, modalOptions, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}
