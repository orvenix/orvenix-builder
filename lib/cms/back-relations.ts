import {
  getRelationIds,
  getRelationRecordLabel,
  parseCmsFields,
  type CmsFieldDef,
} from "./schema"

type CmsRecordLike = {
  id: string
  data: Record<string, unknown>
}

type CmsCollectionLike = {
  name: string
  slug: string
  fields: unknown
  records: CmsRecordLike[]
}

type BackRelationItem = {
  id: string
  label: string
  fieldSlug: string
}

type BackRelationGroup = {
  collectionName: string
  collectionSlug: string
  items: BackRelationItem[]
}

function isRelationField(field: CmsFieldDef, targetCollectionSlug: string): boolean {
  return field.type === "relation" && field.relation?.collectionSlug === targetCollectionSlug
}

export function collectCmsBackRelations(
  targetCollectionSlug: string,
  targetRecords: CmsRecordLike[],
  sourceCollections: CmsCollectionLike[]
): Record<string, BackRelationGroup[]> {
  const targetIds = new Set(targetRecords.map((record) => record.id))
  const result = Object.fromEntries(targetRecords.map((record) => [record.id, [] as BackRelationGroup[]]))

  for (const collection of sourceCollections) {
    const fields = parseCmsFields(collection.fields)
    const relationFields = fields.filter((field) => isRelationField(field, targetCollectionSlug))
    if (relationFields.length === 0) continue

    const groupsByTarget = new Map<string, BackRelationGroup>()
    for (const field of relationFields) {
      for (const record of collection.records) {
        const relationIds = getRelationIds(field, record.data?.[field.slug])
        for (const relationId of relationIds) {
          if (!targetIds.has(relationId)) continue

          if (!groupsByTarget.has(relationId)) {
            groupsByTarget.set(relationId, {
              collectionName: collection.name,
              collectionSlug: collection.slug,
              items: [],
            })
          }

          groupsByTarget.get(relationId)!.items.push({
            id: record.id,
            label: getRelationRecordLabel(fields, record),
            fieldSlug: field.slug,
          })
        }
      }
    }

    for (const [targetId, group] of groupsByTarget.entries()) {
      result[targetId].push(group)
    }
  }

  return result
}
