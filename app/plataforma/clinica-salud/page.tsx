import { PlataformaWellnessTemplatePage } from "@/components/marketing/PlataformaWellnessTemplatePage";
import {
  getPlataformaWellnessTemplate,
  type PlataformaWellnessTemplateId,
} from "@/lib/plataformaWellnessTemplates";

const templateId: PlataformaWellnessTemplateId = "clinica-salud";
const template = getPlataformaWellnessTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaClinicaSaludPage() {
  return <PlataformaWellnessTemplatePage template={template} />;
}
