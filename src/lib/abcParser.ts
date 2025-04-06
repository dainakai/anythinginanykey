// import abcjs from 'abcjs'; // Direct import removed
// import type { TuneBook as TuneBookType } from 'abcjs'; // Import type only

export interface AbcHeader {
  index?: string;       // X:
  title?: string;       // T:
  meter?: string;       // M:
  noteLength?: string;  // L:
  key?: string;         // K:
}

export interface ParsedAbc {
  header: AbcHeader;
  body: string; // The main melody part
  fullNotation: string; // The original full notation
}

/**
 * Parses an ABC notation string to extract basic header information (X, T, M, L, K)
 * using regular expressions, without relying on the abcjs library.
 */
export const parseAbcNotation = (abcString: string): ParsedAbc | null => {
  if (!abcString) {
    return null;
  }

  const header: AbcHeader = {};
  const lines = abcString.split('\n');

  // Regex to match basic headers at the beginning of a line
  const headerRegex = /^([XHTMLK]):\s*(.*)$/;
  let bodyStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(headerRegex);

    if (match) {
      const key = match[1];
      const value = match[2].trim();

      switch (key) {
        case 'X':
          header.index = value;
          break;
        case 'T':
          header.title = value;
          break;
        case 'M':
          header.meter = value;
          break;
        case 'L':
          header.noteLength = value;
          break;
        case 'K':
          header.key = value;
          break;
        // Add cases for H if needed later
      }
    } else if (line.length > 0 && !line.startsWith('%')) {
      // Assume the first non-empty, non-comment, non-header line marks the start of the body
      // This is a simplification and might not cover all edge cases.
      bodyStartIndex = i;
      break; // Stop processing headers once body seems to start
    }
  }

  // Extract the body (simplistic approach: everything from the detected start index)
  const body = bodyStartIndex !== -1 ? lines.slice(bodyStartIndex).join('\n') : abcString;

  return {
    header,
    body: body, // Consider potential inaccuracies of this simple body extraction
    fullNotation: abcString,
  };
};
