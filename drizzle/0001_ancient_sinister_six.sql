ALTER TABLE `hatchery` RENAME COLUMN `code` TO `id`;--> statement-breakpoint
ALTER TABLE `hatchery` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `hatchery` ADD PRIMARY KEY(`id`);