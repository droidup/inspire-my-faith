/**
 * Converts [red]...[/red] tags to styled spans for Words of Christ.
 * Also strips outer quotes if present.
 */
export function renderCustomHTML(text: string): React.ReactNode {
  if (!text) return text;
  let cleaned = text;
  if (cleaned.startsWith('""') && cleaned.endsWith('""')) {
    cleaned = cleaned.slice(2, -2);
  } else if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  const parts: React.ReactNode[] = [];
  let remaining = cleaned;
  let key = 0;
  while (remaining) {
    const redOpen = remaining.indexOf('[red]');
    if (redOpen === -1) {
      parts.push(remaining);
      break;
    }
    if (redOpen > 0) {
      parts.push(remaining.slice(0, redOpen));
    }
    remaining = remaining.slice(redOpen + 5);
    const redClose = remaining.indexOf('[/red]');
    if (redClose === -1) {
      parts.push(<span key={key++} style={{ color: '#ef4444' }}>{remaining}</span>);
      break;
    }
    parts.push(<span key={key++} style={{ color: '#ef4444' }}>{remaining.slice(0, redClose)}</span>);
    remaining = remaining.slice(redClose + 6);
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
