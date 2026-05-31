'use client';

import { useState } from 'react';

export function AlertSubscribeForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  if (done) {
    return (
      <p className="text-sm font-semibold mk-accent-text mt-8">
        ✅ ¡Listo! Te avisaremos ante cualquier incidente.
      </p>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row gap-3 mt-8" onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        required
        className="flex-1 px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
      />
      <button type="submit" className="mk-btn-primary shrink-0">
        Recibir alertas
      </button>
    </form>
  );
}
