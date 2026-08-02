/**
 * Gera os ícones PNG do PWA sem depender de binário de imagem.
 *
 * Rasteriza a marca (quadrado escuro arredondado + "F" em lime) em um buffer
 * RGBA e codifica o PNG à mão: IHDR + IDAT (deflate via zlib) + IEND.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = [0x08, 0x09, 0x0b, 0xff]
const FG = [0xd4, 0xff, 0x3f, 0xff]

// ── Codificação PNG ──────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // profundidade de bits
  ihdr[9] = 6 // RGBA
  // 10–12 ficam em 0: compressão, filtro e entrelaçamento padrão.

  // Cada scanline é precedida pelo byte de filtro (0 = None).
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Desenho ──────────────────────────────────────────────────

function createCanvas(size, fill) {
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) buf.set(fill, i * 4)
  return buf
}

function setPixel(buf, size, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  if (alpha >= 1) {
    buf.set(color, i)
    return
  }
  // Mistura com o que já está no buffer — usado só nas bordas suavizadas.
  for (let c = 0; c < 3; c++) {
    buf[i + c] = Math.round(buf[i + c] * (1 - alpha) + color[c] * alpha)
  }
  buf[i + 3] = 0xff
}

/** Retângulo preenchido, coordenadas em fração do tamanho. */
function fillRect(buf, size, x0, y0, w, h, color) {
  const px = Math.round(x0 * size)
  const py = Math.round(y0 * size)
  const pw = Math.round(w * size)
  const ph = Math.round(h * size)
  for (let y = py; y < py + ph; y++) {
    for (let x = px; x < px + pw; x++) setPixel(buf, size, x, y, color)
  }
}

/**
 * Aplica cantos arredondados tornando transparente o que estiver fora do
 * raio. Suaviza a borda com uma amostra de cobertura simples.
 */
function roundCorners(buf, size, radiusRatio) {
  const r = radiusRatio * size

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Distância até o centro do canto mais próximo.
      const cx = x < r ? r : x > size - r ? size - r : x
      const cy = y < r ? r : y > size - r ? size - r : y
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)

      if (dist <= r - 0.5) continue

      const i = (y * size + x) * 4
      if (dist >= r + 0.5) {
        buf[i + 3] = 0
      } else {
        buf[i + 3] = Math.round(255 * (r + 0.5 - dist))
      }
    }
  }
}

/** "F" em bloco, desenhado com três retângulos. Escala e centro configuráveis. */
function drawF(buf, size, { scale = 1 } = {}) {
  const s = scale
  const cx = 0.5
  const cy = 0.5

  // Geometria da letra em fração do canvas, antes da escala.
  const width = 0.34
  const height = 0.46
  const stem = 0.105

  const x0 = cx - (width / 2) * s
  const y0 = cy - (height / 2) * s

  // Haste vertical
  fillRect(buf, size, x0, y0, stem * s, height * s, FG)
  // Braço superior
  fillRect(buf, size, x0, y0, width * s, stem * s, FG)
  // Braço do meio
  fillRect(buf, size, x0, y0 + (height / 2 - stem / 2) * s, width * 0.78 * s, stem * s, FG)
}

function buildIcon(size, { maskable = false } = {}) {
  const buf = createCanvas(size, BG)

  if (maskable) {
    // Zona segura do maskable: a marca ocupa ~62% para sobreviver ao recorte.
    drawF(buf, size, { scale: 0.78 })
  } else {
    drawF(buf, size, { scale: 1 })
    roundCorners(buf, size, 0.22)
  }

  return encodePng(size, size, buf)
}

// ── Saída ────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-512-maskable.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
]

for (const [name, size, opts] of targets) {
  const out = name === 'apple-touch-icon.png' ? resolve(OUT_DIR, '..', name) : resolve(OUT_DIR, name)
  writeFileSync(out, buildIcon(size, opts))
  console.log(`✓ ${name} (${size}×${size})`)
}
