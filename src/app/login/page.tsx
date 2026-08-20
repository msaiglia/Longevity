import { LoginCard } from "@/components/login-card";

// Forza il rendering dinamico ad ogni richiesta: questa pagina non deve mai
// essere servita da cache statica/ISR, altrimenti dopo un deploy alcuni nodi
// della rete Vercel potrebbero continuare a mostrare la versione precedente
// per qualche minuto.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginCard />;
}
