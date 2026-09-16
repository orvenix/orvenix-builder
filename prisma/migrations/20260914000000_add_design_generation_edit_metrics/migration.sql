ALTER TABLE `design_generations`
  ADD COLUMN `editMetrics` JSON NULL,
  ADD COLUMN `editDistance` DOUBLE NULL,
  ADD COLUMN `measuredAt` DATETIME(3) NULL;
