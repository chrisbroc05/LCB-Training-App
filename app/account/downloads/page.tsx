import { redirect } from "next/navigation";

export default function AccountDownloadsPage() {
  redirect("/resources?tab=mine");
}
