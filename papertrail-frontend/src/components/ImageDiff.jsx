import { useState, useRef, useEffect } from 'react'
import './ImageDiff.css'

export default function ImageDiff({ urlV1, urlV2, labelV1, labelV2 }) {
  const [sliderPos, setSliderPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef()

  const updateSlider = (clientX) => {
    const rect = containerRef.current.getBoundingClientRect()
    const pos = ((clientX - rect.left) / rect.width) * 100
    setSliderPos(Math.min(Math.max(pos, 0), 100))
  }

  const onMouseMove = (e) => { if (dragging) updateSlider(e.clientX) }
  const onMouseUp = () => setDragging(false)
  const onTouchMove = (e) => { if (dragging) updateSlider(e.touches[0].clientX) }

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div className="image-diff">
      <div
        className="diff-container"
        ref={containerRef}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchEnd={() => setDragging(false)}
      >
        {/* V2 (after) — full width underneath */}
        <img src={urlV2} className="diff-img diff-after" alt="after" />

        {/* V1 (before) — clipped by slider */}
        <div className="diff-before-wrap" style={{ width: `${sliderPos}%` }}>
          <img src={urlV1} className="diff-img diff-before" alt="before" />
        </div>

        {/* Slider handle */}
        <div
          className="diff-slider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={() => setDragging(true)}
          onTouchStart={() => setDragging(true)}
        >
          <div className="diff-handle">
            <span>‹</span>
            <span>›</span>
          </div>
        </div>

        {/* Labels */}
        <span className="diff-label diff-label-left">{labelV1}</span>
        <span className="diff-label diff-label-right">{labelV2}</span>
      </div>
    </div>
  )
}