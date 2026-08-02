import type { StateStorage } from 'zustand/middleware'

/**
 * Adaptador de storage.
 *
 * O store fala com esta interface, não com o `localStorage` direto. Para plugar
 * um backend depois, basta implementar `StorageAdapter` chamando a API (e a
 * assinatura já é async-friendly, que é o que o zustand espera).
 */
export interface StorageAdapter extends StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

export const STORAGE_KEY = 'sistema-fernando'
export const STORAGE_VERSION = 1

/**
 * localStorage com proteção contra os dois modos de falha reais no mobile:
 * modo privado do Safari (acesso lança) e cota estourada.
 */
export const localStorageAdapter: StorageAdapter = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch (err) {
      console.warn('[Sistema Fernando] Não foi possível salvar localmente.', err)
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* nada a fazer */
    }
  },
}

/** Baixa um snapshot do estado como arquivo JSON — backup manual e portátil. */
export function exportStateToFile(state: unknown, filename = 'sistema-fernando-backup.json') {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Lê um arquivo de backup. Rejeita se não for JSON válido. */
export function readStateFromFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error('Arquivo inválido: não é um backup do Sistema Fernando.'))
      }
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.readAsText(file)
  })
}
