import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Service to handle PDF manipulation.
 */
export class PDFService {
  /**
   * Captures a DOM element and returns its PNG bytes.
   */
  static async captureElementAsPngBytes(elementId: string): Promise<Uint8Array> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
      scale: 3, // High quality to match 300 DPI A4 (2480x3508 approx)
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const base64Data = imgData.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Fetches a template PDF and returns its page count.
   */
  static async getTemplatePageCount(templateUrl: string): Promise<number> {
    try {
      const response = await fetch(templateUrl);
      const buffer = await response.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { updateMetadata: false });
      return doc.getPageCount();
    } catch (error) {
      console.error('Error getting template page count:', error);
      return 5; // Default fallback if it fails to read
    }
  }

  /**
   * Generates and downloads a PDF with a customized order of pages.
   */
  static async generateCustomOrderedPdf(
    templateUrl: string | null,
    coverElementId: string,
    page6ElementId: string,
    pageOrder: Array<{ type: 'template' | 'saas-cover' | 'saas-page6'; index?: number }>,
    fileName: string
  ): Promise<void> {
    try {
      // 1. Capture dynamic pages as PNG bytes (only if they are in pageOrder)
      let coverImageBytes: Uint8Array | null = null;
      let page6ImageBytes: Uint8Array | null = null;

      if (pageOrder.some(item => item.type === 'saas-cover')) {
        coverImageBytes = await this.captureElementAsPngBytes(coverElementId);
      }
      if (pageOrder.some(item => item.type === 'saas-page6')) {
        page6ImageBytes = await this.captureElementAsPngBytes(page6ElementId);
      }

      let finalPdfBytes: Uint8Array;

      if (!templateUrl) {
        // No template PDF, just generate a PDF from the SaaS pages in order
        const finalDoc = await PDFDocument.create();
        for (const item of pageOrder) {
          if (item.type === 'saas-cover' && coverImageBytes) {
            const page = finalDoc.addPage([595.27, 841.89]);
            const pngImage = await finalDoc.embedPng(coverImageBytes);
            page.drawImage(pngImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
          } else if (item.type === 'saas-page6' && page6ImageBytes) {
            const page = finalDoc.addPage([595.27, 841.89]);
            const pngImage = await finalDoc.embedPng(page6ImageBytes);
            page.drawImage(pngImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
          }
        }
        finalPdfBytes = await finalDoc.save();
      } else {
        // 2. Fetch template PDF
        const templateResponse = await fetch(templateUrl);
        const templateBuffer = await templateResponse.arrayBuffer();
        
        const baseDoc = await PDFDocument.load(templateBuffer);
        const firstPage = baseDoc.getPages()[0];
        const { width, height } = firstPage.getSize();

        // 3. Create temporary documents for SaaS pages with matching size
        let saasCoverDoc: PDFDocument | null = null;
        if (coverImageBytes) {
          saasCoverDoc = await PDFDocument.create();
          const saasPage = saasCoverDoc.addPage([width, height]);
          const pngImage = await saasCoverDoc.embedPng(coverImageBytes);
          saasPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }

        let saasPage6Doc: PDFDocument | null = null;
        if (page6ImageBytes) {
          saasPage6Doc = await PDFDocument.create();
          const saasPage = saasPage6Doc.addPage([width, height]);
          const pngImage = await saasPage6Doc.embedPng(page6ImageBytes);
          saasPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }

        // 4. Create the final document and copy pages in the requested order
        const finalDoc = await PDFDocument.create();

        for (const item of pageOrder) {
          if (item.type === 'saas-cover' && saasCoverDoc) {
            const [copiedPage] = await finalDoc.copyPages(saasCoverDoc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'saas-page6' && saasPage6Doc) {
            const [copiedPage] = await finalDoc.copyPages(saasPage6Doc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'template' && typeof item.index === 'number') {
            if (item.index < baseDoc.getPageCount()) {
              const [copiedPage] = await finalDoc.copyPages(baseDoc, [item.index]);
              finalDoc.addPage(copiedPage);
            }
          }
        }

        finalPdfBytes = await finalDoc.save();
      }

      // 5. Download the final PDF
      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating custom ordered PDF:', error);
      throw error;
    }
  }

  /**
   * Replaces cover page (index 0) and page 6 (index 5) of a base PDF.
   * Forces the new pages to have the exact same size as the other pages.
   */
  static async replaceCoverAndPage6(
    basePdfArrayBuffer: ArrayBuffer,
    coverImageBytes: Uint8Array,
    page6ImageBytes: Uint8Array
  ): Promise<Uint8Array> {
    const baseDoc = await PDFDocument.load(basePdfArrayBuffer);
    
    // Get the page size of the first page of the template to match it exactly
    const pages = baseDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`Template page size detected for cover/page6 replacement: ${width}x${height}`);

    // Embed both dynamic PNG images
    const pngCover = await baseDoc.embedPng(coverImageBytes);
    const pngPage6 = await baseDoc.embedPng(page6ImageBytes);

    const pageCount = baseDoc.getPageCount();

    // 1. Replace Cover Page (index 0)
    if (pageCount >= 1) {
      baseDoc.removePage(0);
      const newCoverPage = baseDoc.insertPage(0, [width, height]);
      newCoverPage.drawImage(pngCover, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
      console.log('Replaced cover page (index 0).');
    }

    // 2. Replace Page 6 (index 5)
    if (baseDoc.getPageCount() >= 6) {
      baseDoc.removePage(5);
      const newPage6 = baseDoc.insertPage(5, [width, height]);
      newPage6.drawImage(pngPage6, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
      console.log('Replaced page 6 (index 5).');
    } else {
      // Append blank pages if the template is shorter, then add page 6
      while (baseDoc.getPageCount() < 5) {
        baseDoc.addPage([width, height]);
      }
      const newPage6 = baseDoc.addPage([width, height]);
      newPage6.drawImage(pngPage6, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      console.log('Appended new page 6.');
    }

    return await baseDoc.save();
  }

  /**
   * Full flow: Capture cover & page 6 -> Replace in template -> Download
   */
  static async generateAndDownload(
    templateUrl: string,
    coverElementId: string,
    page6ElementId: string,
    fileName: string
  ): Promise<void> {
    try {
      // 1. Fetch template
      const templateResponse = await fetch(templateUrl);
      const templateBuffer = await templateResponse.arrayBuffer();

      // 2. Capture dynamic cover (page 1) as PNG bytes
      const coverImageBytes = await this.captureElementAsPngBytes(coverElementId);

      // 3. Capture dynamic page 6 as PNG bytes
      const page6ImageBytes = await this.captureElementAsPngBytes(page6ElementId);

      // 4. Merge and enforce matching page dimensions
      const finalPdfBytes = await this.replaceCoverAndPage6(templateBuffer, coverImageBytes, page6ImageBytes);

      // 5. Download
      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generates and downloads a combined PDF containing ONLY cover and page 6 (for testing without a template).
   */
  static async downloadTestProposal(
    coverElementId: string,
    page6ElementId: string,
    fileName: string
  ): Promise<void> {
    try {
      // 1. Capture cover and page 6
      const coverImageBytes = await this.captureElementAsPngBytes(coverElementId);
      const page6ImageBytes = await this.captureElementAsPngBytes(page6ElementId);
      
      // 2. Create high-res PDF with two pages (2480x3508 px each)
      const finalDoc = await PDFDocument.create();
      
      const coverPage = finalDoc.addPage([2480, 3508]);
      const pngCover = await finalDoc.embedPng(coverImageBytes);
      coverPage.drawImage(pngCover, { x: 0, y: 0, width: 2480, height: 3508 });
      
      const page6Page = finalDoc.addPage([2480, 3508]);
      const pngPage6 = await finalDoc.embedPng(page6ImageBytes);
      page6Page.drawImage(pngPage6, { x: 0, y: 0, width: 2480, height: 3508 });
      
      const finalPdfBytes = await finalDoc.save();

      // 3. Download
      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating standalone test PDF:', error);
      throw error;
    }
  }

  static async viewCustomOrderedPdf(
    templateUrl: string | null,
    coverElementId: string,
    page6ElementId: string,
    pageOrder: Array<{ type: 'template' | 'saas-cover' | 'saas-page6'; index?: number }>
  ): Promise<void> {
    try {
      // Capture both if needed in the order
      let coverImageBytes: Uint8Array | null = null;
      let page6ImageBytes: Uint8Array | null = null;

      if (pageOrder.some(item => item.type === 'saas-cover')) {
        coverImageBytes = await this.captureElementAsPngBytes(coverElementId);
      }
      if (pageOrder.some(item => item.type === 'saas-page6')) {
        page6ImageBytes = await this.captureElementAsPngBytes(page6ElementId);
      }

      let finalPdfBytes: Uint8Array;

      if (!templateUrl) {
        // Fallback for no template: just Cover and Page 6 combined (2 pages)
        const finalDoc = await PDFDocument.create();
        if (coverImageBytes) {
          const page = finalDoc.addPage([595.27, 841.89]);
          const pngImage = await finalDoc.embedPng(coverImageBytes);
          page.drawImage(pngImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
        }
        if (page6ImageBytes) {
          const page = finalDoc.addPage([595.27, 841.89]);
          const pngImage = await finalDoc.embedPng(page6ImageBytes);
          page.drawImage(pngImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
        }
        finalPdfBytes = await finalDoc.save();
      } else {
        const templateResponse = await fetch(templateUrl);
        const templateBuffer = await templateResponse.arrayBuffer();
        const baseDoc = await PDFDocument.load(templateBuffer);
        const firstPage = baseDoc.getPages()[0];
        const { width, height } = firstPage.getSize();

        // Create temporary document for SaaS cover with matching size
        let saasCoverDoc: PDFDocument | null = null;
        if (coverImageBytes) {
          saasCoverDoc = await PDFDocument.create();
          const saasPage = saasCoverDoc.addPage([width, height]);
          const pngImage = await saasCoverDoc.embedPng(coverImageBytes);
          saasPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }

        // Create temporary document for SaaS page 6 with matching size
        let saasPage6Doc: PDFDocument | null = null;
        if (page6ImageBytes) {
          saasPage6Doc = await PDFDocument.create();
          const saasPage = saasPage6Doc.addPage([width, height]);
          const pngImage = await saasPage6Doc.embedPng(page6ImageBytes);
          saasPage.drawImage(pngImage, { x: 0, y: 0, width, height });
        }

        const finalDoc = await PDFDocument.create();
        for (const item of pageOrder) {
          if (item.type === 'saas-cover' && saasCoverDoc) {
            const [copiedPage] = await finalDoc.copyPages(saasCoverDoc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'saas-page6' && saasPage6Doc) {
            const [copiedPage] = await finalDoc.copyPages(saasPage6Doc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'template' && typeof item.index === 'number') {
            if (item.index < baseDoc.getPageCount()) {
              const [copiedPage] = await finalDoc.copyPages(baseDoc, [item.index]);
              finalDoc.addPage(copiedPage);
            }
          }
        }
        finalPdfBytes = await finalDoc.save();
      }

      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing custom ordered PDF:', error);
      throw error;
    }
  }

  /**
   * Generates only page 6 and opens it in a new browser tab.
   */
  static async viewOnlyPage6(elementId: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [2480, 3508],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing standalone page 6:', error);
      throw error;
    }
  }
}
