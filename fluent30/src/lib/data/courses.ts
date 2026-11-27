// "Cours" — readable lessons on the rules of spoken English (original content for Fluent30).
import { COURSES_1 } from "./courses-1";
import { COURSES_2 } from "./courses-2";
export * from "./courses-types";

export const COURSES = [...COURSES_1, ...COURSES_2];

export function getCourse(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}
