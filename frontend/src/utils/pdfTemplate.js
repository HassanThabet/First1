import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";
import html2canvas from "html2canvas";

// Initialize fonts with RTL support
if (pdfMakeFonts && pdfMakeFonts.pdfMake && pdfMakeFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfMakeFonts.pdfMake.vfs;
}

pdfMake.fonts = {
  Cairo: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Regular.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Regular.ttf'
  },
  Roboto: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Regular.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Regular.ttf'
  },
  Nillima: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Regular.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Regular.ttf'
  }
};

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

  // Build headers - no need to reverse with @digicole/pdfmake-rtl
  const tableHeaders = headers.map(h => ({
    text: h.text,
    style: 'tableHeader',
    alignment: 'center',
    fillColor: headerColor
  }));

  // Add row numbers at the START (rightmost in RTL after auto-reverse)
  if (showRowNumbers) {
    tableHeaders.unshift({ 
      text: 'م', 
      style: 'tableHeader', 
      alignment: 'center',
      fillColor: headerColor
    });
  }

  const tableBody = [tableHeaders];

  // Build rows - no manual reversal needed with RTL package
  rows.forEach((row, index) => {
    const tableRow = row.map(cell => {
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

    // Add row number at the START (will be rightmost after RTL processing)
    if (showRowNumbers) {
      tableRow.unshift({
        text: (index + 1).toString(),
        alignment: 'center',
        style: 'tableCell'
      });
    }

    tableBody.push(tableRow);
  });

  // Calculate widths
  let finalWidths = widths;
  if (showRowNumbers) {
    finalWidths = [30, ...widths];
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
        text: label,
        style: 'infoBoxLabel',
        alignment: 'right',
        width: '*'
      },
      {
        text: value,
        style: 'infoBoxValue',
        alignment: 'center',
        width: 'auto'
      }
    ],
    fillColor: color,
    margin: [0, 3, 0, 3]
  };
};

/**
 * Create a statistics grid/table for overall stats
 */
export const createStatsGrid = (stats) => {
  // Group stats into rows of 2
  const statsRows = [];
  for (let i = 0; i < stats.length; i += 2) {
    const row = [];
    
    // First stat (right side in RTL)
    if (stats[i]) {
      row.push({
        stack: [
          { text: stats[i].label, style: 'statLabel', alignment: 'center' },
          { text: stats[i].value, style: 'statValue', alignment: 'center', margin: [0, 5, 0, 0] }
        ],
        fillColor: stats[i].color || '#dbeafe',
        margin: [5, 5, 5, 5]
      });
    }
    
    // Second stat (left side in RTL)
    if (stats[i + 1]) {
      row.push({
        stack: [
          { text: stats[i + 1].label, style: 'statLabel', alignment: 'center' },
          { text: stats[i + 1].value, style: 'statValue', alignment: 'center', margin: [0, 5, 0, 0] }
        ],
        fillColor: stats[i + 1].color || '#fef3c7',
        margin: [5, 5, 5, 5]
      });
    } else {
      // Empty cell if odd number
      row.push({ text: '', width: '*' });
    }
    
    statsRows.push({
      columns: row,
      columnGap: 10,
      margin: [0, 0, 0, 5]
    });
  }
  
  return {
    stack: statsRows,
    margin: [0, 0, 0, 15]
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
    fontSize: 12,
    bold: true,
    color: '#1e40af'
  },
  statLabel: {
    fontSize: 10,
    bold: true,
    color: '#374151'
  },
  statValue: {
    fontSize: 16,
    bold: true,
    color: '#1e40af'
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
 * Convert chart/element to image for PDF
 * @param {string} elementId - ID of the element to capture
 * @param {Object} options - Options for image capture
 * @returns {Promise<string>} Base64 image data
 */
export const captureChartAsImage = async (elementId, options = {}) => {
  const {
    width = 500,
    height = 300,
    backgroundColor = '#ffffff'
  } = options;

  try {
    const element = document.getElementById(elementId) || document.querySelector(elementId);
    if (!element) {
      console.warn(`Element ${elementId} not found`);
      return null;
    }

    const canvas = await html2canvas(element, {
      backgroundColor: backgroundColor,
      scale: 2, // Higher quality
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};

/**
 * Create image element for PDF from base64 data
 * @param {string} imageData - Base64 image data
 * @param {Object} options - Image options
 */
export const createChartImage = (imageData, options = {}) => {
  const {
    width = 480,
    height = 250,
    alignment = 'center',
    margin = [0, 10, 0, 15]
  } = options;

  if (!imageData) {
    return {
      text: '[المخطط غير متوفر]',
      style: 'note',
      alignment: 'center',
      margin: margin
    };
  }

  return {
    image: imageData,
    width: width,
    height: height,
    alignment: alignment,
    margin: margin
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
  createStatsGrid,
  createFooter,
  generatePDF,
  captureChartAsImage,
  createChartImage,
  pdfStyles
};
