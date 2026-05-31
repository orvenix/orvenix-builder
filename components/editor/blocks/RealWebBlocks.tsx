"use client";

// ── Finance ──────────────────────────────────────────────────
import { FinanceStats } from "@/components/editor/blocks/saas/finance/components/FinanceStats";
import { TransactionTable } from "@/components/editor/blocks/saas/finance/components/TransactionTable";
import { PortfolioBreakdown } from "@/components/editor/blocks/saas/finance/components/PortfolioBreakdown";
// ── HR ───────────────────────────────────────────────────────
import { HRStats } from "@/components/editor/blocks/saas/hr/components/HRStats";
import { EmployeeTable } from "@/components/editor/blocks/saas/hr/components/EmployeeTable";
import { RecruitmentPipeline } from "@/components/editor/blocks/saas/hr/components/RecruitmentPipeline";
// ── DevOps ───────────────────────────────────────────────────
import { ServerGrid } from "@/components/editor/blocks/saas/devops/components/ServerGrid";
import { AlertFeed } from "@/components/editor/blocks/saas/devops/components/AlertFeed";
import { ServiceStatus } from "@/components/editor/blocks/saas/devops/components/ServiceStatus";

import { metrics } from "@/components/editor/blocks/saas/ai-dashboard/data/metrics";
import { KPICard } from "@/components/editor/blocks/saas/ai-dashboard/components/KPICard";
import {
  RevenueChart,
  TrafficChart,
} from "@/components/editor/blocks/saas/ai-dashboard/components/RevenueChart";
import { ActivityFeed } from "@/components/editor/blocks/saas/ai-dashboard/components/ActivityFeed";
import { AIInsights } from "@/components/editor/blocks/saas/ai-dashboard/components/AIInsights";
import { StatsRow } from "@/components/editor/blocks/saas/crm/components/StatsRow";
import { ContactTable } from "@/components/editor/blocks/saas/crm/components/ContactTable";
import { Pipeline } from "@/components/editor/blocks/saas/crm/components/Pipeline";
import { OrdersTable } from "@/components/editor/blocks/saas/ecommerce/components/OrdersTable";
import { IssueList } from "@/components/editor/blocks/saas/project-manager/components/IssueList";
import { KanbanBoard } from "@/components/editor/blocks/saas/project-manager/components/KanbanBoard";
import { Hero } from "@/components/editor/blocks/saas/landing/components/Hero";
import { Features } from "@/components/editor/blocks/saas/landing/components/Features";
import { Testimonials } from "@/components/editor/blocks/saas/landing/components/Testimonials";
import { Pricing } from "@/components/editor/blocks/saas/landing/components/Pricing";
import { Footer } from "@/components/editor/blocks/saas/landing/components/Footer";

export function AiKpiGridBlock() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <KPICard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          positive={metric.positive}
          icon={metric.icon}
          colorKey={metric.colorKey}
          sparkline={metric.sparkline}
        />
      ))}
    </div>
  );
}

AiKpiGridBlock.defaults = {};

export function AiChartsBlock() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2">
        <RevenueChart />
      </div>
      <TrafficChart />
    </div>
  );
}

AiChartsBlock.defaults = {};

export function AiInsightsBlock() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <ActivityFeed />
      <AIInsights />
    </div>
  );
}

AiInsightsBlock.defaults = {};

export function CrmStatsBlock() {
  return <StatsRow />;
}

CrmStatsBlock.defaults = {};

export function CrmContactsBlock() {
  return <ContactTable />;
}

CrmContactsBlock.defaults = {};

export function CrmPipelineBlock() {
  return <Pipeline />;
}

CrmPipelineBlock.defaults = {};

export function EcommerceOrdersBlock() {
  return <OrdersTable />;
}

EcommerceOrdersBlock.defaults = {};

export function ProjectIssueListBlock() {
  return <IssueList />;
}

ProjectIssueListBlock.defaults = {};

export function ProjectKanbanBlock() {
  return <KanbanBoard />;
}

ProjectKanbanBlock.defaults = {};

export function LandingHeroBlock() {
  return <Hero />;
}

LandingHeroBlock.defaults = {};

export function LandingFeaturesBlock() {
  return <Features />;
}

LandingFeaturesBlock.defaults = {};

export function LandingTestimonialsBlock() {
  return <Testimonials />;
}

LandingTestimonialsBlock.defaults = {};

export function LandingPricingBlock() {
  return <Pricing />;
}

LandingPricingBlock.defaults = {};

export function LandingFooterBlock() {
  return <Footer />;
}

LandingFooterBlock.defaults = {};

// ── Finance blocks ────────────────────────────────────────────

export function FinanceStatsBlock() {
  return <FinanceStats />;
}
FinanceStatsBlock.defaults = {};

export function FinanceTransactionsBlock() {
  return <TransactionTable />;
}
FinanceTransactionsBlock.defaults = {};

export function FinancePortfolioBlock() {
  return <PortfolioBreakdown />;
}
FinancePortfolioBlock.defaults = {};

// ── HR blocks ─────────────────────────────────────────────────

export function HRStatsBlock() {
  return <HRStats />;
}
HRStatsBlock.defaults = {};

export function HREmployeeTableBlock() {
  return <EmployeeTable />;
}
HREmployeeTableBlock.defaults = {};

export function HRRecruitmentBlock() {
  return <RecruitmentPipeline />;
}
HRRecruitmentBlock.defaults = {};

// ── DevOps blocks ─────────────────────────────────────────────

export function DevOpsServerGridBlock() {
  return <ServerGrid />;
}
DevOpsServerGridBlock.defaults = {};

export function DevOpsAlertsBlock() {
  return <AlertFeed />;
}
DevOpsAlertsBlock.defaults = {};

export function DevOpsServicesBlock() {
  return <ServiceStatus />;
}
DevOpsServicesBlock.defaults = {};
