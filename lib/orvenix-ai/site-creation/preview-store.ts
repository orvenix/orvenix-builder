export {
  SITE_CREATION_PREVIEW_EXPIRES_MS,
  SITE_CREATION_PREVIEW_JOB_TYPE,
  SITE_CREATION_PREVIEW_MAX_BYTES,
  createDraftSiteFromPersistedPreview,
  getSiteCreationPreviewFailureMessage,
  getSiteCreationPreviewForExecute,
  normalizeSiteCreationPlanForReservedSite,
  rememberSiteCreationPreview,
  type SiteCreationPreviewOutput,
  type SiteCreationPreviewRecord,
  type SiteCreationPreviewStatus,
} from "./preview-service"

export async function clearSiteCreationPreviewsForTests() {
  const { editorPrisma } = await import("@/lib/editor-db")
  const { SITE_CREATION_PREVIEW_JOB_TYPE } = await import("./preview-service")

  await editorPrisma.aiGenerationJob.deleteMany({
    where: { type: SITE_CREATION_PREVIEW_JOB_TYPE },
  })
}
