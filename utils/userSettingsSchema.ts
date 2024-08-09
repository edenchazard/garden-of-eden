import { z } from "zod";

export default z.object({
  frequency: z.coerce.string(),
  perPage: z.coerce.number().min(10),
  sort: z.union([z.literal("Youngest First"), z.literal("Oldest First")]),
  hatchlingMinAge: z.coerce.number().max(72).min(0),
  eggMinAge: z.coerce.number().max(72).min(0),
  showScrollRatio: z.coerce.boolean(),
});
