CREATE TABLE `caretaker_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`principal_id` mediumint unsigned NOT NULL,
	`caretaker_id` mediumint unsigned NOT NULL,
	`created_at` datetime NOT NULL DEFAULT NOW(),
	`changes` json NOT NULL,
	CONSTRAINT `caretaker_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caretaker_invites` (
	`code` char(36) NOT NULL,
	`principal_id` mediumint unsigned NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `caretaker_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `caretakers` (
	`principal_id` mediumint unsigned NOT NULL,
	`caretaker_id` mediumint unsigned NOT NULL,
	CONSTRAINT `caretaker_principal_idx` UNIQUE(`principal_id`,`caretaker_id`)
);
--> statement-breakpoint
ALTER TABLE `caretaker_audit_log` ADD CONSTRAINT `caretaker_audit_log_principal_id_users_id_fk` FOREIGN KEY (`principal_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretaker_audit_log` ADD CONSTRAINT `caretaker_audit_log_caretaker_id_users_id_fk` FOREIGN KEY (`caretaker_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretaker_invites` ADD CONSTRAINT `caretaker_invites_principal_id_users_id_fk` FOREIGN KEY (`principal_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretakers` ADD CONSTRAINT `caretakers_principal_id_users_id_fk` FOREIGN KEY (`principal_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretakers` ADD CONSTRAINT `caretakers_caretaker_id_users_id_fk` FOREIGN KEY (`caretaker_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `caretaker_audit_principal_idx` ON `caretaker_audit_log` (`principal_id`);--> statement-breakpoint
CREATE INDEX `caretaker_audit_caretaker_idx` ON `caretaker_audit_log` (`caretaker_id`);--> statement-breakpoint
CREATE INDEX `caretaker_invite_principal_idx` ON `caretaker_invites` (`principal_id`);--> statement-breakpoint
CREATE INDEX `caretaker_invite_expiry_idx` ON `caretaker_invites` (`expires_at`);--> statement-breakpoint
CREATE INDEX `caretaker_caretaker_id_idx` ON `caretakers` (`caretaker_id`);