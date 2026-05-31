import { REAL_TEMPLATES } from "@/lib/realTemplates";
import { getEditorTreeForWeb, isEditorWebId } from "@/lib/editorWebs";
import type { EditorTree } from "@/types/editor";

export type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  livePath: string;
  accent: string;
  features: string[];
  purchasePriceMxn: number;
  rentalPriceMxn: number;
  preview: string;
  tree: EditorTree;
};

export const TEMPLATES: Template[] = REAL_TEMPLATES
  .filter((template) => isEditorWebId(template.id))
  .map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    livePath: template.livePath,
    accent: template.accent,
    features: template.features,
    purchasePriceMxn: template.purchasePriceMxn,
    rentalPriceMxn: template.rentalPriceMxn,
    preview: template.preview,
    tree: getEditorTreeForWeb(template.id),
  }));

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "Todos" },
  ...Array.from(new Set(TEMPLATES.map((template) => template.category))).map((category) => ({
    id: category,
    label: category,
  })),
];
