'use client';

import { useEffect } from 'react';

export function GlobalEffects() {
  useEffect(() => {
    // ── Mouse glow con LERP ──────────────────────────────────
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.1;
      currentY += (mouseY - currentY) * 0.1;
      document.documentElement.style.setProperty('--global-x', `${currentX}px`);
      document.documentElement.style.setProperty('--global-y', `${currentY}px`);
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    // ── Scroll progress bar ──────────────────────────────────
    const progressBar = document.getElementById('scrollProgress');

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      if (progressBar) progressBar.style.width = `${pct}%`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Reveal on scroll ─────────────────────────────────────
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    // ── Spotlight en cards ───────────────────────────────────
    const onCardMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    const attachCardListeners = () => {
      const cards = document.querySelectorAll<HTMLElement>('.mk-glass-card');
      cards.forEach((card) => card.addEventListener('mousemove', onCardMouseMove));
      return cards;
    };

    let cards = attachCardListeners();

    // Re-attach cuando el DOM cambie (Next.js SPA navigation)
    const mutationObserver = new MutationObserver(() => {
      cards.forEach((card) => card.removeEventListener('mousemove', onCardMouseMove));
      cards = attachCardListeners();
      document.querySelectorAll('.reveal:not(.active)').forEach((el) =>
        revealObserver.observe(el)
      );
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      revealObserver.disconnect();
      mutationObserver.disconnect();
      cards.forEach((card) => card.removeEventListener('mousemove', onCardMouseMove));
    };
  }, []);

  return null;
}
