import type { Program } from "./types";
import demoProgram from "@/data/programs/demo-program.json";

// To add a program: put a JSON file in /data/programs and add it to this list.
export const programs = [demoProgram] as Program[];

export function getProgram(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}
