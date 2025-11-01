import React, { useState, useRef } from 'react'
import Grid from './components/Grid'
import CanvasRenderer, { CanvasHandle } from './components/CanvasRenderer'

export type CellItem = {
  id: string
  src?: string // object URL or data URL
  fileName?: string
  width?: number
  height?: number
  label?: string
}

export default function App() {
  const [rows, setRows] = useState<number>(2)
  const [cols, setCols] = useState<number>(2)
  const [gap, setGap] = useState<number>(10)
  const [fontSize, setFontSize] = useState<number>(72)
  const [labelMode, setLabelMode] = useState<'below' | 'above' | 'overlay'>('overlay')
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [cells, setCells] = useState<CellItem[]>([])
  const canvasRef = useRef<CanvasHandle | null>(null)

  const initGrid = (r: number, c: number) => {
    const N = r * c
    const items: CellItem[] = []
    for (let i = 0; i < N; i++) items.push({ id: `${i}` })
    setCells(items)
  }

  React.useEffect(() => {
    initGrid(rows, cols)
  }, [])

  const handleGenerate = () => {
    initGrid(rows, cols)
  }

  const updateCell = (index: number, item: Partial<CellItem>) => {
    setCells(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...item }
      return copy
    })
  }

  const replaceCells = (newCells: CellItem[]) => setCells(newCells)

  const handleDownload = async () => {
    if (!canvasRef.current) return
    const blob = await canvasRef.current.exportPNG()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grid.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header>
        <h1>Image Lattice</h1>
      </header>

      <section className="controls">
        <label>
          Rows:
          <input type="number" min={1} value={rows} onChange={e => setRows(Number(e.target.value))} />
        </label>
        <label>
          Cols:
          <input type="number" min={1} value={cols} onChange={e => setCols(Number(e.target.value))} />
        </label>
        <label>
          Gap (px):
          <input type="number" min={0} value={gap} onChange={e => setGap(Number(e.target.value))} />
        </label>
        <label>
          Label font (px):
          <input type="number" min={8} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
        </label>
        <label>
          Label mode:
          <select value={labelMode} onChange={e => setLabelMode(e.target.value as any)}>
            <option value="below">Below image</option>
            <option value="above">Above image</option>
            <option value="overlay">Overlay (top-left)</option>
          </select>
        </label>
        <button onClick={handleGenerate}>Generate Grid</button>
        <button onClick={handleDownload}>Download PNG</button>
        <button onClick={() => setShowPreview(p => !p)}>{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
      </section>

      <Grid
        rows={rows}
        cols={cols}
        cells={cells}
        updateCell={updateCell}
        replaceCells={replaceCells}
      />

      <CanvasRenderer
        ref={canvasRef}
        rows={rows}
        cols={cols}
        cells={cells}
        gap={gap}
        fontSize={fontSize}
        preview={showPreview}
        labelMode={labelMode}
      />
    </div>
  )
}
