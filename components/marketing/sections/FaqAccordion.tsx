'use client';

import { useState } from 'react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function FaqAccordion({ items, className = '' }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="mk-faq-item"
          data-open={open === i ? 'true' : 'false'}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i ? 'true' : 'false'}
            className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors duration-200 ${open === i ? 'text-orvenix-accent' : 'text-orvenix-text'}`}
          >
            <span>{item.question}</span>
            <span
              className={`mk-faq-icon ${open === i ? 'mk-faq-icon-open' : ''}`}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          <div className="mk-faq-answer-wrap">
            <div className="mk-faq-answer-inner">
              <p className="px-5 pb-5 text-sm leading-relaxed text-orvenix-secondary">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
