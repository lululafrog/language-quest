// Registry of fully written destinations. Every other catalog entry is shown as "à venir".
import type { AtlasDestination } from "../types";
import { UK } from "./uk";
import { ITALY } from "./italy";
import { INDONESIA } from "./indonesia";
import { VIETNAM } from "./vietnam";
import { JAPAN } from "./japan";
import { AUSTRALIA } from "./australia";
import { USA } from "./usa";
import { NEWZEALAND } from "./new-zealand";
import { EGYPT } from "./egypt";
import { SOUTHAFRICA } from "./south-africa";

export const DESTINATIONS_CONTENT: AtlasDestination[] = [UK, INDONESIA, VIETNAM, JAPAN, AUSTRALIA, USA, ITALY, NEWZEALAND, EGYPT, SOUTHAFRICA].filter(
  (d): d is AtlasDestination => !!d,
);

export function getDestinationContent(id: string): AtlasDestination | undefined {
  return DESTINATIONS_CONTENT.find((d) => d.id === id);
}
