import { UserButton, auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import Navbar from '@/components/navbar';
import { isSuperAdmin } from '@/lib/super-admin';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Being an authenticated (e.g. merchant) Clerk user is not enough.
  if (!isSuperAdmin(userId)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          This account is not the designated Super Admin.
        </p>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};
