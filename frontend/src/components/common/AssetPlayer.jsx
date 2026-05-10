import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Volume2, VolumeX, Download, Copy,
  Check, FileText, SkipBack, SkipForward, ExternalLink,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fileUrl } from '../../services/api';

export default function AssetPlayer({ asset, onClose, allAssets = [] }) {
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const [playing,     setPlaying]     = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(1);
  const [copied,      setCopied]      = useState(false);
  const [loadError,   setLoadError]   = useState(false);
  const [currentIdx,  setCurrentIdx]  = useState(
    Math.max(0, allAssets.findIndex(a => a.id === asset?.id))
  );

  const current  = allAssets.length > 0 ? allAssets[currentIdx] : asset;
  const url      = fileUrl(current?.file_url);
  const isAudio  = current?.file_type === 'audio';
  const isVideo  = current?.file_type === 'video';
  const isImage  = current?.file_type === 'image';
  const isDoc    = current?.file_type === 'document';
  const mediaRef = isAudio ? audioRef : videoRef;

  // Reset state when track changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setLoadError(false);
  }, [currentIdx]);

  // Auto-play when switching tracks
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !url || isImage || isDoc) return;
    el.load(); // force reload with new src
  }, [currentIdx, url, isImage, isDoc, mediaRef]);

  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      const promise = el.play();
      if (promise !== undefined) {
        promise
          .then(() => setPlaying(true))
          .catch(err => {
            console.error('Playback error:', err.name, err.message);
            setLoadError(true);
          });
      }
    }
  }, [playing, mediaRef]);

  const onTimeUpdate = useCallback(() => {
    const el = mediaRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;
    setCurrentTime(el.currentTime);
    setProgress((el.currentTime / el.duration) * 100);
  }, [mediaRef]);

  const onLoadedMetadata = useCallback(() => {
    const el = mediaRef.current;
    if (el && el.duration && !isNaN(el.duration)) {
      setDuration(el.duration);
      setLoadError(false);
    }
  }, [mediaRef]);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setProgress(100);
    if (currentIdx < allAssets.length - 1) {
      setTimeout(() => setCurrentIdx(i => i + 1), 600);
    }
  }, [currentIdx, allAssets.length]);

  const onMediaError = useCallback((e) => {
    const el = mediaRef.current;
    const errCode = el?.error?.code;
    const errMsg  = el?.error?.message || 'Unknown error';
    console.error('Media error:', errCode, errMsg, 'URL:', url);
    setLoadError(true);
    setPlaying(false);
  }, [url, mediaRef]);

  const seek = (e) => {
    const el = mediaRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * el.duration;
    setProgress(pct * 100);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (mediaRef.current) {
      mediaRef.current.volume = v;
      mediaRef.current.muted  = v === 0;
    }
  };

  const toggleMute = () => {
    const el  = mediaRef.current;
    const nxt = !muted;
    setMuted(nxt);
    if (el) { el.muted = nxt; }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const fmt = (s) => {
    if (!s || isNaN(s) || !isFinite(s) || s <= 0) return '0:00';
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const filename = current?.original_name || current?.file_url?.split('/').pop() || 'File';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/88 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-lg bg-dark-900 border border-purple-800/40 rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-900/40 bg-dark-950/60 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">{filename}</p>
              <p className="text-purple-400 text-xs mt-0.5 capitalize">
                {current?.file_type} · by {current?.uploader_name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={copyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:text-white hover:bg-purple-800/40 transition-all text-xs font-medium whitespace-nowrap">
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a href={url} download={filename}
                onClick={e => {
                  // Force download by fetching as blob
                  e.preventDefault();
                  fetch(url)
                    .then(r => r.blob())
                    .then(blob => {
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(a.href);
                    })
                    .catch(() => {
                      // If fetch fails (CORS etc), open in new tab
                      window.open(url, '_blank');
                    });
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 transition-all text-xs font-medium whitespace-nowrap">
                <Download size={11} /> Download
              </a>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-800/40 transition-all flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            <div className="p-4 space-y-4">

              {/* ── AUDIO ── */}
              {isAudio && (
                <>
                  {/* Hidden audio element — NO crossOrigin to avoid CORS preflight */}
                  <audio
                    ref={audioRef}
                    src={url}
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onEnded={onEnded}
                    onError={onMediaError}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    preload="metadata"
                  />
                  {/* Waveform visualization */}
                  <div className="h-28 rounded-xl bg-gradient-to-br from-purple-950 to-dark-950 border border-purple-800/30 overflow-hidden flex items-center">
                    <div className="flex items-end gap-[2px] px-3 w-full h-20">
                      {Array.from({ length: 55 }).map((_, i) => {
                        const h = 10 + Math.abs(Math.sin(i * 0.47 + 0.8) * 55) + Math.abs(Math.sin(i * 0.19) * 22);
                        const played = (i / 55) * 100 < progress;
                        return (
                          <div key={i}
                            className="flex-1 rounded-full transition-colors duration-75"
                            style={{
                              height: `${h}%`,
                              backgroundColor: played ? '#9333EA' : '#3B1F6A',
                              opacity: played ? 1 : 0.55,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── VIDEO ── */}
              {isVideo && (
                <div className="rounded-xl overflow-hidden bg-black border border-purple-900/30">
                  <video
                    ref={videoRef}
                    src={url}
                    className="w-full max-h-60 object-contain"
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onEnded={onEnded}
                    onError={onMediaError}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    preload="metadata"
                    playsInline
                  />
                </div>
              )}

              {/* ── IMAGE ── */}
              {isImage && (
                <div className="rounded-xl overflow-hidden bg-dark-800/60 border border-purple-900/30 flex items-center justify-center min-h-40 max-h-72">
                  <img
                    src={url}
                    alt={filename}
                    className="max-w-full max-h-72 object-contain rounded-lg"
                    onError={e => {
                      e.target.style.display = 'none';
                      setLoadError(true);
                    }}
                  />
                  {loadError && (
                    <div className="text-center p-6 text-purple-500">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Image failed to load</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── DOCUMENT ── */}
              {isDoc && (
                <div className="rounded-xl border border-purple-900/30 bg-dark-800/40 p-8 text-center">
                  <FileText size={44} className="mx-auto mb-3 text-gold-400 opacity-80" />
                  <p className="text-white font-semibold text-sm">{filename}</p>
                  <p className="text-purple-400 text-xs mt-1 mb-4">Document file</p>
                  <a href={url} target="_blank" rel="noreferrer"
                    className="btn-gold text-sm px-5 py-2 inline-flex">
                    <ExternalLink size={14} /> Open Document
                  </a>
                </div>
              )}

              {/* ── Load Error State ── */}
              {loadError && (isAudio || isVideo) && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                  <AlertCircle size={28} className="mx-auto mb-2 text-red-400 opacity-80" />
                  <p className="text-red-300 font-semibold text-sm mb-1">Cannot play this file</p>
                  <p className="text-red-400/70 text-xs mb-3 leading-relaxed">
                    The file may be stored on the server's local disk which resets on deploy.
                    Please re-upload the file or configure Cloudinary for persistent storage.
                  </p>
                  <a href={url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all">
                    <ExternalLink size={12} /> Try opening directly
                  </a>
                </div>
              )}

              {/* ── Audio/Video Controls ── */}
              {(isAudio || isVideo) && !loadError && (
                <div className="space-y-3">
                  {/* Seek bar */}
                  <div>
                    <div
                      className="w-full h-2 bg-dark-800 rounded-full cursor-pointer relative group"
                      onClick={seek}>
                      <div
                        className="h-full bg-purple-gradient rounded-full pointer-events-none"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${Math.min(100, progress)}% - 6px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-purple-500 mt-1 font-mono tabular-nums">
                      <span>{fmt(currentTime)}</span>
                      <span>{duration > 0 ? fmt(duration) : '--:--'}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-5">
                    <button
                      onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                      disabled={currentIdx <= 0 || allAssets.length <= 1}
                      className="p-2 text-purple-400 hover:text-white disabled:opacity-25 transition-colors">
                      <SkipBack size={20} />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center shadow-purple hover:scale-105 active:scale-95 transition-transform">
                      {playing
                        ? <Pause size={20} className="text-white" />
                        : <Play  size={20} className="text-white ml-0.5" />
                      }
                    </button>
                    <button
                      onClick={() => setCurrentIdx(i => Math.min(allAssets.length - 1, i + 1))}
                      disabled={currentIdx >= allAssets.length - 1 || allAssets.length <= 1}
                      className="p-2 text-purple-400 hover:text-white disabled:opacity-25 transition-colors">
                      <SkipForward size={20} />
                    </button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3 px-1">
                    <button onClick={toggleMute}
                      className="text-purple-400 hover:text-white transition-colors flex-shrink-0">
                      {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 accent-purple-500 cursor-pointer"
                    />
                    <span className="text-purple-500 text-xs w-8 text-right tabular-nums">
                      {Math.round((muted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* ── Playlist ── */}
              {allAssets.length > 1 && (
                <div className="border-t border-purple-900/30 pt-3">
                  <p className="text-purple-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    Playlist — {allAssets.length} files
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {allAssets.map((a, idx) => {
                      const isCur = idx === currentIdx;
                      return (
                        <button key={a.id} onClick={() => setCurrentIdx(idx)}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                            isCur ? 'bg-purple-gradient text-white' : 'text-purple-300 hover:bg-purple-900/30 hover:text-white'
                          }`}>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 ${isCur ? 'bg-white/20' : 'bg-purple-900/50'}`}>
                            {isCur && playing ? '▶' : idx + 1}
                          </span>
                          <span className="truncate flex-1">
                            {a.original_name || a.file_url?.split('/').pop()}
                          </span>
                          <span className="text-xs opacity-50 capitalize flex-shrink-0">{a.file_type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
