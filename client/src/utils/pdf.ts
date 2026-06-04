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

function addCompactHeader(doc: jsPDF, title: string, subtitle: string): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, w, 16, 'F');
  doc.setFillColor(...GREEN_COLOR);
  doc.rect(0, 16, w, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Natural Ice Production Tracker', 10, 7);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${title}  —  ${subtitle}`, 10, 13);

  doc.setTextColor(0, 0, 0);
  return 21;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 8, pageWidth - 10, pageHeight - 8);

    doc.setFontSize(5.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, pageHeight - 5);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
    doc.text('Natural Ice Production Tracker', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }
}

// Flatten materials categories into rows
function buildMatRows(categories: { name: string; items: string[] }[], materials: Record<string, { initial: number; using: number }>): (string | number)[][] {
  const rows: (string | number)[][] = [];
  for (const cat of categories) {
    rows.push([cat.name, '', '', '']);
    for (const item of cat.items) {
      const mat = materials[item] || { initial: 0, using: 0 };
      const final_val = mat.initial - mat.using;
      rows.push([`  ${item}`, mat.initial, mat.using, final_val]);
    }
  }
  return rows;
}

// Build 2-column materials table (8 cols: left 4 + right 4) for compact layout
function buildTwoColMatRows(categories: { name: string; items: string[] }[], materials: Record<string, { initial: number; using: number }>): (string | number)[][] {
  const flatRows = buildMatRows(categories, materials);
  const midPoint = Math.ceil(flatRows.length / 2);
  const leftRows = flatRows.slice(0, midPoint);
  const rightRows = flatRows.slice(midPoint);

  const combined: (string | number)[][] = [];
  const maxLen = Math.max(leftRows.length, rightRows.length);
  for (let i = 0; i < maxLen; i++) {
    const left = leftRows[i] || ['', '', '', ''];
    const right = rightRows[i] || ['', '', '', ''];
    combined.push([...left, ...right]);
  }
  return combined;
}

// Check if a row-half is a category header (cols 1,2,3 are empty strings)
function isCategoryRow(vals: (string | number)[]): boolean {
  return vals[1] === '' && vals[2] === '' && vals[3] === '';
}

// ============================
// DAILY PRODUCTION PDF — ALL ON ONE PAGE
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
  let y = addCompactHeader(doc, 'Daily Production Report', subtitle);

  // --- Production Table ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Production Data', 10, y);
  y += 2.5;

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

  // Total row
  const grandRow: (string | number)[] = ['TOTAL'];
  let grandTotal = 0;
  for (const h of allCols) {
    const colTotal = products.reduce((sum, p) => sum + (grid[p]?.[h] || 0), 0);
    grandRow.push(colTotal || '-');
    grandTotal += colTotal;
  }
  grandRow.push(grandTotal);
  prodRows.push(grandRow);

  // Smaller font for Cutting Team 2 (more products)
  const prodFontSize = team === 2 ? 5 : 6;
  const prodPadding = team === 2 ? 0.5 : 1;
  const prodNameWidth = team === 2 ? 28 : 26;

  autoTable(doc, {
    startY: y,
    head: [prodHeaders],
    body: prodRows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontSize: prodFontSize,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: prodPadding,
    },
    bodyStyles: {
      fontSize: prodFontSize,
      halign: 'center',
      cellPadding: prodPadding,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: prodNameWidth },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.15,
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data: any) => {
      if (data.row.index === prodRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255];
      }
      if (data.column.index === prodHeaders.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = PRIMARY_COLOR;
      }
    },
  });

  // --- Materials Section ---
  y = (doc as any).lastAutoTable.finalY + 3;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Raw Materials', 10, y);
  y += 2;

  if (team === 2) {
    // 2-column layout: 8-column single table
    const twoColRows = buildTwoColMatRows(categories, materials);
    const twoColHeaders = ['Material', 'Initial', 'Using', 'Final', 'Material', 'Initial', 'Using', 'Final'];
    const colW = 17;
    const nameW = 52;

    autoTable(doc, {
      startY: y,
      head: [twoColHeaders],
      body: twoColRows,
      theme: 'grid',
      headStyles: {
        fillColor: HEADER_BG,
        textColor: HEADER_TEXT,
        fontSize: 4,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 0.4,
      },
      bodyStyles: {
        fontSize: 4,
        halign: 'center',
        cellPadding: 0.4,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: nameW },
        1: { cellWidth: colW },
        2: { cellWidth: colW },
        3: { cellWidth: colW },
        4: { halign: 'left', cellWidth: nameW },
        5: { cellWidth: colW },
        6: { cellWidth: colW },
        7: { cellWidth: colW },
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        overflow: 'hidden',
      },
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const rowData = twoColRows[data.row.index];
          if (!rowData) return;
          // Left half (cols 0-3)
          if (data.column.index <= 3) {
            const leftVals = rowData.slice(0, 4);
            if (isCategoryRow(leftVals as (string|number)[])) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [232, 245, 233];
              data.cell.styles.textColor = [46, 125, 50];
            }
            if (data.column.index === 3 && typeof leftVals[3] === 'number') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = (leftVals[3] as number) < 0 ? [211, 47, 47] : [46, 125, 50];
            }
          }
          // Right half (cols 4-7)
          if (data.column.index >= 4) {
            const rightVals = rowData.slice(4, 8);
            if (isCategoryRow(rightVals as (string|number)[])) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [232, 245, 233];
              data.cell.styles.textColor = [46, 125, 50];
            }
            if (data.column.index === 7 && typeof rightVals[3] === 'number') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = (rightVals[3] as number) < 0 ? [211, 47, 47] : [46, 125, 50];
            }
          }
          // Separator between left and right
          if (data.column.index === 4) {
            data.cell.styles.cellPadding = { top: 0.4, bottom: 0.4, left: 1.5, right: 0.4 };
          }
        }
      },
    });
  } else {
    // Team 1: single column (fewer materials)
    const allMatRows = buildMatRows(categories, materials);
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Initial', 'Using', 'Final']],
      body: allMatRows,
      theme: 'grid',
      headStyles: {
        fillColor: HEADER_BG,
        textColor: HEADER_TEXT,
        fontSize: 5.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 0.8,
      },
      bodyStyles: {
        fontSize: 5.5,
        halign: 'center',
        cellPadding: 0.8,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22 },
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.15,
      },
      margin: { left: 10, right: 10 },
      tableWidth: 121,
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const rowData = allMatRows[data.row.index];
          if (rowData && rowData[1] === '' && rowData[2] === '' && rowData[3] === '') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [232, 245, 233];
            data.cell.styles.textColor = [46, 125, 50];
          }
          if (data.column.index === 3 && typeof rowData?.[3] === 'number') {
            data.cell.styles.fontStyle = 'bold';
            if ((rowData[3] as number) < 0) {
              data.cell.styles.textColor = [211, 47, 47];
            } else {
              data.cell.styles.textColor = [46, 125, 50];
            }
          }
        }
      },
    });
  }

  addFooter(doc);

  const fileName = `Daily_Report_${teamLabel(team).replace(/ /g, '_')}_${date}_${shift === 'M' ? 'Morning' : 'Night'}.pdf`;
  doc.save(fileName);
}

