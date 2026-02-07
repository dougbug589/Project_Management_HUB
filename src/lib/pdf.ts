import PDFDocument from 'pdfkit';

export interface PDFReportData {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  generatedAt: string;
}

export function generatePDFReport(data: PDFReportData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const buffers: Buffer[] = [];

    doc.on('data', (buffer: Buffer) => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text(data.title, { align: 'center' });
    doc.moveDown();

    // Generated date
    doc.fontSize(10).font('Helvetica').text(`Generated: ${data.generatedAt}`, {
      align: 'right',
    });
    doc.moveDown();

    // Table headers
    const columnWidths = data.columns.map(() => 500 / data.columns.length);
    const headerY = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');

    data.columns.forEach((col, i) => {
      doc.text(col, 50 + i * columnWidths[i], headerY, {
        width: columnWidths[i],
        align: 'left',
      });
    });

    // Draw header line
    doc.moveTo(50, headerY + 20).lineTo(550, headerY + 20).stroke();
    doc.moveDown();

    // Table rows
    doc.fontSize(10).font('Helvetica');
    let rowY = doc.y;

    data.rows.forEach((row, rowIndex) => {
      const isAlternate = rowIndex % 2 === 0;
      const bgColor = isAlternate ? '#f5f5f5' : '#ffffff';

      if (bgColor === '#f5f5f5') {
        doc.rect(50, rowY, 500, 20).fill(bgColor).stroke();
      }

      row.forEach((cell, colIndex) => {
        doc.fillColor('#000').text(
          String(cell),
          50 + colIndex * columnWidths[colIndex],
          rowY + 2,
          {
            width: columnWidths[colIndex],
            align: 'left',
          }
        );
      });

      rowY += 20;
    });

    // Footer
    doc.fontSize(9).fillColor('#666').text('Project Management Application', 50, doc.page.height - 50, {
      align: 'center',
    });

    doc.end();
  });
}

export function convertCSVtoPDF(csvContent: string, title: string): Promise<Buffer> {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows = lines
    .slice(1)
    .map((line) =>
      line
        .split(',')
        .map((cell) => cell.trim().replace(/"/g, ''))
        .map((cell) => (cell === 'true' ? '✓' : cell === 'false' ? '✗' : cell))
    );

  return generatePDFReport({
    title,
    columns: headers,
    rows,
    generatedAt: new Date().toLocaleString(),
  });
}
