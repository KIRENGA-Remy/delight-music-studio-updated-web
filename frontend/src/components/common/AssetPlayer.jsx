import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Volume2, VolumeX, Download, Copy,
  Check, FileText, SkipBack, SkipForward, Music2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fileUrl } from '../../services/api';

export default function AssetPlayer({ asset, onClose, allAssets = [] }) {
  const audioRef  = useRef(null);
  const videoRef  = useRef(null);
  const [playing,    setPlaying]    = useState(false);
  const [muted,      setMuted]      = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [currentTime,setCurrentTime]= useState(0);
  const [duration,   setDuration]   = useState(0);
  const [volume,     setVolume]     = useState(1);
  const [copied,     setCopied]     = useState(false);
  const [currentIdx, setCurrentIdx] = useState(
    Math.max(0, allAssets.findIndex(a => a.id === asset?.id))
  );

  const current = allAssets.length > 0 ? allAssets[currentIdx] : asset;
  const url     = fileUrl(current?.file_url);
  const isAudio = current?.file_type === 'audio';
  const isVideo = current?.file_type === 'video';
  const isImage = current?.file_type === 'image';
  const isDoc   = current?.file_type === 'document';
  const mediaRef = isAudio ? audioRef : videoRef;

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [currentIdx]);

  const togglePlay = useCallback(() => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else {
      el.play().then(() => setPlaying(true)).catch(err => {
        console.error('Play error:', err);
        toast.error('Cannot play this file. Try downloading it.');
      });
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
    if (el) setDuration(el.duration);
  }, [mediaRef]);

  const onEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    // Auto-advance playlist
    if (currentIdx < allAssets.length - 1) {
      setTimeout(() => setCurrentIdx(i => i + 1), 500);
    }
  }, [currentIdx, allAssets.length]);

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
    const el = mediaRef.current;
    const next = !muted;
    setMuted(next);
    if (el) el.muted = next;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy — please copy the link manually');
    }
  };

  const fmt = (s) => {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const filename = current?.original_name || current?.file_url?.split('/').pop() || 'File';
  const playableAssets = allAssets.filter(a => ['audio','video'].includes(a.file_type));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-lg bg-dark-900 border border-purple-800/40 rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/40 bg-dark-950/60">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-white font-semibold text-sm truncate leading-tight">{filename}</p>
              <p className="text-purple-400 text-xs mt-0.5 capitalize">
                {current?.file_type} · by {current?.uploader_name}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Copy link */}
              <button onClick={copyLink} title="Copy link"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:text-white hover:bg-purple-800/40 transition-all text-xs font-medium">
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              {/* Download */}
              <a href={url} download={filename} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 transition-all text-xs font-medium"
                title="Download">
                <Download size={13} /> Download
              </a>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-800/40 transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* ── AUDIO ── */}
            {isAudio && (
              <>
                <audio
                  ref={audioRef}
                  src={url}
                  onTimeUpdate={onTimeUpdate}
                  onLoadedMetadata={onLoadedMetadata}
                  onEnded={onEnded}
                  onError={() => toast.error('Audio failed to load')}
                  preload="metadata"
                  crossOrigin="anonymous"
                />
                {/* Waveform art */}
                <div className="h-28 rounded-xl bg-gradient-to-br from-purple-950/80 to-dark-950 border border-purple-800/30 flex items-center justify-center overflow-hidden">
                  <div className="flex items-end gap-[2px] px-4 w-full h-20">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const height = 15 + Math.abs(Math.sin(i * 0.45 + 1.2) * 50) + Math.abs(Math.sin(i * 0.2) * 25);
                      const isPlayed = (i / 60) * 100 < progress;
                      return (
                        <div key={i} className="flex-1 rounded-full transition-colors duration-100"
                          style={{
                            height: `${height}%`,
                            backgroundColor: isPlayed ? '#9333EA' : '#3B1F6A',
                            opacity: isPlayed ? 1 : 0.5,
                          }} />
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
                  className="w-full max-h-64 object-contain"
                  onTimeUpdate={onTimeUpdate}
                  onLoadedMetadata={onLoadedMetadata}
                  onEnded={onEnded}
                  onError={() => toast.error('Video failed to load')}
                  preload="metadata"
                  crossOrigin="anonymous"
                  playsInline
                  muted={muted}
                />
              </div>
            )}

            {/* ── IMAGE ── */}
            {isImage && (
              <div className="rounded-xl overflow-hidden bg-dark-800/60 border border-purple-900/30 flex items-center justify-center min-h-40 max-h-72">
                <img src={url} alt={filename}
                  className="max-w-full max-h-72 object-contain rounded-lg"
                  onError={e => { e.target.alt = 'Image failed to load'; }}
                />
              </div>
            )}

            {/* ── DOCUMENT ── */}
            {isDoc && (
              <div className="rounded-xl border border-purple-900/30 bg-dark-800/40 p-8 text-center">
                <FileText size={44} className="mx-auto mb-3 text-gold-400 opacity-80" />
                <p className="text-white font-semibold text-sm">{filename}</p>
                <p className="text-purple-400 text-xs mt-1 mb-4">Document file · click to open</p>
                <a href={url} target="_blank" rel="noreferrer"
                  className="btn-gold text-sm px-5 py-2 inline-flex">
                  <ExternalLink size={14} /> Open Document
                </a>
              </div>
            )}

            {/* ── Audio/Video Controls ── */}
            {(isAudio || isVideo) && (
              <div className="space-y-3">
                {/* Seek bar */}
                <div>
                  <div
                    className="w-full h-2 bg-dark-800 rounded-full cursor-pointer relative group"
                    onClick={seek}>
                    <div
                      className="h-full bg-purple-gradient rounded-full pointer-events-none transition-none"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ left: `calc(${Math.min(100, progress)}% - 6px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-purple-500 mt-1.5 font-mono tabular-nums">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Play / skip controls */}
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
                <div className="flex items-center gap-3 px-2">
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

            {/* Playlist (for audio assets in same project) */}
            {allAssets.length > 1 && (
              <div className="border-t border-purple-900/30 pt-3">
                <p className="text-purple-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  Playlist — {allAssets.length} files
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {allAssets.map((a, idx) => {
                    const isCurrent = idx === currentIdx;
                    return (
                      <button key={a.id} onClick={() => setCurrentIdx(idx)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                          isCurrent
                            ? 'bg-purple-gradient text-white'
                            : 'text-purple-300 hover:bg-purple-900/30 hover:text-white'
                        }`}>
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 ${isCurrent ? 'bg-white/20' : 'bg-purple-900/50'}`}>
                          {isCurrent && playing ? '▶' : idx + 1}
                        </span>
                        <span className="truncate flex-1">{a.original_name || a.file_url.split('/').pop()}</span>
                        <span className="text-xs opacity-60 capitalize flex-shrink-0">{a.file_type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