// ============================
// MONTHLY SUMMARY PDF — COMPACT ONE PAGE
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

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const shiftLabel2 = shiftFilter === 'all' ? 'All Shifts' : shiftFilter === 'M' ? 'Morning Shift ☀' : 'Night Shift ☽';
  const subtitle = `${monthName}  |  ${teamLabel(team)}  |  ${shiftLabel2}`;
  let y = addCompactHeader(doc, 'Monthly Production Summary', subtitle);

  // Build table
  const headers = ['Product', ...days.map(d => String(d)), 'TOTAL'];
  const bodyRows: (string | number)[][] = [];

  for (const product of products) {
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

  const summaryFontSize = team === 2 ? 4.5 : 5;
  const summaryPadding = team === 2 ? 0.6 : 0.8;
  const summaryNameWidth = team === 2 ? 30 : 28;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: HEADER_BG,
      textColor: HEADER_TEXT,
      fontSize: summaryFontSize,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: summaryPadding,
    },
    bodyStyles: {
      fontSize: summaryFontSize,
      halign: 'center',
      cellPadding: summaryPadding,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: summaryNameWidth },
      [headers.length - 1]: { fontStyle: 'bold', cellWidth: 14 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      overflow: 'hidden',
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rowData = bodyRows[data.row.index];
        const label = String(rowData?.[0] || '');

        if (label.startsWith('↳')) {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [46, 125, 50];
          data.cell.styles.fontSize = 4;
          data.cell.styles.fontStyle = 'italic';
        }

        if (data.row.index === bodyRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 248, 255];
          data.cell.styles.textColor = PRIMARY_COLOR;
        }

        if (data.column.index === headers.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (!label.startsWith('↳') && data.row.index !== bodyRows.length - 1) {
            data.cell.styles.textColor = PRIMARY_COLOR;
          }
        }
      }
    },
  });

  addFooter(doc);

  const fileName = `Monthly_Summary_${teamLabel(team).replace(/ /g, '_')}_${monthName.replace(/ /g, '_')}_${shiftFilter === 'all' ? 'AllShifts' : shiftFilter === 'M' ? 'Morning' : 'Night'}.pdf`;
  doc.save(fileName);
}
