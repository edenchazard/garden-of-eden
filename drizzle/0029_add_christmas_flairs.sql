-- Custom SQL migration file, put you code below! --
INSERT INTO `items` (`name`, `url`, `category`, `available_from`, `available_to`, `description`, `cost`, `artist`) VALUES
	('Pinecone', 'pinecone.webp', 'flair', '2024-12-01 00:00:00', '2025-01-07 00:00:00', 'Pining for the perfect Christmas present.', 100, 'Arcy'),
	('Christmas Tree', 'christmas-tree.webp', 'flair', '2024-12-01 00:00:00', '2025-01-07 00:00:00', 'It\'s even smaller than a leetle tree, so does that make this a leetle leetle tree?', 150, 'inghelene'),
	('Holly', 'holly.webp', 'flair', '2024-12-01 00:00:00', '2025-01-07 00:00:00', 'Not all holly is spiky. They adjust their spikes in response to their environment.', 125, 'inghelene');
  