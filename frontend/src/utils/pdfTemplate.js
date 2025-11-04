import pdfMake from "pdfmake/build/pdfmake";
import pdfMakeFonts from "../fonts/vfs_fonts";

// Initialize fonts
if (pdfMakeFonts && pdfMakeFonts.pdfMake && pdfMakeFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfMakeFonts.pdfMake.vfs;
  pdfMake.fonts = {
    Cairo: {
      normal: 'Cairo-Regular.ttf',
      bold: 'Cairo-Regular.ttf',
      italics: 'Cairo-Regular.ttf',
      bolditalics: 'Cairo-Regular.ttf'
    }
  };
}

/**
 * Create school header for PDF (placeholder for future logo/aklesha)
 */
export const createHeader = (title = '') => {
  return {
    columns: [
      {
        stack: [
          {
            text: 'مدارس الفجر الجديد الأهلية',
            style: 'schoolName',
            alignment: 'center'
          },
          // Placeholder for future logo
          // { image: 'logoBase64', width: 60, alignment: 'center', margin: [0, 10, 0, 0] }
        ],
        width: '*'
      }
    ],
    margin: [0, 0, 0, 20]
  };
};

/**
 * Create report info section
 */
export const createReportInfo = (reportTitle, additionalInfo = {}) => {
  const content = [
    {
      text: reportTitle,
      style: 'reportTitle',
      alignment: 'center',
      margin: [0, 0, 0, 15]
    }
  ];

  // Date and additional info in columns (RTL)
  const columns = [];
  
  if (additionalInfo.leftInfo) {
    columns.push({
      text: additionalInfo.leftInfo,
      style: 'infoText',
      alignment: 'left',
      width: '*'
    });
  }
  
  columns.push({
    text: `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    style: 'infoText',
    alignment: 'right',
    width: '*'
  });

  if (columns.length > 0) {
    content.push({
      columns: columns,
      margin: [0, 0, 0, 20]
    });
  }

  return content;
};

/**
 * Create RTL table with proper Arabic formatting
 * @param {Array} headers - Array of header objects: [{text: '', width: '*'}]
 * @param {Array} rows - Array of row arrays
 * @param {Object} options - Additional options
 */
export const createRTLTable = (headers, rows, options = {}) => {
  const {
    widths = headers.map(h => h.width || '*'),
    alternateRowColors = true,
    headerColor = '#dbeafe',
    evenRowColor = '#f9fafb',
    showRowNumbers = false
  } = options;

  // IMPORTANT: Reverse headers and widths for RTL
  const reversedHeaders = [...headers].reverse();
  const reversedWidths = [...widths].reverse();

  // Build headers (reversed for RTL)
  const tableHeaders = reversedHeaders.map(h => ({
    text: h.text,
    style: 'tableHeader',
    alignment: 'center',
    fillColor: headerColor
  }));

  // Add row numbers at the END (rightmost in RTL)
  if (showRowNumbers) {
    tableHeaders.push({ 
      text: 'م', 
      style: 'tableHeader', 
      alignment: 'center',
      fillColor: headerColor
    });
  }

  const tableBody = [tableHeaders];

  // Build rows (reverse each row for RTL)
  rows.forEach((row, index) => {
    // Reverse the row array for RTL
    const reversedRow = [...row].reverse();
    
    const tableRow = reversedRow.map(cell => {
      if (typeof cell === 'object') {
        return {
          ...cell,
          alignment: cell.alignment || 'center',
          style: cell.style || 'tableCell'
        };
      }
      return {
        text: String(cell || ''),
        alignment: 'center',
        style: 'tableCell'
      };
    });

    // Add row number at the END (rightmost)
    if (showRowNumbers) {
      tableRow.push({
        text: (index + 1).toString(),
        alignment: 'center',
        style: 'tableCell'
      });
    }

    tableBody.push(tableRow);
  });

  // Calculate widths (reversed + row number at end)
  let finalWidths = reversedWidths;
  if (showRowNumbers) {
    finalWidths = [...reversedWidths, 30];
  }

  return {
    table: {
      headerRows: 1,
      widths: finalWidths,
      body: tableBody,
      dontBreakRows: true
    },
    layout: {
      fillColor: function (rowIndex, node, columnIndex) {
        if (rowIndex === 0) return null; // Header already has color
        return alternateRowColors && (rowIndex % 2 === 0) ? evenRowColor : null;
      },
      hLineWidth: function (i, node) { return 0.5; },
      vLineWidth: function (i, node) { return 0.5; },
      hLineColor: function (i, node) { return '#d1d5db'; },
      vLineColor: function (i, node) { return '#d1d5db'; },
      paddingLeft: function(i, node) { return 8; },
      paddingRight: function(i, node) { return 8; },
      paddingTop: function(i, node) { return 6; },
      paddingBottom: function(i, node) { return 6; }
    },
    margin: [0, 0, 0, 15]
  };
};

/**
 * Create section with title and content
 */
export const createSection = (title, content) => {
  return {
    stack: [
      {
        text: title,
        style: 'sectionTitle',
        margin: [0, 15, 0, 10]
      },
      content
    ]
  };
};

/**
 * Create colored info box (RTL)
 */
export const createInfoBox = (label, value, color = '#dbeafe') => {
  return {
    columns: [
      {
        text: value,
        style: 'infoBoxValue',
        alignment: 'left',
        width: 'auto'
      },
      {
        text: label,
        style: 'infoBoxLabel',
        alignment: 'right',
        width: '*'
      }
    ],
    fillColor: color,
    margin: [0, 5, 0, 5]
  };
};

/**
 * Default styles for all PDFs
 */
export const pdfStyles = {
  schoolName: {
    fontSize: 18,
    bold: true,
    color: '#1e40af'
  },
  reportTitle: {
    fontSize: 16,
    bold: true,
    color: '#3b82f6'
  },
  sectionTitle: {
    fontSize: 14,
    bold: true,
    color: '#1e40af'
  },
  infoText: {
    fontSize: 9,
    color: '#666666'
  },
  infoBoxLabel: {
    fontSize: 11,
    bold: true,
    color: '#374151'
  },
  infoBoxValue: {
    fontSize: 11,
    color: '#1f2937'
  },
  tableHeader: {
    bold: true,
    fontSize: 11,
    color: '#1e40af'
  },
  tableCell: {
    fontSize: 10
  },
  tableCellBold: {
    fontSize: 10,
    bold: true
  },
  footer: {
    fontSize: 8,
    color: '#999999',
    italics: true
  },
  note: {
    fontSize: 9,
    color: '#666666',
    italics: true
  }
};

/**
 * Create footer
 */
export const createFooter = (customText = null) => {
  return {
    text: customText || '* هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة التقارير',
    style: 'footer',
    alignment: 'center',
    margin: [0, 10, 0, 0]
  };
};

/**
 * Generate complete PDF document
 */
export const generatePDF = (content, filename, options = {}) => {
  const {
    orientation = 'portrait',
    pageSize = 'A4',
    includeHeader = true,
    includeFooter = true,
    title = '',
    additionalInfo = {}
  } = options;

  const documentContent = [];

  // Add header
  if (includeHeader) {
    documentContent.push(createHeader(title));
  }

  // Add report info
  if (title) {
    documentContent.push(...createReportInfo(title, additionalInfo));
  }

  // Add main content
  documentContent.push(...content);

  // Add footer
  if (includeFooter) {
    documentContent.push(createFooter());
  }

  const docDefinition = {
    pageSize: pageSize,
    pageOrientation: orientation,
    pageMargins: [40, 80, 40, 60],
    defaultStyle: {
      font: 'Cairo',
      fontSize: 11,
      alignment: 'right' // RTL default
    },
    content: documentContent,
    styles: pdfStyles
  };

  pdfMake.createPdf(docDefinition).download(filename);
};

export default {
  createHeader,
  createReportInfo,
  createRTLTable,
  createSection,
  createInfoBox,
  createFooter,
  generatePDF,
  pdfStyles
};
