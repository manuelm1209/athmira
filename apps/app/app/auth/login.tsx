import { SeoHead } from "@/components/SeoHead";
import { AuthForm } from "@/features/auth/AuthForm";

export default function LoginRoute() {
  return (
    <>
      <SeoHead
        canonicalPath="/auth/login"
        description="Acceso privado a athmira para ciclistas y deportistas de endurance."
        noindex
        title="Iniciar sesión | athmira"
      />
      <AuthForm mode="login" />
    </>
  );
}
