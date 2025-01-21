'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ url, isOpen, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when URL changes
    setIsLoading(true)
    setError(null)
    setPageNumber(1)
  }, [url])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully:', { numPages });
    setIsLoading(false)
    setError(null)
    setNumPages(numPages)
    setPageNumber(1)
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error)
    setIsLoading(false)
    setError('Failed to load PDF. Please try again.')
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  console.log('PDF Viewer props:', { url, isOpen })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center">
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-red-500 p-8">
                {error}
              </div>
            )}
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
              className="max-h-[80vh] overflow-auto"
            >
              <Page 
                pageNumber={pageNumber}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
            {!isLoading && !error && numPages > 0 && (
              <div className="flex items-center gap-4 mt-4">
                <Button
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  variant="outline"
                  size="icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p>
                  Page {pageNumber} of {numPages}
                </p>
                <Button
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                  variant="outline"
                  size="icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 