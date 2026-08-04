/**
 * Extração de texto de PDF no próprio navegador.
 *
 * Usa pdfjs, a mesma biblioteca que o Firefox embute. Roda 100% no cliente —
 * o arquivo nunca sai do aparelho, o que mantém a promessa de privacidade do
 * app e dispensa servidor.
 *
 * O reagrupamento por coordenada Y é essencial: os planos da escola usam
 * tabelas de duas colunas, e o texto sai fora de ordem sem isso.
 */

/** Carregado sob demanda: pdfjs pesa e só é usado na tela de importação. */
async function getPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await getPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise

  let out = ''
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()

    // Agrupa por linha (coordenada Y) e ordena por X dentro da linha.
    const lines = new Map<number, Array<{ x: number; s: string }>>()
    for (const item of content.items) {
      const it = item as { str?: string; transform?: number[] }
      if (!it.str || !it.transform) continue
      const y = Math.round(it.transform[5])
      if (!lines.has(y)) lines.set(y, [])
      lines.get(y)!.push({ x: it.transform[4], s: it.str })
    }

    const ordered = [...lines.entries()].sort((a, b) => b[0] - a[0])
    for (const [, parts] of ordered) {
      const line = parts
        .sort((a, b) => a.x - b.x)
        .map((x) => x.s)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) out += line + '\n'
    }
  }

  if (out.trim().length < 50) {
    throw new Error(
      'O PDF não tem texto selecionável (provavelmente é digitalizado). Lance as aulas manualmente.',
    )
  }

  return out
}
