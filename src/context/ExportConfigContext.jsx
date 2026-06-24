/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

/**
 * exportConfig — valores padrão
 *   style: 'print' | 'color'
 *   color: string (hex) — usado somente quando style === 'color'
 */
export const DEFAULT_EXPORT_CONFIG = {
  style: 'print',
  color: '#355C7D',
}

const LS_KEY = 'exportConfig'

function loadConfig() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULT_EXPORT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_EXPORT_CONFIG }
  } catch {
    return { ...DEFAULT_EXPORT_CONFIG }
  }
}

const ExportConfigContext = createContext(null)

export function ExportConfigProvider({ children }) {
  const [config, setConfigRaw] = useState(loadConfig)

  function setConfig(partial) {
    setConfigRaw(prev => {
      const next = { ...prev, ...partial }
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <ExportConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ExportConfigContext.Provider>
  )
}

export function useExportConfig() {
  const ctx = useContext(ExportConfigContext)
  if (!ctx) throw new Error('useExportConfig deve ser usado dentro de ExportConfigProvider')
  return ctx
}
