import pdfMake from '@digicole/pdfmake-rtl';
import pdfFonts from '../fonts/vfs_fonts';

// Configure pdfMake with Arabic font and RTL support
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

pdfMake.fonts = {
  Cairo: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Regular.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Regular.ttf'
  },
  // Use Cairo for all fonts to avoid missing font errors
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

export default pdfMake;
