import type { EditorTree } from "@/types/editor"
import {
  adaptBlockContent,
} from "./content-engine"

import type {
  BusinessContentContext,
} from "./types"

export function applyBusinessContent(
  tree: EditorTree,
  business: BusinessContentContext,
): EditorTree {
  const nodes = Object.fromEntries(
    Object.entries(tree.nodes).map(
      ([id, node]) => {
        const adaptation =
          adaptBlockContent({
            blockType: node.type,
            props: node.props,
            business,
          })

        return [
          id,
          {
            ...node,
            props: adaptation.props,
          },
        ]
      },
    ),
  )

  return {
    ...tree,
    nodes,
    brand: {
      businessName:
        business.name?.trim() ||
        tree.brand?.businessName ||
        "Tu negocio",

      tagline:
        tree.brand?.tagline,

      description:
        business.description ??
        tree.brand?.description,

      contact: {
        phone:
          business.phone ??
          tree.brand?.contact?.phone,

        whatsapp:
          business.whatsapp ??
          tree.brand?.contact?.whatsapp,

        email:
          business.email ??
          tree.brand?.contact?.email,

        address:
          business.address ??
          tree.brand?.contact?.address,
      },

      social: tree.brand?.social,
      logoUrl: tree.brand?.logoUrl,
      faviconUrl: tree.brand?.faviconUrl,
    },
  }
}
