import { PlataformaLifestyleTemplatePage } from "@/components/marketing/PlataformaLifestyleTemplatePage";
import {
  getPlataformaLifestyleTemplate,
  type PlataformaLifestyleTemplateId,
} from "@/lib/plataformaLifestyleTemplates";

const templateId: PlataformaLifestyleTemplateId = "restaurante-completo";
const template = getPlataformaLifestyleTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaRestauranteCompletoPage() {
  return <PlataformaLifestyleTemplatePage template={template} />;
}
