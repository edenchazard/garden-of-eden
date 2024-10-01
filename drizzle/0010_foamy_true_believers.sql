ALTER TABLE `user_settings` ADD `anonymiseStatistics` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `clicked_on_idx` ON `clicks` (`clicked_on`);