// server/cron/job.ts
import { defineCronHandler } from "#nuxt/cron";
import { cleanUp } from "../clean-up";

export default defineCronHandler("everyFiveMinutes", () => {
  cleanUp();
});
