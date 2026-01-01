import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

/**
 * PDF Viewer component that renders all pages
 * @param {string} pdfUrl - URL of the PDF to display
 */
function PDFViewer({ pdfUrl }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderAllPages = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const renderedPages = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext).promise;
          renderedPages.push(canvas.toDataURL());
        }
        
        setPages(renderedPages);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };
    
    if (pdfUrl) {
      renderAllPages();
    }
  }, [pdfUrl]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading PDF...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      {pages.map((dataUrl, index) => (
        <img
          key={index}
          src={dataUrl}
          alt={`Page ${index + 1}`}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      ))}
    </div>
  );
}

/**
 * Check if a URL points to a PDF file
 * @param {string} fileUrl - URL to check
 * @returns {boolean}
 */
export function isPdfFile(fileUrl) {
  if (!fileUrl) return false;
  return fileUrl.toLowerCase().endsWith('.pdf');
}

/**
 * Open PDF in a blob URL for viewing
 * @param {string} pdfUrl - PDF URL
 * @param {function} setUrl - State setter for URL
 * @param {function} setType - State setter for type
 * @param {function} setOpen - State setter for modal open
 * @param {function} toast - Toast function for errors
 */
export async function openPdfBlob(pdfUrl, setUrl, setType, setOpen, toast) {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    setUrl(url);
    setType('pdf');
    setOpen(true);
    return blob;
  } catch (err) {
    console.error('openPdfBlob error:', err);
    toast?.({
      title: 'Error',
      description: 'ไม่สามารถเปิดไฟล์ PDF ได้',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    return null;
  }
}

/**
 * Download a PDF file
 * @param {string} pdfUrl - PDF URL
 * @param {function} toast - Toast function for errors
 * @param {string} filename - Download filename
 */
export async function downloadPdf(pdfUrl, toast, filename = 'document.pdf') {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('downloadPdf error:', err);
    toast?.({
      title: 'Error',
      description: 'ไม่สามารถดาวน์โหลดไฟล์ PDF ได้',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }
}

export default PDFViewer;
