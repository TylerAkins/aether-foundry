import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Aether Foundry
        </Link>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
