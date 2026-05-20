import { Body, Screen } from "@athmira/ui";
import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { useAuth } from "@/providers/AuthProvider";

import { SeoHead } from "./SeoHead";

type ProtectedRouteProps = PropsWithChildren<{
  requireAdmin?: boolean;
}>;

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { adminLoading, isAdmin, loading, session } = useAuth();

  if (loading || (requireAdmin && adminLoading)) {
    return (
      <>
        <SeoHead
          description="Área privada de athmira para atletas autenticados."
          noindex
          title="Área privada | athmira"
        />
        <Screen centered>
          <Body>Loading...</Body>
        </Screen>
      </>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <>
      <SeoHead
        description="Área privada de athmira para atletas autenticados."
        noindex
        title="Área privada | athmira"
      />
      {children}
    </>
  );
}
