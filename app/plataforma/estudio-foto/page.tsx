import { PlataformaLifestyleTemplatePage } from "@/components/marketing/PlataformaLifestyleTemplatePage";
import {
  getPlataformaLifestyleTemplate,
  type PlataformaLifestyleTemplateId,
} from "@/lib/plataformaLifestyleTemplates";

const templateId: PlataformaLifestyleTemplateId = "estudio-foto";
const template = getPlataformaLifestyleTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaEstudioFotoPage() {
  return <PlataformaLifestyleTemplatePage template={template} />;
}
