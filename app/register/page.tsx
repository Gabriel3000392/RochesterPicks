import Link from "next/link";
import { registerAction } from "@/app/actions";
import { Flash } from "@/components/Flash";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Flash success={params.success} error={params.error} />
      <div className="panel p-5">
        <h1 className="text-2xl font-bold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Registration is invite-only and uses credits only.</p>
        <form action={registerAction} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input className="input mt-1" id="name" name="name" required />
          </div>
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
            <input className="input mt-1" id="password" name="password" type="password" required minLength={8} />
          </div>
          <div>
            <label className="label" htmlFor="inviteCode">
              Invite code
            </label>
            <input className="input mt-1" id="inviteCode" name="inviteCode" required />
          </div>
          <button className="btn btn-primary w-full" type="submit">
            Register
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
