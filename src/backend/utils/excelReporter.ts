import ExcelJS from 'exceljs';
import path from 'path';

interface ReportData {
  sheetName: string;
  headers: { header: string; key: string }[];
  data: any[];
}

/**
 * Generating an Excel report from structured data.
 * @param reportName The base name for the generated file.
 * @param sheets An array of objects, each representing a worksheet.
 * @returns The file path of the generated Excel file.
 */
export const generateExcelReport = async (reportName: string, sheets: ReportData[]): Promise<string> => {
  // Creating a new workbook
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(process.cwd(), 'reports', `${reportName}_${Date.now()}.xlsx`);

  // Creating a reports directory if it doesn't exist (basic sync approach for quick setup)
  if (!require('fs').existsSync(path.join(process.cwd(), 'reports'))) {
      require('fs').mkdirSync(path.join(process.cwd(), 'reports'));
  }

  // Iterating through each sheet definition
  sheets.forEach(sheetData => {
    // Adding a worksheet to the workbook
    const worksheet = workbook.addWorksheet(sheetData.sheetName);

    // Setting columns based on headers
    worksheet.columns = sheetData.headers;

    // Adding rows to the worksheet
    worksheet.addRows(sheetData.data);

    // Styling the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF008080' } // Deep Teal background
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Iterate over all columns that have content
    for (let i = 1; i <= worksheet.columnCount; i++) {
      const column = worksheet.getColumn(i);
      let maxColumnLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value;
        // Adjust for different cell value types
        let columnLength = 10;
        if (cellValue) {
          if (typeof cellValue === 'object' && cellValue && 'richText' in cellValue && Array.isArray((cellValue as ExcelJS.CellRichTextValue).richText)) {
            columnLength = (cellValue as ExcelJS.CellRichTextValue).richText.map((rt: ExcelJS.RichText) => rt.text).join('').length;
          } else {
            columnLength = cellValue.toString().length;
          }
        }
        if (columnLength > maxColumnLength) {
          maxColumnLength = columnLength;
        }
      });
      column.width = maxColumnLength < 10 ? 10 : maxColumnLength + 2;
    }

  });

  // Writing the workbook to the file system
  await workbook.xlsx.writeFile(filePath);
  
  // Returning the path to the generated report
  return filePath;
};

export default generateExcelReport;

    