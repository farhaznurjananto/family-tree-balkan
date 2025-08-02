import { redirect } from "next/navigation";

export default function Home() {
  redirect("/view");
  return null;
}
