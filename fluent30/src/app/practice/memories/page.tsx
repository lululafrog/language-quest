"use client";
// Memory Cards — album of personal photos turned into vocabulary.
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { Button, PageHeader, SpeakButton } from "@/components/ui";
import { Icon } from "@/components/icons";
import { NewMemory } from "@/components/memories/NewMemory";
import { MemoryPhoto } from "@/components/memories/MemoryPhoto";

export default function MemoriesPage() {
  const memories = useLiveQuery(() => getDb().memories.orderBy("createdAt").reverse().toArray(), []);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Memory Cards"
        subtitle="Tes souvenirs deviennent du vocabulaire. Les photos restent privées, sur ton appareil."
        back="/practice"
        action={!creating && memories && memories.length > 0 ? <Button size="sm" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Souvenir</Button> : undefined}
      />

      {(creating || memories?.length === 0) && <NewMemory onCancel={() => setCreating(false)} />}

      {memories && memories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[17px] font-semibold tracking-tight">Mon album</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {memories.map((m) => (
              <Link key={m.id} href={`/practice/memories/${m.id}`} className="group overflow-hidden rounded-3xl border border-line/70 bg-surface card-shadow transition hover:border-ink-300">
                <MemoryPhoto memory={m} className="aspect-square w-full transition group-hover:scale-[1.02]" />
                <div className="space-y-0.5 p-3">
                  <p className="truncate text-[15px] font-semibold">{m.title}</p>
                  {m.sentence && (
                    <p className="line-clamp-2 text-[13px] text-muted">
                      {m.sentence}
                    </p>
                  )}
                  <p className="text-[12px] text-muted">{m.words.length} mot{m.words.length > 1 ? "s" : ""}{m.place ? ` · ${m.place}` : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {memories?.length === 0 && !creating && (
        <p className="text-center text-sm text-muted">
          Exemple : une photo de plongée devient <em>sea turtle, coral reef, to dive</em> et « I spotted a sea turtle while diving. »
          <SpeakButton text="I spotted a sea turtle while diving." size={14} className="p-1 align-middle" />
        </p>
      )}
    </div>
  );
}
