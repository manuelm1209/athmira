import { SeoHead } from "@/components/SeoHead";
import { AuthForm } from "@/features/auth/AuthForm";

export default function SignupRoute() {
  return (
    <>
      <SeoHead
        canonicalPath="/auth/signup"
        description="Crear cuenta privada en athmira para guardar perfiles de bicicletas, análisis e historial de progreso."
        noindex
        title="Crear cuenta | athmira"
      />
      <AuthForm mode="signup" />
    </>
  );
}
