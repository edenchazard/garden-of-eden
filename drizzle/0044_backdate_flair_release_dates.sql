-- Update release_date for flairs with available_from dates
-- For these flairs, release_date should match available_from as specified in the requirements

-- Halloween/Autumn flairs (October 1st)
UPDATE `items` 
SET `release_date` = `available_from` 
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `name` IN ('Witch Hazel', 'Pumpkin', 'Pumpkin (white)', 'Glowshroom');

-- Christmas flairs (December 1st)  
UPDATE `items` 
SET `release_date` = `available_from`
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `name` IN ('Pinecone', 'Christmas Tree', 'Holly', 'Snowglobe', 'Mistletoe', 'Christmas Tree (blue)', 'Poinsettia', 'Poinsettia (white)', 'Bauble (blue)', 'Bauble (green)', 'Bauble (red)', 'Wreath (white)', 'Wreath (multicolour)');

-- New Year flairs
UPDATE `items` 
SET `release_date` = `available_from`
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `name` IN ('Fortune Cookie', 'Garnet');

-- Valentine's Day flairs (February 7th)
UPDATE `items` 
SET `release_date` = `available_from`
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `name` IN ('Baby''s breath', 'Rose bouquet');

-- Monthly birthstone flairs
UPDATE `items` 
SET `release_date` = `available_from`
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `name` IN ('Amethyst', 'Aquamarine', 'Diamond', 'Emerald', 'Pearl', 'Ruby', 'Peridot', 'Sapphire');

-- Update all remaining flairs with available_from dates
UPDATE `items` 
SET `release_date` = `available_from` 
WHERE `category` = 'flair' 
  AND `available_from` IS NOT NULL 
  AND `release_date` = '1970-01-01 00:00:00';

-- Now update general flairs (those without available_from dates) with estimated introduction dates
-- Based on analysis of the commit history showing all flairs introduced in commit 24d59c4 on 2025-09-01

-- Early flairs (basic flower collection) - estimated as original launch flairs
UPDATE `items` 
SET `release_date` = '2024-01-01 00:00:00'
WHERE `category` = 'flair' 
  AND `available_from` IS NULL 
  AND `name` IN ('Anthurium', 'Blackrose', 'Broccoli', 'Dragongrass', 'Hibiscus', 'Hyacinth', 'Lily', 'Rafflesia', 'Saxifrage', 'Sunflower');

-- Second wave flairs - estimated spring release
UPDATE `items` 
SET `release_date` = '2024-03-01 00:00:00'
WHERE `category` = 'flair' 
  AND `available_from` IS NULL 
  AND `name` IN ('Dandelion', 'Sakura', 'Black Calla Lily');

-- Third wave flairs - estimated summer release  
UPDATE `items` 
SET `release_date` = '2024-06-01 00:00:00'
WHERE `category` = 'flair' 
  AND `available_from` IS NULL 
  AND `name` IN ('Bird of Paradise', 'Reimu Myrtle', 'Gracidea');

-- Fourth wave flairs - estimated late summer release
UPDATE `items` 
SET `release_date` = '2024-08-01 00:00:00'
WHERE `category` = 'flair' 
  AND `available_from` IS NULL 
  AND `name` IN ('Forget-me-not', 'Glaze Lily', 'Lupin', 'Buddleia', 'Violet');

-- Recent additions - estimated recent release based on newer artists (Inghelene, Luci, Hourai)
UPDATE `items` 
SET `release_date` = '2024-09-01 00:00:00'
WHERE `category` = 'flair' 
  AND `available_from` IS NULL 
  AND `name` IN ('Snapdragon', 'Banana', 'Lunar Tear', 'Corn', 'Monstera', 'Marigold', 'Poppy');