import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <AuthForm callbackError={searchParams.error === "callback"} mode="signup" />;
}
