"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ } from "@/lib/content";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {FAQ.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="card rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
            >
              <span className="text-sm font-medium pr-4">{item.q}</span>
              <ChevronDown
                size={16}
                className={`accordion-icon shrink-0 ${isOpen ? "open" : ""}`}
                color="var(--ink-muted)"
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm text-muted leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
