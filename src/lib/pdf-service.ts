import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { drawQuotePage, DadosOrcamento } from '@/lib/pdf-quote-page';

/**
 * Para pintar um gradiente CSS, o html2canvas cria um canvas com as dimensões
 * arredondadas do elemento e chama createPattern() com ele. Elementos de 1px
 * (ou menos, quando a página está renderizada em escala) arredondam para 0, e
 * createPattern lança "InvalidStateError: ... width or height of 0", abortando
 * a geração do PDF inteiro.
 *
 * Os culpados no layout atual são as linhas decorativas de 1px no topo dos
 * cards escuros (TopStreak, em ProposalPage6). Elas são marcadas com
 * data-pdf-flat-bg e aqui têm o gradiente trocado por uma cor sólida
 * equivalente — só na cópia usada para a captura, então a tela não muda.
 *
 * Uma tentativa anterior media offsetWidth/offsetHeight, que são inteiros
 * arredondados: um elemento de 1px dava offsetHeight === 1 e escapava do
 * filtro. Por isso a regra principal agora é por atributo, não por medida.
 */
const prepareCloneForCapture = (clonedDoc: Document) => {
  // 1. Escotilha de escape: qualquer elemento marcado é descartado da captura.
  //    Hoje nenhum usa isto — os brilhos foram reescritos só com degradê, que o
  //    html2canvas renderiza bem. Mantido para efeitos futuros que dependam de
  //    recursos não suportados pela lib.
  clonedDoc.querySelectorAll('[data-pdf-remove]').forEach(el => el.remove());

  // 2. Regra determinística: elementos sabidamente frágeis.
  clonedDoc.querySelectorAll<HTMLElement>('[data-pdf-flat-bg]').forEach(el => {
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = el.dataset.pdfFlatBg || 'transparent';
  });

  // 3. Rede de segurança para qualquer gradiente sub-pixel que venha a surgir.
  //    Só roda se o clone já tiver layout — sem isso, todas as medidas seriam
  //    zero e apagaríamos os gradientes legítimos dos cards.
  const win = clonedDoc.defaultView;
  const body = clonedDoc.body;
  if (!win || !body || body.getBoundingClientRect().height < 1) return;

  clonedDoc.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (win.getComputedStyle(el).backgroundImage === 'none') return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) el.style.backgroundImage = 'none';
  });
};

/**
 * Service to handle PDF manipulation.
 */
