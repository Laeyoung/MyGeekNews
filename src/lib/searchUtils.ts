import { disassemble, getChoseong } from 'es-hangul';

/**
 * Performs a fuzzy search on a string, supporting Korean Chosung search and Jamo search.
 * @param text The text to search within.
 * @param query The search query.
 * @returns True if the query matches the text, false otherwise.
 */
export function fuzzySearch(text: string, query: string): boolean {
    if (!query) return true;
    if (!text) return false;

    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    // 1. Standard inclusion (case-insensitive)
    if (normalizedText.includes(normalizedQuery)) {
        return true;
    }

    // 2. Chosung search (e.g., "ㄱㄴ" matches "가나")
    // Only attempt if query seems to be Chosung-only (or at least contains Chosung)
    // We check if the Chosung of the text includes the query.
    // Note: getChoseong('가나') -> 'ㄱㄴ'.
    const textChoseong = getChoseong(text);
    if (textChoseong.includes(query)) {
        return true;
    }

    // 3. Disassembled Jamo search (e.g., "ㄱㅏ" matches "가")
    // disassemble('가나') -> 'ㄱㅏㄴㅏ'
    // disassemble('ㄱㅏ') -> 'ㄱㅏ'
    const disassembledText = disassemble(text);
    const disassembledQuery = disassemble(query);

    if (disassembledText.includes(disassembledQuery)) {
        return true;
    }

    return false;
}
