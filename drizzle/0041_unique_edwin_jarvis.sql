CREATE TABLE `caretaker_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`principle_id` mediumint unsigned NOT NULL,
	`caretaker_id` mediumint unsigned NOT NULL,
	`created_at` datetime NOT NULL DEFAULT NOW(),
	`changes` json NOT NULL,
	CONSTRAINT `caretaker_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caretaker_invites` (
	`code` char(36) NOT NULL,
	`principle_id` mediumint unsigned NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `caretaker_invites_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `caretakers` (
	`principle_id` mediumint unsigned NOT NULL,
	`caretaker_id` mediumint unsigned NOT NULL,
	CONSTRAINT `caretaker_principle_idx` UNIQUE(`principle_id`,`caretaker_id`)
);
--> statement-breakpoint
ALTER TABLE `caretaker_audit_log` ADD CONSTRAINT `caretaker_audit_log_principle_id_users_id_fk` FOREIGN KEY (`principle_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretaker_audit_log` ADD CONSTRAINT `caretaker_audit_log_caretaker_id_users_id_fk` FOREIGN KEY (`caretaker_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretaker_invites` ADD CONSTRAINT `caretaker_invites_principle_id_users_id_fk` FOREIGN KEY (`principle_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretakers` ADD CONSTRAINT `caretakers_principle_id_users_id_fk` FOREIGN KEY (`principle_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `caretakers` ADD CONSTRAINT `caretakers_caretaker_id_users_id_fk` FOREIGN KEY (`caretaker_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `caretaker_audit_principle_idx` ON `caretaker_audit_log` (`principle_id`);--> statement-breakpoint
CREATE INDEX `caretaker_audit_caretaker_idx` ON `caretaker_audit_log` (`caretaker_id`);--> statement-breakpoint
CREATE INDEX `caretaker_invite_principle_idx` ON `caretaker_invites` (`principle_id`);--> statement-breakpoint
CREATE INDEX `caretaker_invite_expiry_idx` ON `caretaker_invites` (`expires_at`);--> statement-breakpoint
CREATE INDEX `caretaker_caretaker_id_idx` ON `caretakers` (`caretaker_id`);