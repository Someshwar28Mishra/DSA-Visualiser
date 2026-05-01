/**
 * useTracer.js — Custom hook for fetching and navigating execution snapshots.
 * Supports both the legacy /api/trace (built-in algorithms) and
 * the new /api/run (free-form code sandbox with multi-DS output).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export function useTracer() {
  const [snapshots, setSnapshots]       = useState([]);
  const [currentStep, setCurrentStep]   = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [speed, setSpeed]               = useState(500);
  const [transpileInfo, setTranspileInfo] = useState(null); // { python, warnings, lang }
  const playInterval = useRef(null);

  // Stop auto-play
  const stopPlay = useCallback(() => {
    if (playInterval.current) {
      clearInterval(playInterval.current);
      playInterval.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Fetch all built-in algorithms from backend
  const fetchAlgorithms = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/algorithms`);
      return res.data.algorithms;
    } catch {
      return [];
    }
  }, []);

  // Fetch algorithm code by ID
  const fetchAlgorithmCode = useCallback(async (algoId) => {
    const res = await axios.get(`${API_BASE}/api/algorithms/${algoId}`);
    return res.data;
  }, []);

  // Legacy trace — for built-in algorithms (uses /api/trace)
  const runTrace = useCallback(async (code, algoType = 'auto') => {
    stopPlay();
    setLoading(true);
    setError(null);
    setSnapshots([]);
    setCurrentStep(0);
    setTranspileInfo(null);
    try {
      const res = await axios.post(`${API_BASE}/api/trace`, { code, algo_hint: algoType });
      const data = res.data;
      if (data.error) setError(data.error);
      setSnapshots(data.snapshots || []);
      setCurrentStep(0);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [stopPlay]);

  // Free-form run — for custom code sandbox (supports all languages via transpilation)
  const runCustomCode = useCallback(async (code, dsHint = 'auto', lang = 'python') => {
    stopPlay();
    setLoading(true);
    setError(null);
    setSnapshots([]);
    setCurrentStep(0);
    setTranspileInfo(null);
    try {
      const res = await axios.post(`${API_BASE}/api/run`, {
        code,
        lang,
        ds_hint: dsHint,
      });
      const data = res.data;
      if (data.error) setError(data.error);
      setSnapshots(data.snapshots || []);
      setCurrentStep(0);
      // Store transpile info if non-Python was transpiled
      if (data.transpiled_python || data.transpile_warnings?.length) {
        setTranspileInfo({
          python:   data.transpiled_python,
          warnings: data.transpile_warnings || [],
          lang:     data.original_lang || lang,
        });
      }
      return data; // Return so callers can read stdout etc.
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setError(detail || e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stopPlay]);


  // Navigation
  const stepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, snapshots.length - 1));
  }, [snapshots.length]);

  const stepBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((n) => {
    stopPlay();
    setCurrentStep(Math.max(0, Math.min(n, snapshots.length - 1)));
  }, [snapshots.length, stopPlay]);

  const reset = useCallback(() => {
    stopPlay();
    setCurrentStep(0);
  }, [stopPlay]);

  // Auto-play
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlay();
    } else {
      setIsPlaying(true);
      playInterval.current = setInterval(() => {
        setCurrentStep(s => {
          if (s >= snapshots.length - 1) {
            stopPlay();
            return s;
          }
          return s + 1;
        });
      }, speed);
    }
  }, [isPlaying, snapshots.length, speed, stopPlay]);

  // Restart interval when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopPlay();
      setIsPlaying(true);
      playInterval.current = setInterval(() => {
        setCurrentStep(s => {
          if (s >= snapshots.length - 1) {
            stopPlay();
            return s;
          }
          return s + 1;
        });
      }, speed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  // Cleanup on unmount
  useEffect(() => () => stopPlay(), [stopPlay]);

  const currentSnapshot = snapshots[currentStep] || null;

  return {
    snapshots,
    currentStep,
    currentSnapshot,
    loading,
    error,
    isPlaying,
    speed,
    setSpeed,
    runTrace,
    runCustomCode,
    stepForward,
    stepBack,
    goToStep,
    reset,
    togglePlay,
    fetchAlgorithms,
    fetchAlgorithmCode,
  };
}
