import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MORNING_HOURS, NIGHT_HOURS, TEAM1_PRODUCTS, TEAM2_PRODUCTS, TEAM1_MATERIALS, TEAM2_MATERIALS } from './data';

const PRIMARY_COLOR: [number, number, number] = [26, 115, 232];
const GREEN_COLOR: [number, number, number] = [129, 199, 132];
const HEADER_BG: [number, number, number] = [26, 115, 232];
const HEADER_TEXT: [number, number, number] = [255, 255, 255];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function shiftLabel(shift: string): string {
  return shift === 'M' ? 'Morning Shift ☀' : 'Night Shift ☽';
}

function teamLabel(team: number): string {
  return team === 1 ? 'Production Team 1' : 'Cutting Team 2';
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Blue header bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');

  // Green accent line
  doc.setFillColor(...GREEN_COLOR);
  doc.rect(0, 28, doc.internal.pageSize.getWidth(), 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Natural Ice Production Tracker', 14, 12);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 19);
  doc.text(subtitle, 14, 25);

  // Reset
  doc.setTextColor(0, 0, 0);
  return 38; // y position after header
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Footer line
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    doc.text('Natural Ice Production Tracker', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

// ============================
// DAILY PRODUCTION PDF
// ============================
export function generateDailyPDF(
  date: string,
  shift: string,
  team: number,
  grid: Record<string, Record<string, number>>,
  materials: Record<string, { initial: number; using: number }>
) {
  const products = team === 1 ? TEAM1_PRODUCTS : TEAM2_PRODUCTS;
  const hours = shift === 'M' ? MORNING_HOURS : NIGHT_HOURS;
  const allCols = [...hours, 'DISPATCH'];
  const categories = team === 1 ? TEAM1_MATERIALS : TEAM2_MATERIALS;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const subtitle = `${formatDate(date)}  |  ${shiftLabel(shift)}  |  ${teamLabel(team)}`;
  let y = addHeader(doc, 'Daily Production Report', subtitle);

  // --- Production Table ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Production Data', 14, y);
  y += 5;

  const prodHeaders = ['Product', ...allCols, 'TOTAL'];
  const prodRows = products.map(product => {
    const row: (string | number)[] = [product];
    let total = 0;
    for (const h of allCols) {
      const qty = grid[product]?.[h] || 0;
      row.push(qty || '-');
      total += qty;
    }
    row.push(total);
    return row;
  });

  // Grand total row
  const grandRow: (string | number)[] = ['TOTAL'];
  let grandTotal = 0;
  for (const h of allCols) {
    const colTotal = products.reduce((sum, p) => sum + (grid[p]?.[h] || 0), 0);
    grandRow.push(colTotal || '-');
    grandTotal += colTotal;
  }
  grandRow.push(grandTotal);
  prodRows.push(grandRow);

  autoTable(doc, {
    startY: y,
    head: [prodHeaders],
    body: prodRows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      halign: 'center',
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 30 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    didParseCell: (data: any) => {
      // Style the total row
      if (data.row.index === prodRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255];
      }
      // Style TOTAL column
      if (data.column.index === prodHeaders.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = PRIMARY_COLOR;
      }
    },
  });

  // --- Materials Table ---
  y = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Raw Materials', 14, y);
  y += 5;

  const matHeaders = ['Material', 'Initial Stock', 'Using', 'Final'];
  const matRows: (string | number)[][] = [];

  for (const cat of categories) {
    // Category header row
    matRows.push([cat.name, '', '', '']);
    for (const item of cat.items) {
      const mat = materials[item] || { initial: 0, using: 0 };
      const final_val = mat.initial - mat.using;
      matRows.push([`   ${item}`, mat.initial, mat.using, final_val]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [matHeaders],
    body: matRows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      halign: 'center',
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    didParseCell: (data: any) => {
      // Style category header rows
      if (data.section === 'body') {
        const rowData = matRows[data.row.index];
        if (rowData && rowData[1] === '' && rowData[2] === '' && rowData[3] === '') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [46, 125, 50];
        }
        // Final column coloring
        if (data.column.index === 3 && typeof rowData?.[3] === 'number') {
          data.cell.styles.fontStyle = 'bold';
          if ((rowData[3] as number) < 0) {
            data.cell.styles.textColor = [211, 47, 47]; // red
          } else {
            data.cell.styles.textColor = [46, 125, 50]; // green
          }
        }
      }
    },
  });

  addFooter(doc);

  const fileName = `Daily_Report_${teamLabel(team).replace(/ /g, '_')}_${date}_${shift === 'M' ? 'Morning' : 'Night'}.pdf`;
  doc.save(fileName);
}

// ============================
// MONTHLY SUMMARY PDF
// ============================
const PALLET_RATES: Record<string, number> = {
  '1kg Tube': 60,
  '2kg Tube': 60,
  '10kg Tube': 80,
  '10kg Cube - HM': 80,
  '10kg Crushed': 80,
};

export function generateMonthlySummaryPDF(
  year: number,
  month: number,
  team: number,
  shiftFilter: 'all' | 'M' | 'N',
  summaryData: Array<{ date: string; shift: string; team: number; product: string; total: number }>
) {
  const products = team === 1 ? TEAM1_PRODUCTS : TEAM2_PRODUCTS;
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const matchesShift = (d: { shift: string }) => shiftFilter === 'all' || d.shift === shiftFilter;

  const getProductDayTotal = (product: string, day: number): number => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaryData
      .filter(d => d.date === dateStr && d.product === product && d.team === team && matchesShift(d))
      .reduce((sum, d) => sum + d.total, 0);
  };

  const getProductMonthTotal = (product: string): number => {
    return summaryData
      .filter(d => d.product === product && d.team === team && matchesShift(d))
      .reduce((sum, d) => sum + d.total, 0);
  };

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const shiftLabel2 = shiftFilter === 'all' ? 'All Shifts' : shiftFilter === 'M' ? 'Morning Shift ☀' : 'Night Shift ☽';
  const subtitle = `${monthName}  |  ${teamLabel(team)}  |  ${shiftLabel2}`;
  let y = addHeader(doc, 'Monthly Production Summary', subtitle);

  // Build table
  const headers = ['Product', ...days.map(d => String(d)), 'TOTAL'];
  const bodyRows: (string | number)[][] = [];

  for (const product of products) {
    // Quantity row
    const row: (string | number)[] = [product];
    let monthTotal = 0;
    for (const d of days) {
      const val = getProductDayTotal(product, d);
      row.push(val || '-');
      monthTotal += val;
    }
    row.push(monthTotal || '-');
    bodyRows.push(row);

    // Pallet sub-row for Team 1
    const rate = PALLET_RATES[product];
    if (team === 1 && rate) {
      const palletRow: (string | number)[] = [`↳ Pallets (${rate}/p)`];
      for (const d of days) {
        const val = getProductDayTotal(product, d);
        const pallets = val > 0 ? (val / rate).toFixed(1) : '-';
        palletRow.push(pallets);
      }
      const totalPallets = monthTotal > 0 ? (monthTotal / rate).toFixed(1) : '-';
      palletRow.push(totalPallets);
      bodyRows.push(palletRow);
    }
  }

  // Grand total row
  const grandRow: (string | number)[] = ['TOTAL'];
  let grandTotal = 0;
  for (const d of days) {
    const colTotal = products.reduce((sum, p) => sum + getProductDayTotal(p, d), 0);
    grandRow.push(colTotal || '-');
    grandTotal += colTotal;
  }
  grandRow.push(grandTotal);
  bodyRows.push(grandRow);

  const dayColWidth = (297 - 14 * 2 - 30 - 18) / daysInMonth;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontSize: 5.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1,
    },
    bodyStyles: {
      fontSize: 5.5,
      halign: 'center',
      cellPadding: 1,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 30 },
      [headers.length - 1]: { fontStyle: 'bold', cellWidth: 18 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.15,
      overflow: 'hidden',
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rowData = bodyRows[data.row.index];
        const label = String(rowData?.[0] || '');

        // Pallet sub-rows
        if (label.startsWith('↳')) {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [46, 125, 50];
          data.cell.styles.fontSize = 5;
          data.cell.styles.fontStyle = 'italic';
        }

        // Grand total row
        if (data.row.index === bodyRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 248, 255];
          data.cell.styles.textColor = PRIMARY_COLOR;
        }

        // TOTAL column
        if (data.column.index === headers.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (!label.startsWith('↳') && data.row.index !== bodyRows.length - 1) {
            data.cell.styles.textColor = PRIMARY_COLOR;
          }
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);

  const fileName = `Monthly_Summary_${teamLabel(team).replace(/ /g, '_')}_${monthName.replace(/ /g, '_')}_${shiftFilter === 'all' ? 'AllShifts' : shiftFilter === 'M' ? 'Morning' : 'Night'}.pdf`;
  doc.save(fileName);
}
