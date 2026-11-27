"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { dialogueById } from "@/lib/data/dialogues";
import { stopSpeaking } from "@/lib/speech";
import { PageHeader, Segmented, Badge, Panel } from "@/components/ui";
import { Player, AudioControls } from "@/components/listen/Player";
import { Dictation } from "@/components/listen/Dictation";
import { Repeat } from "@/components/listen/Repeat";
import { Quiz } from "@/components/listen/Quiz";
import { useDialogueVoices } from "@/components/listen/voices";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";

type Tab = "listen" | "dictation" | "repeat" | "quiz";

export default function DialoguePage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const d = dialogueById(id);
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("listen");
  const [accentOverride, setAccent] = useState<string | null>(null);
  const [rateOverride, setRate] = useState<number | null>(null);
  const accent = accentOverride ?? settings.accent;
  const rate = rateOverride ?? settings.speechRate;
  const { accents } = useDialogueVoices(accent);


  if (!d) return <PageHeader back="/listen" title={t("Dialogue introuvable", "Dialogue not found")} />;

  const changeAccent = (a: string) => setAccent(a);
  const changeRate = (r: number) => setRate(r);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back="/listen" title={t(d.titleFr, d.title)} subtitle={<span>{t(d.title, d.titleFr)} <Badge className="ml-1">{d.level}</Badge></span>} />
      <Segmented
        className="no-scrollbar mb-4 max-w-full overflow-x-auto"
        value={tab}
        onChange={(v) => { stopSpeaking(); setTab(v); }}
        options={[
          { value: "listen", label: `🎧 ${t("Écouter", "Listen")}` },
          { value: "dictation", label: `✍️ ${t("Dictée", "Dictation")}` },
          { value: "repeat", label: `🎙️ ${t("Répéter", "Repeat")}` },
          { value: "quiz", label: "❓ Quiz" },
        ]}
      />
      {tab === "listen" ? (
        <Player dialogue={d} accent={accent} setAccent={changeAccent} rate={rate} setRate={changeRate} />
      ) : (
        <>
          <Panel className="mb-4"><AudioControls accent={accent} setAccent={changeAccent} rate={rate} setRate={changeRate} accents={accents} /></Panel>
          {tab === "dictation" && <Dictation key={d.id} dialogue={d} accent={accent} rate={rate} />}
          {tab === "repeat" && <Repeat key={d.id} dialogue={d} accent={accent} rate={rate} />}
          {tab === "quiz" && <Quiz key={d.id} dialogue={d} accent={accent} rate={rate} />}
        </>
      )}
    </div>
  );
}
