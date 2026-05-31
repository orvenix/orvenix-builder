import { PlataformaHeroTemplatePage } from "@/components/marketing/PlataformaHeroTemplatePage";
import {
  getPlataformaHeroTemplate,
  type PlataformaHeroTemplateId,
} from "@/lib/plataformaHeroTemplates";

const templateId: PlataformaHeroTemplateId = "hero-moderno";
const template = getPlataformaHeroTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaHeroModernoPage() {
  return <PlataformaHeroTemplatePage template={template} />;
}
