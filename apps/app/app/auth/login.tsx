import { SeoHead } from "@/components/SeoHead";
import { AuthForm } from "@/features/auth/AuthForm";

export default function LoginRoute() {
  return (
    <>
      <SeoHead
        canonicalPath="/auth/login"
        description="Acceso privado a Athmira para ciclistas y deportistas de endurance."
        noindex
        title="Iniciar sesión | Athmira"
      />
      <AuthForm mode="login" />
    </>
  );
}
