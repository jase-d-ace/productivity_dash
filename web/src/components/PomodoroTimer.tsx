import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types'

interface Props {
  activeTodo: Note | null
  onClearActive: () => void
}

const PRESETS = [10, 15, 20, 30]

export default function PomodoroTimer({ activeTodo, onClearActive }: Props) {
  const [preset, setPreset] = useState(20)
  const [secondsLeft, setSecondsLeft] = useState(20 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  const selectPreset = (minutes: number) => {
    setPreset(minutes)
    setSecondsLeft(minutes * 60)
    setIsRunning(false)
    setFinished(false)
  }

  const reset = () => {
    setSecondsLeft(preset * 60)
    setIsRunning(false)
    setFinished(false)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div style={{
      textAlign: 'center',
      padding: '4px 0 0',
    }}>
      {/* Preset buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
        {PRESETS.map(m => (
          <button
            key={m}
            onClick={() => selectPreset(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: m === preset ? '#9b8ec4' : '#f0edff',
              color: m === preset ? '#fff' : '#6b5f8a',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {m}m
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{
        fontSize: 48,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: finished ? '#d4508b' : '#3a3650',
        animation: finished ? 'pomoPulse 1s ease-in-out infinite' : undefined,
        letterSpacing: 2,
        lineHeight: 1,
        marginBottom: 10,
      }}>
        {mins}:{secs}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => { setIsRunning(!isRunning); setFinished(false) }}
          style={{
            padding: '6px 20px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            background: isRunning ? '#e8c4d8' : '#9b8ec4',
            color: isRunning ? '#8b4070' : '#fff',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid #ddd8e8',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            background: 'transparent',
            color: '#8b85a0',
          }}
        >
          Reset
        </button>
      </div>

      {/* Active task */}
      <div style={{ fontSize: 13, color: '#8b85a0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 20 }}>
        {activeTodo ? (
          <>
            <span style={{ color: '#5a5470', fontWeight: 500 }}>{activeTodo.title}</span>
            <button
              onClick={onClearActive}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#b5b0c8',
                fontSize: 15,
                lineHeight: 1,
                padding: '0 2px',
              }}
              title="Clear active task"
            >
              &times;
            </button>
          </>
        ) : (
          <span>No active task</span>
        )}
      </div>

      <style>{`
        @keyframes pomoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
