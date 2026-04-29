const ANIMAL_NAMES = [
  "Лис",
  "Сокол",
  "Кит",
  "Волк",
  "Сова",
  "Барс",
  "Эхо",
  "Тень",
  "Норд",
  "Кадр",
];

export function randomName(): string {
  const a = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)] ?? "Призрак";
  const n = Math.floor(Math.random() * 99) + 1;
  return `${a}${n}`;
}

export function randomMessageId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function avatarLetter(name: string): string {
  const t = name.trim();
  if (!t) return "G";
  return t.charAt(0).toUpperCase();
}

export function hueFromString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

export function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).catch(() => {});
  }
  return Promise.resolve();
}
