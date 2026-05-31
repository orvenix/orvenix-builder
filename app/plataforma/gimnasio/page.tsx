import { PlataformaWellnessTemplatePage } from "@/components/marketing/PlataformaWellnessTemplatePage";
import {
  getPlataformaWellnessTemplate,
  type PlataformaWellnessTemplateId,
} from "@/lib/plataformaWellnessTemplates";

const templateId: PlataformaWellnessTemplateId = "gimnasio";
const template = getPlataformaWellnessTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaGimnasioPage() {
  return <PlataformaWellnessTemplatePage template={template} />;
}
