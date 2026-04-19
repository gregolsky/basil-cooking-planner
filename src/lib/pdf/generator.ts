import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plan } from '../../types/plan';
import type { Dish } from '../../types/dish';
import { formatPl, weekdayPl } from '../utils/date';

const BASE = import.meta.env.BASE_URL ?? '/';

export async function planToPdfBlob(plan: Plan, dishMap: Map<string, Dish>): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const noto = await fetchFont(`${BASE}fonts/NotoSans-Regular.ttf`);
  if (noto) {
    doc.addFileToVFS('NotoSans-Regular.ttf', noto);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  }

  const lobster = await fetchFont(`${BASE}fonts/Lobster-Regular.ttf`);
  if (lobster) {
    doc.addFileToVFS('Lobster-Regular.ttf', lobster);
    doc.addFont('Lobster-Regular.ttf', 'Lobster', 'normal');
  }

  const bodyFont = noto ? 'NotoSans' : 'helvetica';

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  if (lobster) doc.setFont('Lobster');
  else doc.setFont(bodyFont, 'normal');
  doc.setFontSize(32);
  doc.setTextColor(146, 32, 32);
  doc.text('Jadłospis', 105, 28, { align: 'center' });

  doc.setFont(bodyFont, 'normal');
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
      m.locked ? '📌' : '',
    ];
  });

  autoTable(doc, {
    head: [['Data', 'Dzień', 'Danie', '']],
    body,
    startY: 46,
    theme: 'grid',
    headStyles: { fillColor: [201, 42, 42], textColor: [255, 253, 245], fontStyle: 'bold', font: bodyFont },
    bodyStyles: { textColor: [58, 42, 26], fillColor: [255, 255, 255], font: bodyFont },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    styles: { font: bodyFont, fontSize: 10, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  return doc.output('blob');
}

async function fetchFont(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}
