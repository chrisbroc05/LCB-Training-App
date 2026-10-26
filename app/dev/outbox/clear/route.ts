import { redirect } from "next/navigation";
import { clearDevOutbox } from "@/lib/dev-outbox-server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  clearDevOutbox();
  redirect("/dev/outbox");
}
