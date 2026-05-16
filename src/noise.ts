const DEFAULT_NOISE_COMMANDS = [
  "fg", "bg", "jobs",
  "clear", "cls",
  "pwd", "echo", "true", "false",
] as const;

const DEFAULT_NOISE_PATTERNS = [
  /^%[0-9]/,
  /^fg\s+%/,
  /^bg\s+%/,
] as const;

export interface NoiseConfig {
  noiseExtra: string;
  noisePatterns: string;
}

const noiseCommands: Set<string> = new Set(DEFAULT_NOISE_COMMANDS);
const noisePatterns: RegExp[] = [...DEFAULT_NOISE_PATTERNS];

export function loadNoiseConfig(config: NoiseConfig): void {
  if (config.noiseExtra) {
    for (const entry of config.noiseExtra.split(",")) {
      const trimmed = entry.trim().toLowerCase();
      if (!trimmed) continue;
      if (trimmed.startsWith("-")) {
        noiseCommands.delete(trimmed.slice(1));
      } else {
        noiseCommands.add(trimmed);
      }
    }
  }
  if (config.noisePatterns) {
    for (const entry of config.noisePatterns.split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      try {
        noisePatterns.push(new RegExp(trimmed, "i"));
      } catch {
        /* skip invalid regex */
      }
    }
  }
}

export function resetNoiseConfig(): void {
  noiseCommands.clear();
  noisePatterns.length = 0;
  for (const cmd of DEFAULT_NOISE_COMMANDS) noiseCommands.add(cmd);
  for (const re of DEFAULT_NOISE_PATTERNS) noisePatterns.push(re);
}

export function isNoiseCommand(cmd: string): boolean {
  const trimmed = cmd.trim().toLowerCase();
  if (noiseCommands.has(trimmed)) return true;
  for (const re of noisePatterns) {
    if (re.test(trimmed)) return true;
  }
  return false;
}

export function addNoiseCommand(cmd: string): void {
  noiseCommands.add(cmd.trim().toLowerCase());
}

export function removeNoiseCommand(cmd: string): void {
  noiseCommands.delete(cmd.trim().toLowerCase());
}

export function addNoisePattern(pattern: RegExp): void {
  noisePatterns.push(pattern);
}

export function removeNoisePattern(source: string): boolean {
  const idx = noisePatterns.findIndex((r) => r.source === source);
  if (idx >= 0) {
    noisePatterns.splice(idx, 1);
    return true;
  }
  return false;
}

export function getNoiseCommands(): string[] {
  return [...noiseCommands];
}

export function getNoisePatterns(): string[] {
  return noisePatterns.map((r) => r.source);
}
