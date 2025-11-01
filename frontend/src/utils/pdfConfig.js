import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from '../fonts/vfs_fonts';

// Configure pdfMake with Arabic font
pdfMake.vfs = pdfFonts;

pdfMake.fonts = {
  Cairo: {
    normal: 'Cairo-Regular.ttf',
    bold: 'Cairo-Regular.ttf',
    italics: 'Cairo-Regular.ttf',
    bolditalics: 'Cairo-Regular.ttf'
  },
  // Keep Roboto as fallback for English text
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

export default pdfMake;
