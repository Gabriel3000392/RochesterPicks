import Link from "next/link";
import { loginAction } from "@/app/actions";
import { Flash } from "@/components/Flash";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Flash success={params.success} error={params.error} />
      <div className="panel p-5">
        <h1 className="text-2xl font-bold text-white">Login</h1>
        <p className="mt-2 text-sm text-slate-400">Use your private account to manage credit predictions.</p>
        <form action={loginAction} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input mt-1" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input mt-1" id="password" name="password" type="password" required />
          </div>
          <button className="btn btn-primary w-full" type="submit">
            Login
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Need an account?{" "}
          <Link href="/register" className="text-emerald-300 hover:text-emerald-200">
            Register with an invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
