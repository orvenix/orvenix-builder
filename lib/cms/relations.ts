import { editorPrisma } from "@/lib/editor-db"
import {
  getRelationIds,
  getRelationRecordLabel,
  parseCmsFields,
  type CmsFieldDef,
} from "@/lib/cms/schema"

interface BaseCollectionRecord {
  id: string
  slug: string
  fields: unknown
}

interface BaseRecord {
  id: string
  data: unknown
}

interface ResolvedRelationItem {
  id: string
  label: string
  collectionSlug: string
  data: Record<string, unknown>
}

export interface CmsRecordWithResolvedRelations {
  id: string
  data: Record<string, unknown>
  resolvedData: Record<string, unknown>
  resolvedRelations: Record<string, ResolvedRelationItem | ResolvedRelationItem[]>
}

type RelationCollectionMap = Map<string, {
  id: string
  slug: string
  fields: CmsFieldDef[]
  recordsById: Map<string, { id: string; data: Record<string, unknown> }>
}>

function toRecordData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

async function loadRelationCollections(
  siteId: string,
  fields: CmsFieldDef[]
): Promise<RelationCollectionMap> {
  const relationSlugs = [...new Set(
    fields
      .filter((field) => field.type === "relation" && field.relation?.collectionSlug)
      .map((field) => field.relation!.collectionSlug)
  )]

  if (relationSlugs.length === 0) return new Map()

  const collections = await editorPrisma.collection.findMany({
    where: {
      siteId,
      slug: { in: relationSlugs },
    },
    include: {
      records: {
        select: { id: true, data: true },
      },
    },
  })

  return new Map(
    collections.map((collection) => [
      collection.slug,
      {
        id: collection.id,
        slug: collection.slug,
        fields: parseCmsFields(collection.fields),
        recordsById: new Map(
          collection.records.map((record) => [
            record.id,
            { id: record.id, data: toRecordData(record.data) },
          ])
        ),
      },
    ])
  )
}

export async function resolveCmsRecordRelations(
  siteId: string,
  collection: BaseCollectionRecord,
  records: BaseRecord[]
): Promise<CmsRecordWithResolvedRelations[]> {
  const fields = parseCmsFields(collection.fields)
  const relationCollections = await loadRelationCollections(siteId, fields)

  return records.map((record) => {
    const data = toRecordData(record.data)
    const resolvedData: Record<string, unknown> = {}
    const resolvedRelations: Record<string, ResolvedRelationItem | ResolvedRelationItem[]> = {}

    for (const field of fields) {
      if (field.type !== "relation" || !field.relation) continue

      const source = relationCollections.get(field.relation.collectionSlug)
      if (!source) continue

      const ids = getRelationIds(field, data[field.slug])
      const items = ids
        .map((id) => source.recordsById.get(id))
        .filter((item): item is { id: string; data: Record<string, unknown> } => Boolean(item))
        .map((item) => ({
          id: item.id,
          label: getRelationRecordLabel(source.fields, item, field.relation?.displayField),
          collectionSlug: source.slug,
          data: item.data,
        }))

      if (field.relation.multiple) {
        resolvedRelations[field.slug] = items
        resolvedData[field.slug] = items.map((item) => item.label).join(", ")
      } else {
        const first = items[0] ?? null
        if (!first) continue
        resolvedRelations[field.slug] = first
        resolvedData[field.slug] = first.label
      }
    }

    return {
      id: record.id,
      data,
      resolvedData,
      resolvedRelations,
    }
  })
}
