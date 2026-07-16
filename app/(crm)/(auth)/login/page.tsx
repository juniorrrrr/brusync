import type { Metadata } from "next";
import { LoginForm } from "@/components/crm/LoginForm";

export const metadata: Metadata = {
  title: "Login — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") ? next : "/dashboard";

  return (
    <div className="crm-login-page">
      <div className="crm-login-card">
        <div className="crm-login-brand">
          <span className="crm-sidebar-brand-dot" />
          <span className="crm-login-brand-word">
            Brusync <i>OS</i>
          </span>
        </div>

        <h1 className="crm-login-title">Acesse sua conta</h1>
        <p className="crm-login-sub">Entre com suas credenciais para continuar.</p>

        <LoginForm next={safeNext} />
      </div>
    </div>
  );
}
