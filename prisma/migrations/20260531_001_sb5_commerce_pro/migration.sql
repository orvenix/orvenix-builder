-- SB5 Commerce Pro: funnels, funnel_steps, experiments, ai_generation_jobs,
--                   automations, automation_executions
-- Applied after baseline 20260524_000000_baseline
-- Run via: npm run prisma:deploy-schema

-- CreateTable: funnels
CREATE TABLE IF NOT EXISTS `funnels` (
    `id`        VARCHAR(191)  NOT NULL,
    `siteId`    VARCHAR(64)   NOT NULL,
    `name`      VARCHAR(191)  NOT NULL,
    `slug`      VARCHAR(191)  NOT NULL,
    `status`    VARCHAR(32)   NOT NULL DEFAULT 'draft',
    `settings`  JSON          NOT NULL,
    `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)   NOT NULL,

    UNIQUE INDEX `funnels_siteId_slug_key`(`siteId`, `slug`),
    INDEX `funnels_siteId_idx`(`siteId`),
    INDEX `funnels_siteId_status_idx`(`siteId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: funnels → editor_websites
ALTER TABLE `funnels`
    ADD CONSTRAINT `funnels_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: funnel_steps
CREATE TABLE IF NOT EXISTS `funnel_steps` (
    `id`        VARCHAR(191)  NOT NULL,
    `funnelId`  VARCHAR(191)  NOT NULL,
    `pageId`    VARCHAR(191)  NULL,
    `kind`      VARCHAR(32)   NOT NULL,
    `position`  INTEGER       NOT NULL,
    `settings`  JSON          NULL,
    `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)   NOT NULL,

    INDEX `funnel_steps_funnelId_idx`(`funnelId`),
    INDEX `funnel_steps_funnelId_position_idx`(`funnelId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: funnel_steps → funnels
ALTER TABLE `funnel_steps`
    ADD CONSTRAINT `funnel_steps_funnelId_fkey`
    FOREIGN KEY (`funnelId`) REFERENCES `funnels`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: experiments
CREATE TABLE IF NOT EXISTS `experiments` (
    `id`           VARCHAR(191)  NOT NULL,
    `siteId`       VARCHAR(64)   NOT NULL,
    `pageId`       VARCHAR(191)  NULL,
    `funnelId`     VARCHAR(191)  NULL,
    `name`         VARCHAR(191)  NOT NULL,
    `status`       VARCHAR(32)   NOT NULL DEFAULT 'draft',
    `targetType`   VARCHAR(32)   NOT NULL,
    `trafficSplit` JSON          NOT NULL,
    `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3)   NOT NULL,

    INDEX `experiments_siteId_idx`(`siteId`),
    INDEX `experiments_siteId_status_idx`(`siteId`, `status`),
    INDEX `experiments_funnelId_idx`(`funnelId`),
    INDEX `experiments_pageId_idx`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: experiments → editor_websites
ALTER TABLE `experiments`
    ADD CONSTRAINT `experiments_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ai_generation_jobs
CREATE TABLE IF NOT EXISTS `ai_generation_jobs` (
    `id`        VARCHAR(191)  NOT NULL,
    `siteId`    VARCHAR(64)   NULL,
    `pageId`    VARCHAR(191)  NULL,
    `type`      VARCHAR(64)   NOT NULL,
    `input`     JSON          NOT NULL,
    `output`    JSON          NULL,
    `status`    VARCHAR(32)   NOT NULL DEFAULT 'queued',
    `error`     TEXT          NULL,
    `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)   NOT NULL,

    INDEX `ai_generation_jobs_siteId_idx`(`siteId`),
    INDEX `ai_generation_jobs_pageId_idx`(`pageId`),
    INDEX `ai_generation_jobs_status_idx`(`status`),
    INDEX `ai_generation_jobs_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: ai_generation_jobs → editor_websites (nullable)
ALTER TABLE `ai_generation_jobs`
    ADD CONSTRAINT `ai_generation_jobs_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: automations
CREATE TABLE IF NOT EXISTS `automations` (
    `id`          VARCHAR(191)  NOT NULL,
    `siteId`      VARCHAR(64)   NOT NULL,
    `name`        VARCHAR(191)  NOT NULL,
    `triggerType` VARCHAR(64)   NOT NULL,
    `actionGraph` JSON          NOT NULL,
    `status`      VARCHAR(32)   NOT NULL DEFAULT 'draft',
    `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3)   NOT NULL,

    INDEX `automations_siteId_idx`(`siteId`),
    INDEX `automations_siteId_status_idx`(`siteId`, `status`),
    INDEX `automations_triggerType_idx`(`triggerType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: automations → editor_websites
ALTER TABLE `automations`
    ADD CONSTRAINT `automations_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: automation_executions
CREATE TABLE IF NOT EXISTS `automation_executions` (
    `id`           VARCHAR(191)  NOT NULL,
    `siteId`       VARCHAR(64)   NOT NULL,
    `automationId` VARCHAR(191)  NOT NULL,
    `triggerType`  VARCHAR(64)   NOT NULL,
    `payload`      JSON          NULL,
    `result`       VARCHAR(32)   NOT NULL,
    `error`        TEXT          NULL,
    `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `automation_executions_siteId_idx`(`siteId`),
    INDEX `automation_executions_automationId_idx`(`automationId`),
    INDEX `automation_executions_siteId_createdAt_idx`(`siteId`, `createdAt`),
    INDEX `automation_executions_result_idx`(`result`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: automation_executions → automations
ALTER TABLE `automation_executions`
    ADD CONSTRAINT `automation_executions_automationId_fkey`
    FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
