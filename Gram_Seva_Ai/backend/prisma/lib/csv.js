/**
 * Minimal RFC4180-ish CSV parser — no new dependency for one 39-row file.
 * Handles quoted fields, embedded commas inside quotes, and "" as an
 * escaped quote. Does not handle embedded newlines inside quoted fields
 * (not present in prisma/data/schemes.csv).
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const [headerLine, ...rowLines] = lines;
  const headers = parseLine(headerLine);

  return rowLines.map((line) => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row;
  });
}

function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

module.exports = { parseCsv };
