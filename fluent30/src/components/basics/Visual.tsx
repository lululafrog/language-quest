import type { BasicVisual } from "@/lib/data/basics";
import { BodyFigure, ColorSwatch, EmotionFace, ShapeIcon, WeatherIcon } from "./Illustrations";
import { cx } from "@/components/ui";

export function Visual({ v, className }: { v?: BasicVisual; className?: string }) {
  if (!v) return null;
  const c = cx("h-full w-full", className);
  switch (v.kind) {
    case "emotion":
      return <EmotionFace emotion={v.id} className={c} />;
    case "weather":
      return <WeatherIcon weather={v.id} className={c} />;
    case "shape":
      return <ShapeIcon shape={v.id} color={v.color} className={c} />;
    case "color":
      return <ColorSwatch color={v.hex} className={c} />;
    case "body":
      return <BodyFigure part={v.id} className={c} />;
    case "big":
      return (
        <span className={cx("flex h-full w-full items-center justify-center text-center font-black tracking-tight text-ink-700 dark:text-ink-200", v.text.length > 5 ? "text-lg" : v.text.length > 3 ? "text-2xl" : "text-3xl", className)} style={{ fontFamily: "var(--font-display)" }}>
          {v.text}
        </span>
      );
  }
}
