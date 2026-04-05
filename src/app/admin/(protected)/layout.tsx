import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/adminAuth";
import { AdminLogoutButton } from "../AdminLogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!verifyAdminSession(token)) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex gap-4">
            <Link href="/admin/bookings">Bookings</Link>
            <Link href="/admin/availability">Availability</Link>
          </div>
          <AdminLogoutButton />
        </header>

        {children}
      </div>
    </main>
  );
}
