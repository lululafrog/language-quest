"use client";
import { useParams } from "next/navigation";
import { Reader } from "@/components/reader/Reader";

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  return <Reader key={id} bookId={id} />;
}
