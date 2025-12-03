export function parseDateRange(rangeStr) {
  // Normalize separators: "to" → "|"
  const cleanStr = rangeStr.replace(/\s*to\s*/i, "|");

  const [startStr, endStr] = cleanStr.split("|");

  return {
    startDate: parseAnyDate(startStr.trim()),
    endDate: parseAnyDate(endStr.trim())
  };
}

function parseAnyDate(str) {
  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str);
  }

  // Format: DD-MMM-YY (e.g. 01-Jan-25)
  if (/^\d{2}-[A-Za-z]{3}-\d{2}$/.test(str)) {
    const [day, mon, year] = str.split("-");
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    return new Date(2000 + Number(year), months[mon], Number(day));
  }

  throw new Error("Unsupported date format: " + str);
}
