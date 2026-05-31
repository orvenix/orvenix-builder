import { PlataformaWellnessTemplatePage } from "@/components/marketing/PlataformaWellnessTemplatePage";
import {
  getPlataformaWellnessTemplate,
  type PlataformaWellnessTemplateId,
} from "@/lib/plataformaWellnessTemplates";

const templateId: PlataformaWellnessTemplateId = "spa-bienestar";
const template = getPlataformaWellnessTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaSpaBienestarPage() {
  return <PlataformaWellnessTemplatePage template={template} />;
}
