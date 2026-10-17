/** Strip markdown markers so replies stay plain and readable. */
export function cleanReplyText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/__([^_]+)__/g, "$1") // __bold__
    .replace(/\*([^*]+)\*/g, "$1") // *italic*
    .replace(/_([^_]+)_/g, "$1") // _italic_
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/`([^`]+)`/g, "$1") // `code`
    .replace(/^\s*[-*+]\s+/gm, "• ") // list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
