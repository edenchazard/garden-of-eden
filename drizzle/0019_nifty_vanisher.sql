ALTER TABLE `purchases` MODIFY COLUMN `purchased_on` datetime NOT NULL DEFAULT NOW();--> statement-breakpoint
ALTER TABLE `users` ADD `access_token` varchar(32);