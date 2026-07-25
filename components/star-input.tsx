"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Accessible star-rating input. Writes the chosen value to a hidden field named
 * `name` so it posts with a plain server-action <form>. Reusable for the overall
 * score and every dimension.
 */
export function StarInput({
  name,
  label,
  required = false,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[0.9375rem] text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--text-danger)]">*</span>}
      </span>
      <input type="hidden" name={name} value={value || ""} />
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValue(i === value ? 0 : i)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
          >
            <Star
              size={22}
              color="var(--color-amber-500)"
              fill={i <= shown ? "var(--color-amber-500)" : "transparent"}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}
