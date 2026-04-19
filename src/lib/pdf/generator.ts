import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plan } from '../../types/plan';
import type { Dish } from '../../types/dish';
import { formatPl, weekdayPl } from '../utils/date';

export async function planToPdfBlob(plan: Plan, dishMap: Map<string, Dish>): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  await embedLobster(doc);

  doc.setFillColor(250, 243, 224);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFont('Lobster');
  doc.setFontSize(32);
  doc.setTextColor(146, 32, 32);
  doc.text('Jadłospis', 105, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(58, 42, 26);
  const sub = plan.name
    ? `${plan.name} · ${formatPl(plan.startDate)} – ${formatPl(plan.endDate)}`
    : `${formatPl(plan.startDate)} – ${formatPl(plan.endDate)}`;
  doc.text(sub, 105, 36, { align: 'center' });

  const body = plan.meals.map((m) => {
    const dish = m.dishId ? dishMap.get(m.dishId) : null;
    return [
      formatPl(m.date),
      weekdayPl(m.date),
      dish?.name ?? '(nie gotujemy)',
      m.isLeftover ? 'resztki' : dish ? dish.tags.join(', ') : '',
      m.locked ? '📌' : '',
    ];
  });

  autoTable(doc, {
    head: [['Data', 'Dzień', 'Danie', 'Etykiety', '']],
    body,
    startY: 46,
    theme: 'grid',
    headStyles: { fillColor: [201, 42, 42], textColor: [255, 253, 245], fontStyle: 'bold' },
    bodyStyles: { textColor: [58, 42, 26], fillColor: [255, 253, 245] },
    alternateRowStyles: { fillColor: [250, 243, 224] },
    styles: { font: 'helvetica', fontSize: 11, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  return doc.output('blob');
}

async function embedLobster(doc: jsPDF): Promise<void> {
  try {
    const res = await fetch(new URL('../../assets/fonts/Lobster-Regular.ttf', import.meta.url));
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    doc.addFileToVFS('Lobster-Regular.ttf', base64);
    doc.addFont('Lobster-Regular.ttf', 'Lobster', 'normal');
  } catch {
    // fallback to default fonts
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
