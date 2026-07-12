"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function PhotoLightbox({ photoIds }: { photoIds: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photoIds.length === 0) return <span className="text-slate-300">-</span>;
  const shown = photoIds.slice(0, 3);
  const extra = photoIds.length - shown.length;

  return (
    <>
      <div className="flex items-center gap-1">
        {shown.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="rounded ring-1 ring-slate-200 transition-transform hover:scale-105"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${id}`} alt="" className="h-8 w-8 rounded object-cover" />
          </button>
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setOpenIndex(3)}
            className="text-xs font-medium text-slate-400 hover:text-accent"
          >
            +{extra}
          </button>
        )}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>

          {openIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(openIndex - 1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
              aria-label="Oldingi"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${photoIds[openIndex]}`}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {openIndex < photoIds.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(openIndex + 1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
              aria-label="Keyingi"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
            {openIndex + 1} / {photoIds.length}
          </div>
        </div>
      )}
    </>
  );
}
