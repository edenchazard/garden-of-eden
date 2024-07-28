import { getServerSession } from "next-auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession();

  if (session?.user.role !== "owner") {
    setResponseStatus(event, 401, "Unauthorized");
    return "Unauthorized";
  }
});
