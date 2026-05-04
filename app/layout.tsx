import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rochester Picks",
  description: "Private credit sports prediction markets for friends."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63_0,#0b1020_34rem)]">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/markets" className="flex items-center gap-2 font-bold text-slate-50">
                <Trophy className="h-5 w-5 text-emerald-400" aria-hidden />
                <span>Rochester Picks</span>
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                {user ? (
                  <>
                    <Link className="rounded-md px-2 py-1 text-slate-300 hover:text-white" href="/markets">
                      Markets
                    </Link>
                    <Link className="rounded-md px-2 py-1 text-slate-300 hover:text-white" href="/leaderboard">
                      Leaderboard
                    </Link>
                    {user.role === "ADMIN" ? (
                      <Link className="rounded-md px-2 py-1 text-slate-300 hover:text-white" href="/admin">
                        Admin
                      </Link>
                    ) : null}
                    <div className="hidden rounded-md border border-slate-800 px-2 py-1 text-slate-300 sm:block">
                      {user.balance} pts
                    </div>
                    <form action={logoutAction}>
                      <button className="btn btn-secondary py-1" type="submit">
                        Log out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link className="rounded-md px-2 py-1 text-slate-300 hover:text-white" href="/login">
                      Login
                    </Link>
                    <Link className="btn btn-primary py-1" href="/register">
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
