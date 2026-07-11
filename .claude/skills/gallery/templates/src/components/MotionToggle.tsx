"use client";

import { useMotion, type MotionMode } from "./MotionPreference";

const OPTIONS: { mode: MotionMode; label: string; hint: string }[] = [
  { mode: "play-all", label: "Auto", hint: "Play animated works in view" },
  { mode: "hover", label: "Hover", hint: "Play only on hover" },
  { mode: "off", label: "Off", hint: "Still images only" },
];

export default function MotionToggle() {
  const { mode, setMode } = useMotion();
  return (
    <div>
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-1.5">Media</p>
      <div className="inline-flex gap-2.5 text-[11px]" role="radiogroup" aria-label="Media playback">
        {OPTIONS.map((o) => (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={mode === o.mode}
            title={o.hint}
            onClick={() => setMode(o.mode)}
            className={`transition-colors duration-200 ${
              mode === o.mode ? "text-foreground font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
