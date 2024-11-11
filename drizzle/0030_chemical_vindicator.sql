ALTER TABLE `banner_jobs` ADD `dragons_included` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `dragons_omitted` json DEFAULT ('[]') NOT NULL;