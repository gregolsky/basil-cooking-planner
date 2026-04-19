export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (!('canShare' in navigator)) return false;
  try {
    const probe = new File([new Blob(['x'])], 'probe.txt', { type: 'text/plain' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function canShareLink(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function shareFile(blob: Blob, name: string, title: string): Promise<boolean> {
  if (!canShareFiles()) return false;
  const file = new File([blob], name, { type: blob.type });
  try {
    await navigator.share({ title, files: [file] });
    return true;
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return true;
    return false;
  }
}

export async function shareLink(url: string, title: string, text?: string): Promise<boolean> {
  if (!canShareLink()) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return true;
    return false;
  }
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
