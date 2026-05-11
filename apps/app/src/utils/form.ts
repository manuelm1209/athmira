export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function numberToInput(value?: number | null): string {
  return value == null ? "" : String(value);
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  return error instanceof Error ? error.message : fallback;
}
