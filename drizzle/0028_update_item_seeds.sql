-- Custom SQL migration file, put you code below! --

-- Dumping data for table hatchery.items: ~25 rows (approximately)
INSERT INTO `items` (`id`, `name`, `url`, `category`, `available_from`, `available_to`, `description`, `cost`, `artist`) VALUES
	(1, 'Anthurium', 'anthurium.webp', 'flair', NULL, NULL, 'The "flower" on an Anthurium is actually a spathe. The name comes from Greek origins, meaning "flower tail."', 150, '04uni'),
	(2, 'Blackrose', 'blackrose.webp', 'flair', NULL, NULL, 'Black roses don\'t exist... so just how did Matthias obtain them?', 300, 'Arcy'),
	(3, 'Broccoli', 'broccoli.webp', 'flair', NULL, NULL, 'Use it as decoration, or as part of a tasty meal.', NULL, 'Arcy'),
	(4, 'Dragongrass', 'dragongrass.webp', 'flair', NULL, NULL, 'A favourite among dragons.', 175, 'Arcy'),
	(5, 'Hibiscus', 'hibiscus.webp', 'flair', NULL, NULL, 'For tea lovers, Hibiscus has a great lemon-y taste. For nerds, it\'s used as a pH indicator.', 50, 'Arcy'),
	(6, 'Hyacinth', 'hyacinth.webp', 'flair', NULL, NULL, 'Blue Hyacinth flowers signify sincerity. Sincerity for avid dragon clicking.', 50, 'Arcy'),
	(7, 'Lily', 'lily.webp', 'flair', NULL, NULL, 'A favourite among bouquet arrangements, but probably not something to keep near your Chaliuba Dragon.', 75, 'Arcy'),
	(8, 'Rafflesia', 'rafflesia.webp', 'flair', NULL, NULL, '', NULL, 'Arcy'),
	(9, 'Saxifrage', 'saxifrage.webp', 'flair', NULL, NULL, 'There\'s over 400 species of Saxifrage, imagine if they were all available in the garden?', 50, 'Mu-Cephei'),
	(10, 'Sunflower', 'sunflower.webp', 'flair', NULL, NULL, 'A huge sunflower containing hundreds of seeds. Useful even after it wilts.', 75, 'Arcy'),
	(11, 'Dandelion', 'dandelion.webp', 'flair', NULL, NULL, 'Wish upon a st&mdash; dandelion.', 50, '04uni'),
	(12, 'Sakura', 'sakura.webp', 'flair', NULL, NULL, 'Due to Garden Magic&trade;, this Sakura is available at all times of the year.', 50, '04uni'),
	(13, 'Black Calla Lily', 'black-calla-lily.webp', 'flair', NULL, NULL, '<span class="italic">Calla, calla, calla, calla calla chameleon... You click and go... &#9835;</span>', 400, '04uni'),
	(14, 'Witch Hazel', 'witch-hazel.webp', 'flair', '2024-10-01 00:00:00', '2024-11-07 00:00:00', 'Witch Hazel was once used to divine water and gold. Perhaps cave dragons would be interested.', 75, '04uni'),
	(15, 'Bird of Paradise', 'bird-of-paradise.webp', 'flair', NULL, NULL, 'Is it a bird? Is it a plane? No, it\'s a flower.', 125, '04uni'),
	(16, 'Pumpkin', 'pumpkin.webp', 'flar', '2024-10-01 00:00:00', '2024-11-07 00:00:00', 'Orange pumpkins contain carotene, even though they obviously aren\'t carrots.', 75, 'Arcy'),
	(17, 'Pumpkin (white)', 'pumpkin-white.webp', 'flair', '2024-10-01 00:00:00', '2024-11-07 00:00:00', 'The weight of this pumpkin might drag your leaderboard score down.', 75, 'Arcy'),
	(18, 'Glowshroom', 'glowshroom.webp', 'flar', '2024-10-01 00:00:00', '2024-11-07 00:00:00', 'Unsafe for consumption as determined by the Food Standards Agency.', 100, 'Arcy'),
	(19, 'Reimu Myrtle', 'reimu-myrtle.webp', 'flair', NULL, NULL, '<q class="italic">Aah! The cat turned into a cat!</q>', 500, '04uni'),
	(20, 'Gracidea', 'gracidea.webp', 'flair', NULL, NULL, 'A flower commonly used to express gratitude.', 500, '04uni'),
	(21, 'Forget-me-not', 'forget-me-not.webp', 'flair', NULL, NULL, 'There was something to remember but you can\'t recall.', 125, 'inghelene'),
	(22, 'Glaze Lily', 'glaze-lily.webp', 'flair', NULL, NULL, '<q class="italic">Taking a moment to slow down and enjoy the finer things in life is always beneficial to your body and soul.</q>', 500, '04uni'),
	(23, 'Lupin', 'lupin.webp', 'flair', NULL, NULL, 'You\'re driving me around the lupin.', 150, 'inghelene'),
	(24, 'Buddleia', 'buddleia.webp', 'flair', NULL, NULL, 'I can\'t believe it\'s not butter-fly.', 150, 'inghelene'),
	(25, 'Violet', 'violet.webp', 'flair', NULL, NULL, 'A popular flower, violets symbolise innocence, modesty and everlasting love.', 250, '04uni');

