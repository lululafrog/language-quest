import { redirect } from "next/navigation";

// The daily session now lives on the home screen ("Ton programme du jour").
export default function SessionPage() {
  redirect("/");
}
