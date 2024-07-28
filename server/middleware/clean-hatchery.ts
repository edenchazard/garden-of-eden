import { cache } from "~/utils";
import { cleanUp } from "../clean-up";

export default defineEventHandler(async (event) => {
  await cache("last-clean", 1000 * 60 * 5, async () => {
    await cleanUp();
    return null;
  });
});
