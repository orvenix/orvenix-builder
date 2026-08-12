"use client"

export function openPendingPublishedSiteTab() {
  const tab = window.open("about:blank", "_blank")

  if (!tab) return null

  try {
    tab.document.title = "Publicando sitio"
    tab.document.body.style.margin = "0"
    tab.document.body.style.background = "#07111f"
    tab.document.body.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;color:#e2e8f0;background:linear-gradient(135deg,#07111f,#0f172a)">
        <div style="text-align:center;padding:24px">
          <div style="width:42px;height:42px;margin:0 auto 16px;border-radius:999px;border:3px solid rgba(34,211,238,.22);border-top-color:#22d3ee;animation:spin .85s linear infinite"></div>
          <h1 style="font-size:18px;margin:0 0 8px;font-weight:800">Publicando tu sitio</h1>
          <p style="margin:0;color:#94a3b8;font-size:13px">En cuanto termine, abriremos la página publicada.</p>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      </main>
    `
  } catch {
    // La pestaña puede estar limitada por el navegador; aún podemos navegarla.
  }

  return tab
}

export function navigatePublishedSiteTab(tab: Window | null, url: string) {
  const absoluteUrl = new URL(url, window.location.origin).toString()

  if (tab && !tab.closed) {
    tab.location.assign(absoluteUrl)
    return
  }

  window.open(absoluteUrl, "_blank", "noopener,noreferrer")
}

export function closePendingPublishedSiteTab(tab: Window | null) {
  if (tab && !tab.closed) tab.close()
}
