import { PlataformaLifestyleTemplatePage } from "@/components/marketing/PlataformaLifestyleTemplatePage";
import {
  getPlataformaLifestyleTemplate,
  type PlataformaLifestyleTemplateId,
} from "@/lib/plataformaLifestyleTemplates";

const templateId: PlataformaLifestyleTemplateId = "boutique";
const template = getPlataformaLifestyleTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaBoutiquePage() {
  return <PlataformaLifestyleTemplatePage template={template} />;
}
