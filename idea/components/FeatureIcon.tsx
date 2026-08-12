import { Layers, Palette, Zap, Globe, ShoppingBag, ShieldCheck, type LucideProps } from "lucide-react";
import type { Feature } from "@/lib/content";

const ICONS: Record<Feature["iconName"], React.ComponentType<LucideProps>> = {
  Layers,
  Palette,
  Zap,
  Globe,
  ShoppingBag,
  ShieldCheck,
};

export default function FeatureIcon({ name, ...props }: { name: Feature["iconName"] } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon {...props} />;
}
