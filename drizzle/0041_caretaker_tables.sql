CREATE TABLE `caretakers` (
  `user_id` mediumint unsigned NOT NULL,
  `owner_id` mediumint unsigned NOT NULL,
  CONSTRAINT `caretakers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `caretakers_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `caretaker_owner_idx` ON `caretakers` (`user_id`, `owner_id`);
--> statement-breakpoint
CREATE INDEX `caretaker_owner_id_idx` ON `caretakers` (`owner_id`);
--> statement-breakpoint
CREATE TABLE `caretaker_audit_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` mediumint unsigned NOT NULL,
  `owner_id` mediumint unsigned NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT (NOW()),
  `dragons` json NOT NULL,
  CONSTRAINT `caretaker_audit_log_pk` PRIMARY KEY (`id`),
  CONSTRAINT `caretaker_audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `caretaker_audit_log_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `caretaker_audit_user_idx` ON `caretaker_audit_log` (`user_id`);
--> statement-breakpoint
CREATE INDEX `caretaker_audit_owner_idx` ON `caretaker_audit_log` (`owner_id`);
