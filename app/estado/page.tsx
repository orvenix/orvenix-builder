import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { AlertSubscribeForm } from '@/components/marketing/AlertSubscribeForm';
import { getRuntimeHealth, type HealthState } from '@/lib/runtime-health';
import { getProductionReadinessReport } from '@/lib/production-readiness';
import { getSuperBuilderProgressReport } from '@/lib/super-builder-progress';

export const metadata: Metadata = {
  title: 'Estado del Sistema — Orvenix',
  description: 'Diagnóstico en tiempo real del entorno actual de Orvenix.',
};

export const dynamic = 'force-dynamic';

function badgeClasses(status: HealthState) {
  if (status === 'operational') {
    return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
  }

  if (status === 'degraded') {
    return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
  }

  return 'bg-red-500/20 border-red-500/40 text-red-300';
}

function statusCopy(status: HealthState) {
  if (status === 'operational') return 'Todos los sistemas criticos operan con normalidad';
  if (status === 'degraded') return 'El sistema opera con limitaciones parciales';
  return 'Hay servicios criticos pendientes de configuracion';
}

function statusDot(status: HealthState) {
  if (status === 'operational') return 'bg-emerald-400';
  if (status === 'degraded') return 'bg-amber-400';
  return 'bg-red-400';
}

function readinessCopy(status: ReturnType<typeof getProductionReadinessReport>['summary']) {
  if (status === 'ready') return 'La configuracion interna base esta alineada para pasar a validaciones externas.';
  return 'Todavia hay ajustes internos por cerrar antes de validar dominio, DB o pasarelas reales.';
}