export class PDFService {
  /**
   * Captura um elemento do DOM e devolve os bytes da imagem em PNG.
   *
   * PNG, não JPEG. As páginas capturadas são dominadas por gradientes escuros
   * suaves — o pior caso para o JPEG, cujos blocos de 8x8 px aparecem como um
   * quadriculado sobre os painéis verdes. Medido no PDF real gerado pelo
   * sistema, o índice de blocagem dava 1,34 (acima de 1,25 já é perceptível),
   * com saltos de até 60 nas fronteiras dos blocos.
   *
   * Subir a qualidade do JPEG só atenua; PNG é sem perda e elimina o artefato
   * por definição. Custo medido na página real: 566 KB (JPEG) contra 2,1 MB
   * (PNG) — cerca de 1,5 MB a mais por página, em duas páginas capturadas.
   * (Uma estimativa anterior de ~7 MB por página estava errada: foi feita com
   * um gradiente sintético de tela cheia, e a página real é quase toda branca.)
   */
  static async captureElementAsPngBytes(elementId: string): Promise<Uint8Array> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
      scale: 3, // High quality to match 300 DPI A4 (2480x3508 approx)
      useCORS: true,
      logging: false,
      onclone: prepareCloneForCapture,
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
    fileName: string,
    /**
     * Dados da página de valores. Quando presente, ela é DESENHADA no PDF com
     * primitivas do pdf-lib (texto vetorial, ~4 KB) em vez de fotografada do
     * DOM. É o caminho normal; `page6ElementId` só é usado como reserva para
     * propostas que ainda dependam do componente antigo.
     */
    quoteData?: DadosOrcamento | null
  ): Promise<void> {
    try {
      // 1. Capture dynamic pages as PNG bytes (only if they are in pageOrder)
      let coverImageBytes: Uint8Array | null = null;
      let page6ImageBytes: Uint8Array | null = null;

      if (pageOrder.some(item => item.type === 'saas-cover')) {
        coverImageBytes = await this.captureElementAsPngBytes(coverElementId);
      }
      if (!quoteData && pageOrder.some(item => item.type === 'saas-page6')) {
        page6ImageBytes = await this.captureElementAsPngBytes(page6ElementId);
      }

      let finalPdfBytes: Uint8Array;

      if (!templateUrl) {
        // No template PDF, just generate a PDF from the SaaS pages in order
        const finalDoc = await PDFDocument.create();
        for (const item of pageOrder) {
          if (item.type === 'saas-cover' && coverImageBytes) {
            const page = finalDoc.addPage([595.27, 841.89]);
            const jpgImage = await finalDoc.embedPng(coverImageBytes);
            page.drawImage(jpgImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
          } else if (item.type === 'saas-page6' && quoteData) {
            await drawQuotePage(finalDoc, quoteData);
          } else if (item.type === 'saas-page6' && page6ImageBytes) {
            const page = finalDoc.addPage([595.27, 841.89]);
            const jpgImage = await finalDoc.embedPng(page6ImageBytes);
            page.drawImage(jpgImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
          }
        }
        finalPdfBytes = await finalDoc.save();
      } else {
        // 2. Fetch template PDF
        const templateResponse = await fetch(templateUrl);
        const templateBuffer = await templateResponse.arrayBuffer();
        
        const baseDoc = await PDFDocument.load(templateBuffer);
        const firstPage = baseDoc.getPages()[0];
        const { width: tplW, height: tplH } = firstPage.getSize();

        // NORMALIZAÇÃO DE TAMANHO — corrige o defeito mais visível do PDF.
        // Templates exportados de ferramentas de design costumam trazer as
        // dimensões de PIXEL gravadas como PONTOS: o template em uso tem
        // 2480x3508 pt, ou seja, uma folha de 87 x 124 cm.
        // Como o documento inteiro herda o tamanho da primeira página, a
        // captura de 2382x3369 px era esticada por essa folha gigante e caía
        // para ~69 DPI — os "quadradinhos" no PDF eram os pixels da imagem,
        // visíveis a olho nu. Na tela isso não aparece, porque lá é HTML vivo.
        // Reduzindo para A4, a MESMA captura passa a render 288 DPI.
        // A proporção é idêntica na prática (2480/3508 = 0,7069 contra 0,7071
        // do A4), então o layout não muda — só o tamanho do papel.
        const A4_WIDTH = 595.28;
        const fitScale = tplW > A4_WIDTH * 1.05 ? A4_WIDTH / tplW : 1;
        const width = tplW * fitScale;
        const height = tplH * fitScale;

        // 3. Create temporary documents for SaaS pages with matching size
        let saasCoverDoc: PDFDocument | null = null;
        if (coverImageBytes) {
          saasCoverDoc = await PDFDocument.create();
          const saasPage = saasCoverDoc.addPage([width, height]);
          const jpgImage = await saasCoverDoc.embedPng(coverImageBytes);
          saasPage.drawImage(jpgImage, { x: 0, y: 0, width, height });
        }

        let saasPage6Doc: PDFDocument | null = null;
        if (page6ImageBytes) {
          saasPage6Doc = await PDFDocument.create();
          const saasPage = saasPage6Doc.addPage([width, height]);
          const jpgImage = await saasPage6Doc.embedPng(page6ImageBytes);
          saasPage.drawImage(jpgImage, { x: 0, y: 0, width, height });
        }

        // 4. Create the final document and copy pages in the requested order
        const finalDoc = await PDFDocument.create();

        for (const item of pageOrder) {
          if (item.type === 'saas-cover' && saasCoverDoc) {
            const [copiedPage] = await finalDoc.copyPages(saasCoverDoc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'saas-page6' && quoteData) {
            await drawQuotePage(finalDoc, quoteData);
          } else if (item.type === 'saas-page6' && saasPage6Doc) {
            const [copiedPage] = await finalDoc.copyPages(saasPage6Doc, [0]);
            finalDoc.addPage(copiedPage);
          } else if (item.type === 'template' && typeof item.index === 'number') {
            if (item.index < baseDoc.getPageCount()) {
              if (fitScale === 1) {
                // Template já está num tamanho normal: cópia direta preserva
                // texto e vetores selecionáveis.
                const [copiedPage] = await finalDoc.copyPages(baseDoc, [item.index]);
                finalDoc.addPage(copiedPage);
              } else {
                // Template superdimensionado: precisa ser reduzido junto com o
                // resto, senão o documento sairia com páginas de tamanhos
                // diferentes. embedPage redesenha o conteúdo na escala nova —
                // como é vetorial, não há perda de qualidade.
                const embedded = await finalDoc.embedPage(baseDoc.getPage(item.index));
                const page = finalDoc.addPage([width, height]);
                page.drawPage(embedded, { x: 0, y: 0, width, height });
              }
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

    // Embed both dynamic JPEG images
    const jpgCover = await baseDoc.embedPng(coverImageBytes);
    const jpgPage6 = await baseDoc.embedPng(page6ImageBytes);

    const pageCount = baseDoc.getPageCount();

    // 1. Replace Cover Page (index 0)
    if (pageCount >= 1) {
      baseDoc.removePage(0);
      const newCoverPage = baseDoc.insertPage(0, [width, height]);
      newCoverPage.drawImage(jpgCover, {
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
      newPage6.drawImage(jpgPage6, {
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
      newPage6.drawImage(jpgPage6, {
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

      // 2. Capture dynamic cover (page 1) as JPEG bytes
      const coverImageBytes = await this.captureElementAsPngBytes(coverElementId);

      // 3. Capture dynamic page 6 as JPEG bytes
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
      const jpgCover = await finalDoc.embedPng(coverImageBytes);
      coverPage.drawImage(jpgCover, { x: 0, y: 0, width: 2480, height: 3508 });
      
      const page6Page = finalDoc.addPage([2480, 3508]);
      const jpgPage6 = await finalDoc.embedPng(page6ImageBytes);
      page6Page.drawImage(jpgPage6, { x: 0, y: 0, width: 2480, height: 3508 });
      
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

  /**
   * Generates a PDF with custom page order and opens it in a new browser tab.
   */
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
          const jpgImage = await finalDoc.embedPng(coverImageBytes);
          page.drawImage(jpgImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
        }
        if (page6ImageBytes) {
          const page = finalDoc.addPage([595.27, 841.89]);
          const jpgImage = await finalDoc.embedPng(page6ImageBytes);
          page.drawImage(jpgImage, { x: 0, y: 0, width: 595.27, height: 841.89 });
        }
        finalPdfBytes = await finalDoc.save();
      } else {
        const templateResponse = await fetch(templateUrl);
        const templateBuffer = await templateResponse.arrayBuffer();
        const baseDoc = await PDFDocument.load(templateBuffer);
        const firstPage = baseDoc.getPages()[0];
        const { width: tplW, height: tplH } = firstPage.getSize();

        // Mesma normalização do download — ver comentário em
        // generateCustomOrderedPdf. Sem isto o preview mostraria uma
        // qualidade diferente da do arquivo final.
        const A4_WIDTH = 595.28;
        const fitScale = tplW > A4_WIDTH * 1.05 ? A4_WIDTH / tplW : 1;
        const width = tplW * fitScale;
        const height = tplH * fitScale;

        // Create temporary document for SaaS cover with matching size
        let saasCoverDoc: PDFDocument | null = null;
        if (coverImageBytes) {
          saasCoverDoc = await PDFDocument.create();
          const saasPage = saasCoverDoc.addPage([width, height]);
          const jpgImage = await saasCoverDoc.embedPng(coverImageBytes);
          saasPage.drawImage(jpgImage, { x: 0, y: 0, width, height });
        }

        // Create temporary document for SaaS page 6 with matching size
        let saasPage6Doc: PDFDocument | null = null;
        if (page6ImageBytes) {
          saasPage6Doc = await PDFDocument.create();
          const saasPage = saasPage6Doc.addPage([width, height]);
          const jpgImage = await saasPage6Doc.embedPng(page6ImageBytes);
          saasPage.drawImage(jpgImage, { x: 0, y: 0, width, height });
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
              if (fitScale === 1) {
                const [copiedPage] = await finalDoc.copyPages(baseDoc, [item.index]);
                finalDoc.addPage(copiedPage);
              } else {
                const embedded = await finalDoc.embedPage(baseDoc.getPage(item.index));
                const page = finalDoc.addPage([width, height]);
                page.drawPage(embedded, { x: 0, y: 0, width, height });
              }
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
        onclone: prepareCloneForCapture,
      });

      // PNG e A4, pelos mesmos motivos do fluxo de download:
      // JPEG deixa quadriculado nos gradientes escuros, e o formato antigo
      // [2480, 3508] eram PONTOS — uma folha de 87 x 124 cm que jogava a
      // imagem para ~69 DPI. Em A4 a mesma captura rende 288 DPI.
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
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
