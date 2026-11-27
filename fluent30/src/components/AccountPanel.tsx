"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { deleteRemoteData, syncNow } from "@/lib/sync";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, Panel, Segmented, toast } from "./ui";

/** Supabase authentication (email + password or magic link), sync and cloud data deletion. */
export function AccountPanel() {
  const t = useT();
  const s = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured()) {
    return (
      <Panel>
        <h2 className="font-semibold">{t("Compte et synchronisation", "Account & sync")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("Mode local : tout est enregistré sur cet appareil et fonctionne hors connexion. La création de compte et la synchronisation entre appareils ne sont pas encore activées sur cette version. En attendant, utilise l'export ci-dessous pour faire une sauvegarde.", "Local mode: everything is saved on this device. Accounts and sync are not enabled yet; use the export below to back up.")}
        </p>
      </Panel>
    );
  }

  const sb = supabase()!;
  const submit = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "magic") {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/settings" } });
        if (error) throw error;
        setInfo(t("Lien de connexion envoyé. Vérifiez votre boîte mail.", "Login link sent. Check your inbox."));
      } else if (mode === "signup") {
        const { error, data } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + "/settings" } });
        if (error) throw error;
        setInfo(data.session ? t("Compte créé ✓", "Account created ✓") : t("Compte créé. Confirmez votre adresse via l'e-mail reçu.", "Account created. Confirm your email."));
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await doSync();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doSync = async () => {
    setBusy(true);
    try {
      const r = await syncNow();
      if (!r.skipped) {
        await saveSettings({ lastSyncAt: r.at });
        toast(t(`Synchronisé (${r.pushed} envoyés, ${r.pulled} reçus)`, `Synced (${r.pushed} sent, ${r.pulled} received)`));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <h2 className="mb-2 font-semibold">{t("Compte et synchronisation", "Account & sync")}</h2>
      {user ? (
        <>
          <p className="text-sm">{t("Connecté :", "Signed in:")} <span className="font-medium">{user.email}</span></p>
          <p className="text-xs text-muted">{s.lastSyncAt ? t(`Dernière synchronisation : ${new Date(s.lastSyncAt).toLocaleString()}`, `Last sync: ${new Date(s.lastSyncAt).toLocaleString()}`) : t("Pas encore synchronisé", "Not synced yet")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={doSync} loading={busy}>{t("Synchroniser maintenant", "Sync now")}</Button>
            <Button size="sm" variant="outline" onClick={() => sb.auth.signOut()}>{t("Se déconnecter", "Sign out")}</Button>
            <Button size="sm" variant="danger" onClick={async () => { if (confirm(t("Supprimer toutes vos données stockées dans le cloud ? Les données de cet appareil sont conservées.", "Delete all your cloud data?"))) { await deleteRemoteData(); toast(t("Données cloud supprimées", "Cloud data deleted")); } }}>{t("Supprimer mes données cloud", "Delete cloud data")}</Button>
          </div>
        </>
      ) : (
        <>
          <Segmented className="mb-3" value={mode} onChange={setMode} options={[{ value: "signin", label: t("Connexion", "Sign in") }, { value: "signup", label: t("Créer un compte", "Sign up") }, { value: "magic", label: t("Lien magique", "Magic link") }]} />
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.fr" autoComplete="email" className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />
            {mode !== "magic" && <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("Mot de passe (8 caractères min.)", "Password (min 8 chars)")} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 outline-none focus:border-ink-400" />}
            <Button type="submit" loading={busy}>{mode === "signin" ? t("Se connecter", "Sign in") : mode === "signup" ? t("Créer mon compte", "Create account") : t("Recevoir le lien", "Send link")}</Button>
          </form>
          <p className="mt-2 text-xs text-muted">{t("Vos données locales seront envoyées dans votre compte à la première synchronisation.", "Local data is uploaded on first sync.")}</p>
        </>
      )}
      <div className="mt-2 space-y-2">
        <ErrorNote>{error}</ErrorNote>
        {info && <p className="text-sm text-mint-600">{info}</p>}
      </div>
    </Panel>
  );
}
