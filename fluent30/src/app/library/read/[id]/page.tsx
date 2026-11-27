"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Reader } from "@/components/reader/Reader";
import { ensureGradedBook } from "@/lib/books";
import { GRADED_STORIES } from "@/lib/data/stories";

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const story = id.startsWith("graded:") ? GRADED_STORIES.find((s) => `graded:${s.id}` === id) : undefined;
  const [ready, setReady] = useState(!story);
  // Built-in stories are materialised on first open (e.g. from a shared link or a fresh device).
  useEffect(() => {
    if (story) void ensureGradedBook(story).then(() => setReady(true));
  }, [story]);
  if (!ready) return null;
  return <Reader key={id} bookId={id} />;
}
