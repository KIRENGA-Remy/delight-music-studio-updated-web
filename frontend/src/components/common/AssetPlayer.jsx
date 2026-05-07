import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Volume2, VolumeX, Download, Share2,
  ExternalLink, Music2, FileText, SkipBack, SkipForward,
  Maximize2, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = 'https://delightmusicstudio.onrender.com';

export default function AssetPlayer({ asset, onClose, allAssets = [] }) {
  const audioRef = useRef();
  const videoRef = useRef();
  const [playing,   setPlaying]   = useState(false);
  const [muted,     setMuted]     = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [volume,    setVolume]    = useState(1);
  const [copied,    setCopied]    = useState(false);
  const [currentIdx, setCurrentIdx] = useState(
    allAssets.findIndex(a => a.id === asset?.id)
  );

  const current = allAssets[currentIdx] ?? asset;
  const fileUrl = current?.file_url?.startsWith('http')
    ? current.file_url
    : `${BASE_URL}${current?.file_url}`;

  const isAudio    = current?.file_type === 'audio';
  const isVideo    = current?.file_type === 'video';
  const isImage    = current?.file_type === 'image';
  const isDocument = current?.file_type === 'document';

  const mediaRef = isAudio ? audioRef : videoRef;

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [currentIdx]);

  const togglePlay = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { el.play();  setPlaying(true);  }
  };

  const onTimeUpdate = () => {
    const el = mediaRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  };

  const onLoadedMetadata = () => {
    const el = mediaRef.current;
    if (el) setDuration(el.duration);
  };

  const seek = (e) => {
    const el = mediaRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * el.duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleShare = async () => {
    const url = fileUrl;
    if (navigator.share) {
      try { await navigator.share({ title: current?.original_name || 'Asset', url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const prev = () => setCurrentIdx(i => Math.max(0, i - 1));
  const next = () => setCurrentIdx(i => Math.min(allAssets.length - 1, i + 1));

  const filename = current?.original_name || current?.file_url?.split('/').pop() || 'File';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl glass overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <p className="text-white font-display font-bold text-sm truncate">{filename}</p>
              <p className="text-purple-400 text-xs capitalize mt-0.5">{current?.file_type} · by {current?.uploader_name}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <button onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-300 hover:text-white transition-all"
                title="Share">
                {copied ? <Check size={15} className="text-green-400" /> : <Share2 size={15} />}
              </button>
              <a href={fileUrl} download target="_blank" rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-300 hover:text-gold-400 transition-all"
                title="Download">
                <Download size={15} />
              </a>
              <button onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-purple-400 hover:text-white transition-all">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Audio player */}
            {isAudio && (
              <div>
                {/* Waveform / art placeholder */}
                <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-purple-900/60 to-dark-900/80 border border-purple-800/30 flex items-center justify-center mb-5 overflow-hidden relative">
                  <div className="flex items-end gap-0.5 h-16">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i}
                        className="w-1.5 rounded-full bg-purple-gradient opacity-60"
                        style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }}
                      />
                    ))}
                  </div>
                  <Music2 size={32} className="absolute text-purple-400/30" />
                </div>
                <audio ref={audioRef} src={fileUrl}
                  onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata}
                  onEnded={() => setPlaying(false)} />
              </div>
            )}

            {/* Video player */}
            {isVideo && (
              <div className="rounded-2xl overflow-hidden mb-4 bg-black">
                <video ref={videoRef} src={fileUrl}
                  className="w-full max-h-72 object-contain"
                  onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata}
                  onEnded={() => setPlaying(false)}
                  muted={muted}
                  controls={false}
                />
              </div>
            )}

            {/* Image viewer */}
            {isImage && (
              <div className="rounded-2xl overflow-hidden mb-4 bg-dark-800/50 flex items-center justify-center min-h-48 max-h-80">
                <img src={fileUrl} alt={filename}
                  className="max-w-full max-h-80 object-contain rounded-xl"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Document */}
            {isDocument && (
              <div className="rounded-2xl border border-purple-900/30 bg-dark-800/40 p-8 text-center mb-4">
                <FileText size={48} className="mx-auto mb-3 text-gold-400 opacity-70" />
                <p className="text-white font-display font-semibold">{filename}</p>
                <p className="text-purple-400 text-sm mt-1">Document file</p>
                <a href={fileUrl} target="_blank" rel="noreferrer"
                  className="mt-4 btn-gold text-sm px-5 py-2.5 inline-flex">
                  <ExternalLink size={15} /> Open Document
                </a>
              </div>
            )}

            {/* Audio/Video controls */}
            {(isAudio || isVideo) && (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="group">
                  <div
                    className="w-full h-1.5 bg-dark-800 rounded-full cursor-pointer relative overflow-hidden hover:h-2.5 transition-all"
                    onClick={seek}>
                    <div
                      className="h-full bg-purple-gradient rounded-full transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-purple-500 mt-1 font-display">
                    <span>{formatTime(mediaRef.current?.currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-center gap-4">
                  {allAssets.length > 1 && (
                    <button onClick={prev} disabled={currentIdx === 0}
                      className="p-2 text-purple-400 hover:text-white disabled:opacity-30 transition-colors">
                      <SkipBack size={18} />
                    </button>
                  )}

                  <button onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center shadow-purple hover:scale-105 transition-transform">
                    {playing
                      ? <Pause size={20} className="text-white" />
                      : <Play  size={20} className="text-white ml-0.5" />
                    }
                  </button>

                  {allAssets.length > 1 && (
                    <button onClick={next} disabled={currentIdx === allAssets.length - 1}
                      className="p-2 text-purple-400 hover:text-white disabled:opacity-30 transition-colors">
                      <SkipForward size={18} />
                    </button>
                  )}
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setMuted(p => !p)}
                    className="text-purple-400 hover:text-white transition-colors">
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (mediaRef.current) mediaRef.current.volume = v;
                      setMuted(v === 0);
                    }}
                    className="flex-1 accent-purple-500 h-1" />
                </div>
              </div>
            )}

            {/* Playlist */}
            {allAssets.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-purple-500 text-xs font-display uppercase tracking-widest mb-2">
                  Playlist ({allAssets.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {allAssets.map((a, idx) => (
                    <button key={a.id} onClick={() => setCurrentIdx(idx)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        idx === currentIdx
                          ? 'bg-purple-gradient text-white'
                          : 'text-purple-300 hover:bg-purple-900/20 hover:text-white'
                      }`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs ${
                        idx === currentIdx ? 'bg-white/20' : 'bg-purple-900/40'
                      }`}>
                        {idx === currentIdx && playing ? '▶' : idx + 1}
                      </div>
                      <span className="truncate font-display">{a.original_name || a.file_url.split('/').pop()}</span>
                      <span className="text-xs opacity-60 capitalize flex-shrink-0">{a.file_type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
