ALTER TABLE `banner_jobs` RENAME COLUMN `name` TO `flair_name`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `statGenTime` TO `stat_gen_time`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `dragonFetchTime` TO `dragon_fetch_time`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `dragonGenTime` TO `dragon_gen_time`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `frameGenTime` TO `frame_gen_time`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `gifGenTime` TO `gif_gen_time`;--> statement-breakpoint
ALTER TABLE `banner_jobs` RENAME COLUMN `totalTime` TO `total_time`;