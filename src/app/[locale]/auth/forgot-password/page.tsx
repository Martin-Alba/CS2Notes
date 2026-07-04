import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session?.user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <ForgotPasswordForm />
    </div>
  );
}
