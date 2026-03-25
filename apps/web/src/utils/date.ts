export function getRelativeTimeString(
  date: Date | string,
  locale: "en" | "pt-BR",
): string {
  const timeMs = typeof date === "number" ? date : new Date(date).getTime();
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  const cutoffs = [
    {
      threshold: 60,
      divisor: 1,
      unit: "second" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: 3600,
      divisor: 60,
      unit: "minute" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: 86400,
      divisor: 3600,
      unit: "hour" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: 86400 * 7,
      divisor: 86400,
      unit: "day" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: 86400 * 30,
      divisor: 86400 * 7,
      unit: "week" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: 86400 * 365,
      divisor: 86400 * 30,
      unit: "month" as Intl.RelativeTimeFormatUnit,
    },
    {
      threshold: Infinity,
      divisor: 86400 * 365,
      unit: "year" as Intl.RelativeTimeFormatUnit,
    },
  ];

  const match = cutoffs.find((c) => Math.abs(deltaSeconds) < c.threshold)!;

  // For very small negative deltas (past) up to -1 minute, treat them as 'now' or 'ready'
  if (deltaSeconds <= 0 && deltaSeconds > -60) {
    return locale === "pt-BR" ? "Agora / Pronto" : "Now / Ready";
  }

  // Use Intl.RelativeTimeFormat for formatting
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "long",
  });
  return rtf.format(Math.round(deltaSeconds / match.divisor), match.unit);
}
