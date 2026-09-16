-- CreateTable
CREATE TABLE `design_generations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NULL,
    `request` TEXT NOT NULL,
    `industry` VARCHAR(191) NULL,
    `siteType` VARCHAR(64) NULL,
    `objective` VARCHAR(512) NULL,
    `requestedStyle` VARCHAR(191) NULL,
    `initialPlan` JSON NOT NULL,
    `initialPlanHash` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'generated',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `design_generations_userId_idx`(`userId`),
    INDEX `design_generations_siteId_idx`(`siteId`),
    INDEX `design_generations_industry_idx`(`industry`),
    INDEX `design_generations_siteType_idx`(`siteType`),
    INDEX `design_generations_status_idx`(`status`),
    INDEX `design_generations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
