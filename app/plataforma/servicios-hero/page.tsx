import { PlataformaHeroTemplatePage } from "@/components/marketing/PlataformaHeroTemplatePage";
import {
  getPlataformaHeroTemplate,
  type PlataformaHeroTemplateId,
} from "@/lib/plataformaHeroTemplates";

const templateId: PlataformaHeroTemplateId = "servicios-hero";
const template = getPlataformaHeroTemplate(templateId);

export const metadata = template.metadata;

export default function PlataformaServiciosHeroPage() {
  return <PlataformaHeroTemplatePage template={template} />;
}
