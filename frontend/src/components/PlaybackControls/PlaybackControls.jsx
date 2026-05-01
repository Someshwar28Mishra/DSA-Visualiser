/**
 * PlaybackControls.jsx — Step/Play/Pause/Speed/Progress controls.
 */
import {
  Play, Pause, SkipBack, SkipForward, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function PlaybackControls({
  isPlaying, onTogglePlay, onStepBack, onStepForward,
  onReset, currentStep, totalSteps, speed, onSpeedChange, disabled
}) {
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="playback-bar">
      <div className="playback-controls">
        <button
          className="step-btn"
          onClick={onReset}
          disabled={disabled || currentStep === 0}
          title="Reset"
        >
          <RefreshCw size={14} />
        </button>

        <button
          className="step-btn"
          onClick={onStepBack}
          disabled={disabled || currentStep === 0}
          title="Step back"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          className="play-btn"
          onClick={onTogglePlay}
          disabled={disabled || totalSteps === 0}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          className="step-btn"
          onClick={onStepForward}
          disabled={disabled || currentStep >= totalSteps - 1}
          title="Step forward"
        >
          <ChevronRight size={16} />
        </button>

        <button
          className="step-btn"
          onClick={() => onStepForward && onStepForward(totalSteps - 1)}
          disabled={disabled || currentStep >= totalSteps - 1}
          title="Skip to end"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="progress-row">
        <span>{currentStep + 1}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{totalSteps}</span>
      </div>

      <div className="speed-row">
        <span>🐢</span>
        <input
          className="speed-slider"
          type="range"
          min={100}
          max={1500}
          step={100}
          value={1600 - speed}
          onChange={e => onSpeedChange(1600 - Number(e.target.value))}
          title={`Speed: ${speed}ms/step`}
        />
        <span>🐇</span>
        <span style={{ marginLeft: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {speed}ms
        </span>
      </div>
    </div>
  );
}
