-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'CLIENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(64) NOT NULL DEFAULT '',
    `servicio` VARCHAR(128) NOT NULL DEFAULT '',
    `presupuesto` VARCHAR(128) NOT NULL DEFAULT '',
    `mensaje` TEXT NOT NULL,
    `archivo` VARCHAR(255) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contacts_email_idx`(`email`),
    INDEX `contacts_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `priceMonthMxn` INTEGER NOT NULL,
    `priceYearMxn` INTEGER NOT NULL,
    `mpPlanIdMonth` VARCHAR(128) NULL,
    `mpPlanIdYear` VARCHAR(128) NULL,
    `stripePriceIdMonth` VARCHAR(128) NULL,
    `stripePriceIdYear` VARCHAR(128) NULL,
    `maxWebsites` INTEGER NOT NULL,
    `maxVisits` INTEGER NOT NULL,
    `hasEcommerce` BOOLEAN NOT NULL DEFAULT false,
    `hasAI` BOOLEAN NOT NULL DEFAULT true,
    `hasExport` BOOLEAN NOT NULL DEFAULT false,
    `features` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(64) NOT NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'mercadopago',
    `mpSubscriptionId` VARCHAR(191) NULL,
    `mpPayerId` VARCHAR(128) NULL,
    `stripeSubscriptionId` VARCHAR(191) NULL,
    `stripeCustomerId` VARCHAR(191) NULL,
    `interval` VARCHAR(16) NOT NULL DEFAULT 'month',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `currentPeriodEnd` DATETIME(3) NULL,
    `canceledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_userId_key`(`userId`),
    UNIQUE INDEX `subscriptions_mpSubscriptionId_key`(`mpSubscriptionId`),
    UNIQUE INDEX `subscriptions_stripeSubscriptionId_key`(`stripeSubscriptionId`),
    INDEX `subscriptions_userId_idx`(`userId`),
    INDEX `subscriptions_planId_idx`(`planId`),
    INDEX `subscriptions_provider_idx`(`provider`),
    INDEX `subscriptions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'received',
    `error` TEXT NULL,
    `payload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `webhook_events_provider_idx`(`provider`),
    INDEX `webhook_events_eventId_idx`(`eventId`),
    INDEX `webhook_events_resourceId_idx`(`resourceId`),
    INDEX `webhook_events_status_idx`(`status`),
    INDEX `webhook_events_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `editor_websites` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(1024) NOT NULL DEFAULT '',
    `tree` JSON NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `editor_websites_userId_idx`(`userId`),
    INDEX `editor_websites_published_idx`(`published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(1024) NOT NULL DEFAULT '',
    `type` VARCHAR(32) NOT NULL DEFAULT 'physical',
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `media` JSON NOT NULL,
    `metadata` JSON NOT NULL,
    `mpProductId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_siteId_idx`(`siteId`),
    INDEX `products_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(128) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priceMxn` INTEGER NOT NULL,
    `comparePriceMxn` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `attributes` JSON NOT NULL,
    `mpPriceId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_variants_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `items` JSON NOT NULL,
    `totalMxn` INTEGER NOT NULL,
    `mpPaymentId` VARCHAR(128) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `orders_siteId_idx`(`siteId`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_customerEmail_idx`(`customerEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collections` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `fields` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `collections_siteId_idx`(`siteId`),
    UNIQUE INDEX `collections_siteId_slug_key`(`siteId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `records` (
    `id` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `records_collectionId_idx`(`collectionId`),
    INDEX `records_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
