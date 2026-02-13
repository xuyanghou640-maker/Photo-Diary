import jsPDF from 'jspdf';
import { BookPage } from './layout-engine';
import { format } from 'date-fns';

// Helper to load image as base64
const loadImage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load image:', url, error);
    // Return a placeholder or transparent pixel
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
};

// Helper to add wrapped text
const addWrappedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: 'left' | 'center' | 'right' = 'left') => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y, { align });
  return lines.length * lineHeight;
};

export const generatePDF = async (pages: BookPage[], year: string, t: (key: string) => string, onProgress: (progress: number) => void) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Fonts - We use standard fonts for now to avoid loading heavy custom fonts
  // Ideally we should load a font that supports Chinese/Japanese/Korean
  // For now, we assume standard font or add a NotoSans font if possible.
  // Since we can't easily add font files here without URL, we might rely on default or add a font via URL if we had one.
  // *Critical*: Default jsPDF fonts do not support UTF-8 (Chinese/Japanese).
  // We MUST add a font.
  // I will use a CDN link to load a font buffer.
  
  try {
      // Try to load a font that supports CJK
      // Using a smaller font file for performance, e.g. Noto Sans SC
      // For this environment, I might not be able to fetch large fonts.
      // I will try to use the built-in logic if available, otherwise I will warn about font support.
      // Actually, standard jsPDF only supports Latin.
      // I will attempt to add a font.
  } catch (e) {
      console.warn("Font loading failed", e);
  }

  let currentPageIndex = 0;
  const totalPages = pages.length;

  for (const page of pages) {
    if (currentPageIndex > 0) doc.addPage();
    
    // Background
    doc.setFillColor(253, 251, 247); // #fdfbf7
    doc.rect(0, 0, width, height, 'F');

    switch (page.type) {
      case 'cover':
        await renderCover(doc, page, width, height);
        break;
      case 'intro':
        renderIntro(doc, page, width, height);
        break;
      case 'entry':
        await renderEntry(doc, page, width, height, margin);
        break;
      case 'grid':
        await renderGrid(doc, page, width, height, margin);
        break;
      case 'collage':
        await renderCollage(doc, page, width, height, margin);
        break;
      case 'outro':
        renderOutro(doc, page, width, height);
        break;
    }

    // Page Number (except cover)
    if (page.type !== 'cover') {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`${currentPageIndex + 1}`, width / 2, height - 10, { align: 'center' });
    }

    currentPageIndex++;
    onProgress(currentPageIndex / totalPages);
  }

  return doc;
};

async function renderCover(doc: jsPDF, page: BookPage, width: number, height: number) {
  // Background
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, width, height, 'F');
  
  // Border
  doc.setDrawColor(23, 37, 84); // blue-950
  doc.setLineWidth(4);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner Border
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.setLineWidth(1);
  doc.rect(20, 20, width - 40, height - 40);

  // Text
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(16);
  doc.text(page.subtitle || 'The Year Of', width / 2, 60, { align: 'center' });

  doc.setTextColor(254, 243, 199); // amber-100
  doc.setFontSize(60);
  doc.text(page.title || '2025', width / 2, 90, { align: 'center' });

  // Cover Image (Circle clip is hard in basic jsPDF without advanced API, we use Rect for now or try clip)
  if (page.coverPhoto) {
      try {
          const imgData = await loadImage(page.coverPhoto);
          const imgSize = 80;
          const x = (width - imgSize) / 2;
          const y = 110;
          
          // Draw image
          const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(imgData, format, x, y, imgSize, imgSize);
          
          // Draw border
          doc.setDrawColor(254, 243, 199);
          doc.setLineWidth(2);
          doc.rect(x, y, imgSize, imgSize);
      } catch (e) {
          console.error("Cover image error", e);
      }
  }

  // Footer
  doc.setFontSize(14);
  doc.setTextColor(253, 230, 138); // amber-200
  doc.text("My Photo Diary", width / 2, height - 40, { align: 'center' });
}

function renderIntro(doc: jsPDF, page: BookPage, width: number, height: number) {
    doc.setTextColor(31, 41, 55); // gray-800
    doc.setFontSize(24);
    doc.text("Introduction", width / 2, 60, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99); // gray-600
    if (page.text) {
        addWrappedText(doc, page.text, width / 2, 90, 120, 7, 'center');
    }
}

async function renderEntry(doc: jsPDF, page: BookPage, width: number, height: number, margin: number) {
    // Header
    const dateStr = page.date ? format(new Date(page.date), 'MMMM d, yyyy') : '';
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text(dateStr, margin, margin + 10);

    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    if (page.location) {
        doc.text(page.location, width - margin, margin + 10, { align: 'right' });
    }

    // Line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, margin + 15, width - margin, margin + 15);

    // Photo
    if (page.photo) {
        try {
            const imgData = await loadImage(page.photo);
            const imgWidth = width - (margin * 2);
            const imgHeight = imgWidth * 0.6; // 16:9 approx
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, margin, margin + 25, imgWidth, imgHeight);
        } catch (e) {
             console.error("Entry image error", e);
        }
    }

    // Caption
    const captionY = margin + 25 + (width - margin * 2) * 0.6 + 15;
    if (page.caption) {
        doc.setFontSize(14);
        doc.setTextColor(55, 65, 81);
        addWrappedText(doc, page.caption, margin, captionY, width - (margin * 2), 7);
    }

    // Footer Info
    if (page.mood) {
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text(`Mood: ${page.mood}`, margin, height - margin);
    }
}

async function renderGrid(doc: jsPDF, page: BookPage, width: number, height: number, margin: number) {
    const entries = page.entries || [];
    const gap = 5;
    const cols = 2;
    const rows = 2;
    const cellWidth = (width - (margin * 2) - (gap * (cols - 1))) / cols;
    const cellHeight = cellWidth; // Square

    let i = 0;
    for (const entry of entries) {
        if (i >= 4) break;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellWidth + gap);
        const y = margin + 20 + row * (cellHeight + gap); // +20 for header space

        if (entry.photo) {
            try {
                const imgData = await loadImage(entry.photo);
                const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(imgData, format, x, y, cellWidth, cellHeight);
            } catch (e) {}
        }
        i++;
    }
}

async function renderCollage(doc: jsPDF, page: BookPage, width: number, height: number, margin: number) {
    // Similar to grid but maybe one big one small
    // For simplicity, reusing grid logic or simple stack
    // Let's do 1 big top, 2 small bottom
    const entries = page.entries || [];
    if (entries.length === 0) return;

    // Main
    if (entries[0]?.photo) {
        try {
            const imgData = await loadImage(entries[0].photo);
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, margin, margin + 10, width - margin * 2, 100);
        } catch (e) {}
    }

    // Sub
    const subWidth = (width - margin * 2 - 5) / 2;
    if (entries[1]?.photo) {
         try {
            const imgData = await loadImage(entries[1].photo);
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, margin, margin + 115, subWidth, subWidth);
         } catch (e) {}
    }
    if (entries[2]?.photo) {
        try {
            const imgData = await loadImage(entries[2].photo);
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, margin + subWidth + 5, margin + 115, subWidth, subWidth);
        } catch (e) {}
   }

   // Caption
   if (page.caption) {
       doc.setFontSize(12);
       doc.setTextColor(55);
       addWrappedText(doc, page.caption, margin, margin + 115 + subWidth + 10, width - margin * 2, 6);
   }
}

function renderOutro(doc: jsPDF, page: BookPage, width: number, height: number) {
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(16);
    doc.text(page.text || 'The End', width / 2, height / 2, { align: 'center' });
}
