UPDATE `items` SET release_date = "2025-08-31 00:00:00" WHERE id = 68;--> statement-breakpoint
UPDATE `items` SET release_date = "2025-07-31 00:00:00" WHERE id = 66;--> statement-breakpoint
UPDATE `items` SET release_date = "2025-06-30 00:00:00" WHERE id = 64;--> statement-breakpoint
UPDATE `items` SET release_date = "2025-05-31 00:00:00" WHERE id = 62;--> statement-breakpoint  
UPDATE `items` SET release_date = "2025-04-30 00:00:00" WHERE id = 60;--> statement-breakpoint  
UPDATE `items` SET release_date = "2025-03-31 00:00:00" WHERE id = 57;--> statement-breakpoint  
UPDATE `items` SET release_date = "2025-01-26 00:00:00" WHERE id = 52;--> statement-breakpoint  
UPDATE `items` SET release_date = "2025-01-26 00:00:00" WHERE id = 52;--> statement-breakpoint  
UPDATE `items` SET release_date = "2024-11-05 00:00:00" WHERE id = 24;--> statement-breakpoint  
UPDATE `items` SET release_date = "2024-11-05 00:00:00" WHERE id = 25;--> statement-breakpoint  
UPDATE `items` SET release_date = "2024-10-23 00:00:00" WHERE id = 22;--> statement-breakpoint  
UPDATE `items` SET release_date = "2024-10-23 00:00:00" WHERE id = 23;--> statement-breakpoint  
UPDATE `items` SET release_date = "2024-10-20 00:00:00" WHERE id < 23;--> statement-breakpoint  

UPDATE `items` SET release_date = "2025-01-01 00:00:00" WHERE id = 50;--> statement-breakpoint  

UPDATE `items` SET release_date = "2024-12-08 00:00:00" WHERE id BETWEEN 31 AND 40;--> statement-breakpoint 

UPDATE `items`
SET `release_date` = `available_from`
WHERE `available_from` IS NOT NULL;--> statement-breakpoint

UPDATE `items` 
SET `days_available` = DATEDIFF(`available_to`, `available_from`)
WHERE `available_from` IS NOT NULL AND `available_to` IS NOT NULL;