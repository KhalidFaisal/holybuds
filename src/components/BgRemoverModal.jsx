'use client';

import { useState } from 'react';

export default function BgRemoverModal({
  isOpen,
  onClose,
  originalUrl,
  processedUrl,
  onApply,
  isApplying,
}) {
  const [previewBg, setPreviewBg] = useState('grid'); // 'grid' | 'dark' | 'black' | 'white'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col p-6 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-pc-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="text-xl font-bold text-pure-white">AI Background Removed</h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
                100% In-Browser AI
              </span>
            </div>
            <p className="text-xs text-pc-muted mt-1">
              Inspect the edges below. The grid represents transparent pixels.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="text-pc-muted hover:text-white p-1 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Background Tester Selector */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-pc-muted">
            <span className="font-medium text-pure-white">Test Background:</span>
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setPreviewBg('grid')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  previewBg === 'grid'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-pc-muted hover:text-white'
                }`}
              >
                Checkerboard Grid
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  previewBg === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-pc-muted hover:text-white'
                }`}
              >
                Holy Buds Dark
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('black')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  previewBg === 'black'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-pc-muted hover:text-white'
                }`}
              >
                Pure Black
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('white')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  previewBg === 'white'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-pc-muted hover:text-white'
                }`}
              >
                Pure White
              </button>
            </div>
          </div>
          <span className="text-[11px] text-pc-muted">
            High-res transparent PNG (lossless)
          </span>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto mb-6 p-1">
          {/* Original */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-pc-muted mb-2 px-1">
              <span>Original Photo</span>
              <span className="text-[10px] text-pc-muted/70">Before</span>
            </div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-pc-smoke border border-pc-border flex items-center justify-center p-2">
              <img
                src={originalUrl}
                alt="Original product"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Processed Cutout */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-2 px-1">
              <span className="flex items-center gap-1">
                <span>Transparent Cutout</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] text-emerald-400/80 font-bold">After (No Background)</span>
            </div>
            <div
              className={`relative aspect-square w-full rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 flex items-center justify-center p-2 transition-colors duration-200 ${
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
                src={processedUrl}
                alt="Background removed cutout"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-pc-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            className="btn-secondary text-xs sm:text-sm py-2 px-4"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onApply({ replaceOriginal: false })}
            disabled={isApplying}
            className="btn-secondary text-pure-white border-white/20 hover:border-emerald-500/40 text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5"
            title="Keep the original image and add this cutout as an additional gallery image"
          >
            {isApplying ? 'Uploading...' : 'Add as New Image'}
          </button>

          <button
            type="button"
            onClick={() => onApply({ replaceOriginal: true })}
            disabled={isApplying}
            className="btn-primary text-xs sm:text-sm py-2 px-5 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            title="Replace the original image with this transparent PNG"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Replace Original</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
