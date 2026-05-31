import { PlataformaHeroTemplatePage } from "@/components/marketing/PlataformaHeroTemplatePage";
import {
  getPlataformaHeroTemplate,
  type PlataformaHeroTemplateId,
} from "@/lib/plataformaHeroTemplates";

const templateId: PlataformaHeroTemplateId = "restaurante-hero";
const template = getPlataformaHeroTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaRestauranteHeroPage() {
  return <PlataformaHeroTemplatePage template={template} />;
}
