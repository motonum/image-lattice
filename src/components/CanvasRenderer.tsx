import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { CellItem } from '../App'

export type CanvasHandle = {
  exportPNG: () => Promise<Blob>
}

type Props = {
  rows: number
  cols: number
  cells: CellItem[]
  gap: number
  fontSize: number
  preview?: boolean
}

const CanvasRenderer = forwardRef<CanvasHandle | null, Props>(({ rows, cols, cells, gap, fontSize, preview = false }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!canvasRef.current) return new Blob()
      // ensure latest render completed
      await renderAll()
      return await new Promise<Blob>((resolve) => canvasRef.current!.toBlob((b) => resolve(b || new Blob()), 'image/png'))
    }
  }))

  // Draw when props change
  useEffect(() => {
    renderAll()
  }, [rows, cols, cells, gap, fontSize])

  const renderAll = async () => {
    const canvas = canvasRef.current!
    if (!canvas) return

    // Load all images first so we can measure natural sizes reliably
    const images: Array<HTMLImageElement | null> = new Array(rows * cols).fill(null)
    const loadPromises: Array<Promise<void>> = []
    for (let i = 0; i < rows * cols; i++) {
      const cell = cells[i]
      if (cell?.src) {
        const img = new Image()
        img.src = cell.src
        const p = (async () => {
          try {
            // @ts-ignore
            if (img.decode) await img.decode()
            else await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() })
          } catch (e) {
            // ignore
          }
        })()
        images[i] = img
        loadPromises.push(p)
      }
    }
    await Promise.all(loadPromises)

    // Compute column widths and row heights from loaded images (fallback to 0)
    const colWidths: number[] = new Array(cols).fill(0)
    const rowHeights: number[] = new Array(rows).fill(0)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const img = images[idx]
        if (img) {
          colWidths[c] = Math.max(colWidths[c], img.naturalWidth || 0)
          rowHeights[r] = Math.max(rowHeights[r], img.naturalHeight || 0)
        }
      }
    }

    // Measure label widths and expand column widths if label is wider than image
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')!
    measureCtx.font = `${fontSize}px sans-serif`
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const cell = cells[idx]
        if (cell?.label) {
          const metrics = measureCtx.measureText(cell.label)
          const labelWidth = Math.ceil(metrics.width) + 4 // small padding
          colWidths[c] = Math.max(colWidths[c], labelWidth)
        }
      }
    }

    const totalWidth = colWidths.reduce((a, b) => a + b, 0) + gap * Math.max(0, cols - 1)
  // Reserve slightly more vertical space for labels (allow descenders)
  const labelReserve = Math.ceil(fontSize * 1.4) + 8
  // reserve label space per row so labels for the last row are not clipped
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0) + gap * Math.max(0, rows - 1) + labelReserve * rows

    canvas.width = Math.max(1, totalWidth)
    canvas.height = Math.max(1, totalHeight)

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw images now that we have measurements
    let y = 0
    for (let r = 0; r < rows; r++) {
      let x = 0
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const img = images[idx]
        const w = colWidths[c]
        const h = rowHeights[r]
        const cell = cells[idx]
        if (img) {
          try {
            ctx.drawImage(img, x, y, img.naturalWidth || w, img.naturalHeight || h)
          } catch (e) {
            // ignore draw errors per-image
          }
          if (cell?.label) {
            ctx.fillStyle = '#000'
            ctx.font = `${fontSize}px sans-serif`
            // use top baseline so we can reserve consistent space below images
            ctx.textBaseline = 'top'
            const labelY = y + (img.naturalHeight || h) + 4
            ctx.fillText(cell.label, x + 2, labelY)
            // reset baseline just in case
            ctx.textBaseline = 'alphabetic'
          }
        }
        x += w + gap
      }
      y += rowHeights[r] + gap + labelReserve
    }
  }

  return (
    <div>
      {/* Hidden canvas (kept for export) - still rendered but hidden when preview is off */}
      <div style={{ display: preview ? 'none' : 'none' }} aria-hidden>
        <canvas ref={canvasRef} />
      </div>

      {/* Preview area: visible when preview prop is true. We scale via CSS so large canvases fit in the UI. */}
      <div className="canvas-preview" style={{ display: preview ? 'block' : 'none' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', maxWidth: '960px', border: '1px solid #ddd' }} />
      </div>
    </div>
  )
})

export default CanvasRenderer
