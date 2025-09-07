-- Populate release_date and days_available for all existing flairs
UPDATE `items` 
SET 
  `release_date` = '1970-01-01 00:00:00',
  `days_available` = CASE 
    WHEN `available_from` IS NOT NULL AND `available_to` IS NOT NULL 
    THEN DATEDIFF(`available_to`, `available_from`)
    ELSE NULL
  END
WHERE `category` = 'flair';