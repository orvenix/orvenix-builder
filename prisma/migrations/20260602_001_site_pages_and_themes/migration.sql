-- Builder multipage support: site_pages and site_themes
-- Applied after baseline 20260524_000000_baseline
-- Run via: npm run prisma:deploy-schema

-- CreateTable: site_pages
CREATE TABLE IF NOT EXISTS `site_pages` (
    `id`        VARCHAR(191) NOT NULL,
    `siteId`    VARCHAR(64)  NOT NULL,
    `name`      VARCHAR(191) NOT NULL,
    `slug`      VARCHAR(191) NOT NULL,
    `tree`      JSON         NOT NULL,
    `seo`       JSON         NULL,
    `isHome`    BOOLEAN      NOT NULL DEFAULT false,
    `published` BOOLEAN      NOT NULL DEFAULT false,
    `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)  NOT NULL,

    UNIQUE INDEX `site_pages_siteId_slug_key`(`siteId`, `slug`),
    INDEX `site_pages_siteId_idx`(`siteId`),
    INDEX `site_pages_siteId_published_idx`(`siteId`, `published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: site_pages -> editor_websites
ALTER TABLE `site_pages`
    ADD CONSTRAINT `site_pages_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: site_themes
CREATE TABLE IF NOT EXISTS `site_themes` (
    `id`        VARCHAR(191) NOT NULL,
    `siteId`    VARCHAR(64)  NOT NULL,
    `tokens`    JSON         NOT NULL,
    `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3)  NOT NULL,

    UNIQUE INDEX `site_themes_siteId_key`(`siteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: site_themes -> editor_websites
ALTER TABLE `site_themes`
    ADD CONSTRAINT `site_themes_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `editor_websites`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
