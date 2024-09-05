import { z } from 'zod';

export default z.object({
  gardenFrequency: z.coerce.number().default(30),
  gardenPerPage: z.coerce.number().min(10).default(100),
  seedTrayFrequency: z.coerce.number().default(30),
  seedTrayPerPage: z.coerce.number().min(10).default(100),
  sort: z
    .union([z.literal('Youngest First'), z.literal('Oldest First')])
    .default('Youngest First'),
  hatchlingMinAge: z.coerce.number().max(72).min(0).default(0),
  eggMinAge: z.coerce.number().max(72).min(0).default(0),
  showScrollRatio: z.coerce.boolean().default(true),
  autoSeedTray: z.coerce.boolean().default(true),
});
