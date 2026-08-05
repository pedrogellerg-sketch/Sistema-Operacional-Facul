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
/**
 * 2 — unificação do estado do tópico. Até a v1 o progresso vivia em dois
 * lugares: `Topic.status` aqui e um mapa `topicStates` no banco curricular.
 * A migração funde os dois e renomeia os estados antigos.
 */
export const STORAGE_VERSION = 2

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
/**
 * Pede ao navegador que não descarte os dados do app.
 *
 * Sem isto, `localStorage` é "best-effort": sob pressão de espaço o navegador
 * pode limpar o site sem avisar. Num app cujo estado inteiro mora no aparelho —
 * meses de progresso, dúvidas e desempenho — isso é perda total e silenciosa.
 *
 * `persist()` promove o armazenamento a persistente. No Chrome do Android o
 * pedido costuma ser concedido sozinho quando o PWA está instalado; no iOS o
 * suporte varia. Por isso o retorno é informativo, não uma garantia: o lembrete
 * de backup continua sendo a rede de segurança de verdade.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

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
