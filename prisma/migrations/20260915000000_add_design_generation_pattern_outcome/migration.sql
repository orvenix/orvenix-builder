ALTER TABLE `design_generations`
  ADD COLUMN `patternVersion` INTEGER NULL,
  ADD COLUMN `patternHash` VARCHAR(64) NULL,
  ADD COLUMN `patternKey` JSON NULL,
  ADD COLUMN `outcomeVersion` INTEGER NULL,
  ADD COLUMN `outcomeScore` DOUBLE NULL,
  ADD COLUMN `outcomeQualifiedAt` DATETIME(3) NULL;

CREATE INDEX `design_generations_patternHash_idx`
  ON `design_generations`(`patternHash`);
