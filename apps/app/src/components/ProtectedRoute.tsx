import { Body, Screen } from "@athmira/ui";
import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { useAuth } from "@/providers/AuthProvider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <Screen centered>
        <Body>Loading...</Body>
      </Screen>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return children;
}
