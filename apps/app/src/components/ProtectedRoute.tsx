import { Body, Screen } from "@athmira/ui";
import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { useAuth } from "@/providers/AuthProvider";

type ProtectedRouteProps = PropsWithChildren<{
  requireAdmin?: boolean;
}>;

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { adminLoading, isAdmin, loading, session } = useAuth();

  if (loading || (requireAdmin && adminLoading)) {
    return (
      <Screen centered>
        <Body>Loading...</Body>
      </Screen>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Redirect href="/dashboard" />;
  }

  return children;
}
