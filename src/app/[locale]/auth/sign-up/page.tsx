import { SignUpForm } from "@/features/auth/sign-up-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const session = await getSession();
  if (session?.user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <SignUpForm />
    </div>
  );
}
