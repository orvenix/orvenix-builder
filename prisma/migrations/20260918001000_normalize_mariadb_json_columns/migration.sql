-- AlterTable
ALTER TABLE `ai_generation_jobs` MODIFY `input` JSON NOT NULL,
    MODIFY `output` JSON NULL;

-- AlterTable
ALTER TABLE `audit_logs` MODIFY `metadata` JSON NULL;

-- AlterTable
ALTER TABLE `automations` MODIFY `actionGraph` JSON NOT NULL;

-- AlterTable
ALTER TABLE `collections` MODIFY `fields` JSON NOT NULL;

-- AlterTable
ALTER TABLE `design_assistances` MODIFY `appliedProposal` JSON NULL;

-- AlterTable
ALTER TABLE `design_generations` MODIFY `initialPlan` JSON NOT NULL,
    MODIFY `editMetrics` JSON NULL,
    MODIFY `patternKey` JSON NULL;

-- AlterTable
ALTER TABLE `editor_websites` MODIFY `tree` JSON NOT NULL;

-- AlterTable
ALTER TABLE `experiments` MODIFY `trafficSplit` JSON NOT NULL;

-- AlterTable
ALTER TABLE `funnel_steps` MODIFY `settings` JSON NULL;

-- AlterTable
ALTER TABLE `funnels` MODIFY `settings` JSON NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `items` JSON NOT NULL;

-- AlterTable
ALTER TABLE `plans` MODIFY `features` JSON NOT NULL;

-- AlterTable
ALTER TABLE `product_variants` MODIFY `attributes` JSON NOT NULL;

-- AlterTable
ALTER TABLE `products` MODIFY `media` JSON NOT NULL,
    MODIFY `metadata` JSON NOT NULL;

-- AlterTable
ALTER TABLE `records` MODIFY `data` JSON NOT NULL;

-- AlterTable
ALTER TABLE `site_pages` MODIFY `tree` JSON NOT NULL,
    MODIFY `seo` JSON NULL;

-- AlterTable
ALTER TABLE `site_themes` MODIFY `tokens` JSON NOT NULL;

-- AlterTable
ALTER TABLE `subscription_history` MODIFY `metadata` JSON NULL;

-- AlterTable
ALTER TABLE `webhook_events` MODIFY `payload` JSON NULL;