export default async function EstadoPage() {
  const report = await getRuntimeHealth();
  const readiness = getProductionReadinessReport();
  const superBuilder = getSuperBuilderProgressReport();
  const checkedAt = new Date(report.checkedAt).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
  const operationalServices = report.services.filter((service) => service.status === 'operational').length;
  const degradedServices = report.services.filter((service) => service.status === 'degraded').length;
  const downServices = report.services.filter((service) => service.status === 'down').length;
  const automaticReady = readiness.automaticChecks.filter((check) => check.status === 'ready').length;
  const automaticAttention = readiness.automaticChecks.filter((check) => check.status === 'attention').length;
  const auditStats = [
    { period: 'Servicios OK', value: `${operationalServices}/${report.services.length}` },
    { period: 'Servicios parciales', value: `${degradedServices}` },
    { period: 'Alertas activas', value: `${report.warnings.length}` },
    { period: 'Checks internos listos', value: `${automaticReady}/${readiness.automaticChecks.length}` },
  ];

  return (
    <MarketingLayout>
      <section className="pt-8 pb-0">
        <div className="mk-container">
          <div className="mk-guarantee-banner flex flex-wrap items-center gap-4 p-6 text-lg font-semibold">
            <span className="text-2xl">{report.status === 'operational' ? '✅' : report.status === 'degraded' ? '⚠️' : '⛔'}</span>
            <span>{statusCopy(report.status)}</span>
            <span className="ml-auto text-sm font-normal text-orvenix-muted">Actualizado: {checkedAt} UTC</span>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Servicios"
            title={<>Estado de los <em className="not-italic mk-accent-text">servicios</em></>}
            description="Este panel refleja la configuracion real detectada en el entorno actual."
          />
          <div className="mt-10 space-y-3">
            {report.services.map((service) => (
              <div key={service.name} className="mk-glass-card px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="text-orvenix-text font-medium">{service.name}</span>
                  <p className="text-sm text-orvenix-secondary mt-1">{service.detail}</p>
                </div>
                <span className={`mk-feature-tag inline-flex items-center gap-2 ${badgeClasses(service.status)}`}>
                  <span className={`w-2 h-2 rounded-full ${statusDot(service.status)}`} />
                  {service.status === 'operational' ? 'Operacional' : service.status === 'degraded' ? 'Parcial' : 'Caido'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-16">
        <div className="mk-container">
          <SectionHeader
            tag="Verificaciones"
            title={<>Resumen de <em className="not-italic mk-accent-text">auditoría</em></>}
            center
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {auditStats.map((u) => (
              <div key={u.period} className="mk-glass-card p-6 text-center">
                <div className="text-3xl font-black mk-gradient-text mb-2">{u.value}</div>
                <div className="text-sm text-orvenix-secondary">{u.period}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Observaciones"
            title={<>Alertas de <em className="not-italic mk-accent-text">configuración</em></>}
          />
          <div className="mt-10 space-y-4">
            {report.warnings.length === 0 ? (
              <div className="mk-glass-card p-6">
                <p className="text-sm text-emerald-300">No se detectaron inconsistencias de configuración.</p>
              </div>
            ) : (
              report.warnings.map((warning) => (
                <div key={warning} className="mk-glass-card p-6">
                  <p className="text-sm text-orvenix-secondary">{warning}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-16">
        <div className="mk-container">
          <SectionHeader
            tag="Readiness"
            title={<>Salida a <em className="not-italic mk-accent-text">producción</em></>}
            description={readinessCopy(readiness.summary)}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="mk-glass-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orvenix-secondary">Chequeos internos</p>
                  <p className="mt-2 text-sm text-orvenix-secondary">
                    {automaticReady} alineado{automaticReady === 1 ? '' : 's'} · {automaticAttention} por revisar · {downServices} servicio{downServices === 1 ? '' : 's'} caído{downServices === 1 ? '' : 's'}
                  </p>
                </div>
                <span className={`mk-feature-tag inline-flex items-center gap-2 ${readiness.summary === 'ready' ? badgeClasses('operational') : badgeClasses('degraded')}`}>
                  <span className={`w-2 h-2 rounded-full ${readiness.summary === 'ready' ? statusDot('operational') : statusDot('degraded')}`} />
                  {readiness.summary === 'ready' ? 'Internamente listo' : 'Requiere atención'}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {readiness.automaticChecks.map((check) => (
                  <div key={check.key} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-orvenix-text">{check.label}</p>
                      <p className="mt-1 text-xs leading-5 text-orvenix-secondary">{check.detail}</p>
                    </div>
                    <span className={`mk-feature-tag inline-flex items-center gap-2 ${check.status === 'ready' ? badgeClasses('operational') : badgeClasses('degraded')}`}>
                      <span className={`w-2 h-2 rounded-full ${check.status === 'ready' ? statusDot('operational') : statusDot('degraded')}`} />
                      {check.status === 'ready' ? 'Listo' : 'Atención'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mk-glass-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orvenix-secondary">Siguientes validaciones</p>
              <div className="mt-5 space-y-3">
                {readiness.manualChecks.map((check, index) => (
                  <div key={check.key} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
                    <p className="text-sm font-medium text-orvenix-text">{index + 1}. {check.label}</p>
                    <p className="mt-1 text-xs leading-5 text-orvenix-secondary">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Super Builder"
            title={<>Progreso de <em className="not-italic mk-accent-text">plataforma</em></>}
            description="Además del estado operativo, este bloque muestra en qué tramo estratégico va el constructor."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="mk-glass-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orvenix-secondary">Avance estimado</p>
              <div className="mt-3 text-5xl font-black mk-gradient-text">{superBuilder.percent}%</div>
              <p className="mt-3 text-sm text-orvenix-secondary">
                {superBuilder.strongStages} de {superBuilder.totalStages} bloques del Super Builder ya tienen base fuerte o parcial.
              </p>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-linear-to-r from-sky-400 to-cyan-300"
                  style={{ width: `${superBuilder.percent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="mk-glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orvenix-secondary">Bloque activo</p>
                <p className="mt-3 text-lg font-semibold text-orvenix-text">
                  {superBuilder.current ? `${superBuilder.current.code} · ${superBuilder.current.title}` : 'Sin bloque activo'}
                </p>
                <p className="mt-2 text-sm text-orvenix-secondary">
                  {superBuilder.current?.summary ?? 'No hay foco activo pendiente.'}
                </p>
              </div>

              <div className="mk-glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orvenix-secondary">Siguiente recomendado</p>
                <p className="mt-3 text-lg font-semibold text-orvenix-text">
                  {superBuilder.next ? `${superBuilder.next.code} · ${superBuilder.next.title}` : 'Sin siguiente bloque'}
                </p>
                <p className="mt-2 text-sm text-orvenix-secondary">
                  {superBuilder.next?.summary ?? 'No hay siguiente bloque definido.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section mk-section-alt">
        <div className="mk-container max-w-xl mx-auto text-center">
          <SectionHeader
            tag="Alertas"
            title={<>Recibe <em className="not-italic mk-accent-text">notificaciones</em></>}
            description="Suscríbete para recibir avisos de mantenimiento, incidentes o cambios operativos."
            center
          />
          <AlertSubscribeForm />
        </div>
      </section>
    </MarketingLayout>
  );
}
