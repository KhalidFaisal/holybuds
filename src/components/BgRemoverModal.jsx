'use client';

import { useState, useRef, useEffect } from 'react';
import { cleanupAlphaChannel } from '@/lib/bgRemover';

export default function BgRemoverModal({
  isOpen,
  onClose,
  originalUrl,
  processedUrl,
  onApply,
  isApplying,
}) {
  const [previewBg, setPreviewBg] = useState('grid'); // 'grid' | 'dark' | 'black' | 'white'
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side' | 'cutout'
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 percentage
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedUrl, setCleanedUrl] = useState(null);
  const [cleanedBlob, setCleanedBlob] = useState(null);

  const isDraggingSlider = useRef(false);
  const sliderContainerRef = useRef(null);

  // Active display URL is cleanedUrl if available, else processedUrl
  const activeProcessedUrl = cleanedUrl || processedUrl;

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
    };
  }, [cleanedUrl]);

  const handleClose = () => {
    if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
    setCleanedUrl(null);
    setCleanedBlob(null);
    setSliderPos(50);
    setViewMode('slider');
    onClose();
  };

  // Handle slider drag interaction
  const handleSliderMove = (clientX) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(clampedPercent);
  };

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingSlider.current = false;
    };
    const handleMouseMove = (e) => {
      if (isDraggingSlider.current) {
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e) => {
      if (isDraggingSlider.current && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Extra noise cleaner threshold button
  const handleDeepClean = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch(activeProcessedUrl);
      const blob = await res.blob();
      const strippedBlob = await cleanupAlphaChannel(blob, 40); // higher threshold for stubborn noise
      const url = URL.createObjectURL(strippedBlob);
      if (cleanedUrl) URL.revokeObjectURL(cleanedUrl);
      setCleanedUrl(url);
      setCleanedBlob(strippedBlob);
    } catch (err) {
      console.error('Deep clean error:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="w-full max-w-5xl max-h-[94vh] flex flex-col bg-[#0f1210] border border-zinc-800/80 rounded-2xl md:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-[#141715]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shadow-sm">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: '#ffffff' }}>
                  AI Background Cutout Studio
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Instant AI
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect edges and transparency before updating product images.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isApplying}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-b border-zinc-800/60 bg-[#121513] text-xs">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#1a1e1b] p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'slider'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>Split Slider</span>
              <span className="text-[10px] opacity-75">↔</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'side'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cutout')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'cutout'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Cutout Only
            </button>
          </div>

          {/* Test Background Selector */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium hidden md:inline">Test Canvas:</span>
            <div className="flex items-center gap-1 bg-[#1a1e1b] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setPreviewBg('grid')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  previewBg === 'grid'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Checkerboard Transparency Grid"
              >
                <span className="w-3 h-3 rounded-full border border-zinc-600 bg-transparency-grid inline-block flex-shrink-0" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  previewBg === 'dark'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Holy Buds Dark Theme Background"
              >
                <span className="w-3 h-3 rounded-full border border-emerald-900 bg-[#0d110e] inline-block flex-shrink-0" />
                <span>Store Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('black')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  previewBg === 'black'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Pure Black Canvas"
              >
                <span className="w-3 h-3 rounded-full border border-zinc-700 bg-black inline-block flex-shrink-0" />
                <span>Black</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('white')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  previewBg === 'white'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Pure White Canvas"
              >
                <span className="w-3 h-3 rounded-full border border-zinc-300 bg-white inline-block flex-shrink-0" />
                <span>White</span>
              </button>
            </div>

            {/* Deep Clean Action Button */}
            <button
              type="button"
              onClick={handleDeepClean}
              disabled={isCleaning}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 font-medium flex items-center gap-1 transition-all disabled:opacity-50"
              title="Remove faint shadow specks and table reflections"
            >
              <span>🧹</span>
              <span className="hidden sm:inline">{isCleaning ? 'Cleaning...' : 'Clean Dust'}</span>
            </button>
          </div>
        </div>

        {/* Studio View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0c0b] flex items-center justify-center min-h-[360px] max-h-[62vh]">
          {/* MODE 1: Interactive Split Slider */}
          {viewMode === 'slider' && (
            <div
              ref={sliderContainerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className={`relative aspect-square max-w-[540px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl cursor-ew-resize select-none transition-colors duration-200 ${
                previewBg === 'grid'
                  ? 'bg-transparency-grid'
                  : previewBg === 'dark'
                  ? 'bg-[#0d110e]'
                  : previewBg === 'black'
                  ? 'bg-black'
                  : 'bg-white'
              }`}
            >
              {/* Layer 1: Cutout Image (Base Canvas with selected test bg) */}
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <img
                  src={activeProcessedUrl}
                  alt="Transparent cutout"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>

              {/* Layer 2: Original Image (Clipped from left to sliderPos%) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none bg-[#181a19]"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img
                    src={originalUrl}
                    alt="Original photo"
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                </div>
                {/* Before Label */}
                <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-zinc-300 px-2.5 py-1 rounded-md text-[11px] font-bold border border-white/10 tracking-wider uppercase">
                  Original
                </span>
              </div>

              {/* After Label (Right side) */}
              <span className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-sm text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-500/30 tracking-wider uppercase pointer-events-none">
                Cutout
              </span>

              {/* Vertical Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black font-black text-xs shadow-xl flex items-center justify-center border-2 border-emerald-500 pointer-events-none">
                  ↔
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Side-by-Side Comparison */}
          {viewMode === 'side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Original Box */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2 px-1">
                  <span>Original Photo</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Before</span>
                </div>
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#161817] border border-zinc-800 flex items-center justify-center p-4">
                  <img
                    src={originalUrl}
                    alt="Original product"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Cutout Box */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-2 px-1">
                  <span className="flex items-center gap-1.5">
                    <span>Transparent Cutout</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">After</span>
                </div>
                <div
                  className={`relative aspect-square w-full rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl flex items-center justify-center p-4 transition-colors duration-200 ${
                    previewBg === 'grid'
                      ? 'bg-transparency-grid'
                      : previewBg === 'dark'
                      ? 'bg-[#0d110e]'
                      : previewBg === 'black'
                      ? 'bg-black'
                      : 'bg-white'
                  }`}
                >
                  <img
                    src={activeProcessedUrl}
                    alt="Cutout product"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: Cutout Only */}
          {viewMode === 'cutout' && (
            <div
              className={`relative aspect-square max-w-[540px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center p-6 transition-colors duration-200 ${
                previewBg === 'grid'
                  ? 'bg-transparency-grid'
                  : previewBg === 'dark'
                  ? 'bg-[#0d110e]'
                  : previewBg === 'black'
                  ? 'bg-black'
                  : 'bg-white'
              }`}
            >
              <img
                src={activeProcessedUrl}
                alt="Cutout product"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-zinc-800/80 bg-[#141715]/90">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            💡 Drag slider or change test canvas to verify edge quality.
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isApplying}
              className="px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onApply({ replaceOriginal: false, customBlob: cleanedBlob })}
              disabled={isApplying}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white text-sm font-medium border border-zinc-700/70 transition-all shadow-sm"
              title="Keep original and append transparent cutout as a new gallery image"
            >
              {isApplying ? 'Uploading...' : 'Add as New Image'}
            </button>

            <button
              type="button"
              onClick={() => onApply({ replaceOriginal: true, customBlob: cleanedBlob })}
              disabled={isApplying}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center gap-2"
              title="Replace original with this transparent cutout"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Replace Original</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
