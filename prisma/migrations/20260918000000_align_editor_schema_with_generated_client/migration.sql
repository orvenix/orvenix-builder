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
ALTER TABLE `subscriptions` ADD COLUMN `pendingInterval` VARCHAR(16) NULL,
    ADD COLUMN `pendingPlanId` VARCHAR(64) NULL,
    ADD COLUMN `pendingStartsAt` DATETIME(3) NULL,
    ADD COLUMN `pendingStripePriceId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `webhook_events` MODIFY `payload` JSON NULL;

-- CreateTable
CREATE TABLE `site_pages` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `tree` JSON NOT NULL,
    `seo` JSON NULL,
    `isHome` BOOLEAN NOT NULL DEFAULT false,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `site_pages_siteId_idx`(`siteId`),
    INDEX `site_pages_siteId_published_idx`(`siteId`, `published`),
    UNIQUE INDEX `site_pages_siteId_slug_key`(`siteId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_themes` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `tokens` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `site_themes_siteId_key`(`siteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funnels` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `settings` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `funnels_siteId_idx`(`siteId`),
    INDEX `funnels_siteId_status_idx`(`siteId`, `status`),
    UNIQUE INDEX `funnels_siteId_slug_key`(`siteId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funnel_steps` (
    `id` VARCHAR(191) NOT NULL,
    `funnelId` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NULL,
    `kind` VARCHAR(32) NOT NULL,
    `position` INTEGER NOT NULL,
    `settings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `funnel_steps_funnelId_idx`(`funnelId`),
    INDEX `funnel_steps_funnelId_position_idx`(`funnelId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experiments` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `pageId` VARCHAR(191) NULL,
    `funnelId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `targetType` VARCHAR(32) NOT NULL,
    `trafficSplit` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `experiments_siteId_idx`(`siteId`),
    INDEX `experiments_siteId_status_idx`(`siteId`, `status`),
    INDEX `experiments_funnelId_idx`(`funnelId`),
    INDEX `experiments_pageId_idx`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_generation_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NULL,
    `pageId` VARCHAR(191) NULL,
    `type` VARCHAR(64) NOT NULL,
    `input` JSON NOT NULL,
    `output` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'queued',
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ai_generation_jobs_siteId_idx`(`siteId`),
    INDEX `ai_generation_jobs_pageId_idx`(`pageId`),
    INDEX `ai_generation_jobs_status_idx`(`status`),
    INDEX `ai_generation_jobs_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automations` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `triggerType` VARCHAR(64) NOT NULL,
    `actionGraph` JSON NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `automations_siteId_idx`(`siteId`),
    INDEX `automations_siteId_status_idx`(`siteId`, `status`),
    INDEX `automations_triggerType_idx`(`triggerType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` VARCHAR(20) NOT NULL DEFAULT 'info',
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `siteId` VARCHAR(191) NULL,
    `entityType` VARCHAR(50) NULL,
    `entityId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,

    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_module_idx`(`module`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_siteId_idx`(`siteId`),
    INDEX `audit_logs_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_history` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `oldPlanId` VARCHAR(64) NULL,
    `newPlanId` VARCHAR(64) NULL,
    `oldInterval` VARCHAR(16) NULL,
    `newInterval` VARCHAR(16) NULL,
    `oldStatus` VARCHAR(32) NULL,
    `newStatus` VARCHAR(32) NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'stripe',
    `reason` VARCHAR(64) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_history_subscriptionId_idx`(`subscriptionId`),
    INDEX `subscription_history_userId_idx`(`userId`),
    INDEX `subscription_history_createdAt_idx`(`createdAt`),
    INDEX `subscription_history_reason_idx`(`reason`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `design_generations_siteCreationAttemptId_idx` ON `design_generations`(`siteCreationAttemptId`);

-- CreateIndex
CREATE UNIQUE INDEX `webhook_events_provider_eventId_key` ON `webhook_events`(`provider`, `eventId`);
