export function getLogicalDate(
  utcDate: Date,
  timezone: string,
  dayStartTime: string // e.g., "03:00"
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(utcDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || "00";

  const localYear = parseInt(getPart("year"));
  const localMonth = parseInt(getPart("month"));
  const localDay = parseInt(getPart("day"));
  const localHour = parseInt(getPart("hour"));
  const localMinute = parseInt(getPart("minute"));

  const [startHourStr, startMinStr] = dayStartTime.split(":");
  const startHour = parseInt(startHourStr || "0", 10);
  const startMinute = parseInt(startMinStr || "0", 10);

  // Construir una fecha local sólo para poder restar un día si es necesario
  const localDateObj = new Date(localYear, localMonth - 1, localDay, localHour, localMinute);

  if (localHour < startHour || (localHour === startHour && localMinute < startMinute)) {
    // Aún es el "día lógico" anterior
    localDateObj.setDate(localDateObj.getDate() - 1);
  }

  const logicalYear = localDateObj.getFullYear();
  const logicalMonth = String(localDateObj.getMonth() + 1).padStart(2, "0");
  const logicalDayStr = String(localDateObj.getDate()).padStart(2, "0");

  return `${logicalYear}-${logicalMonth}-${logicalDayStr}`;
}
