ALTER TABLE `editor_websites`
  ADD COLUMN `activeDesignGenerationId` VARCHAR(191) NULL;

CREATE INDEX `editor_websites_activeDesignGenerationId_idx`
  ON `editor_websites`(`activeDesignGenerationId`);
