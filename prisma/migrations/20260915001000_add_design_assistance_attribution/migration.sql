-- Add site creation attempt reference to DesignGeneration
ALTER TABLE `design_generations` ADD COLUMN `siteCreationAttemptId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `design_generations_siteCreationAttemptId_key` ON `design_generations`(`siteCreationAttemptId`);

-- CreateTable
CREATE TABLE `design_assistances` (
    `id` VARCHAR(191) NOT NULL,
    `siteCreationAttemptId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `roleKey` VARCHAR(64) NOT NULL,
    `strategyKey` VARCHAR(64) NOT NULL,
    `providerKey` VARCHAR(64) NOT NULL,
    `modelKey` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `inputFingerprint` VARCHAR(64) NOT NULL,
    `attemptKey` VARCHAR(96) NOT NULL,
    `outputFingerprint` VARCHAR(64) NULL,
    `appliedProposal` JSON NULL,
    `failureCode` VARCHAR(32) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `design_assistances_siteCreationAttemptId_idx`(`siteCreationAttemptId`),
    INDEX `design_assistances_siteCreationAttemptId_attemptKey_idx`(`siteCreationAttemptId`, `attemptKey`),
    INDEX `design_assistances_strategyKey_providerKey_modelKey_status_idx`(`strategyKey`, `providerKey`, `modelKey`, `status`),
    INDEX `design_assistances_inputFingerprint_idx`(`inputFingerprint`),
    INDEX `design_assistances_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
