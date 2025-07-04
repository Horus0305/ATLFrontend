import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URLS, apiRequest } from "@/config/api";
import { Loader2, ChevronLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import "/src/pages/results/ReportGenerate/ReportDesign.css";

export default function ReportViewer() {
  const [loading, setLoading] = useState(true);
  const [reportHtml, setReportHtml] = useState("");
  const { reportId } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        
        if (!reportId) {
          throw new Error("Report ID is missing");
        }
        
        console.log("Fetching report with atlId:", reportId);
        
        // Fetch report data from API using atlId
        const response = await apiRequest(`${API_URLS.getReportByAtlId}/${encodeURIComponent(reportId)}`);
        
        if (!response.ok || !response.report) {
          throw new Error("Failed to fetch report data");
        }
        
        console.log("Report data received:", response);
        
        // Set the report HTML content
        setReportHtml(response.report.reporturl || "");
        
      } catch (error) {
        console.error("Error fetching report:", error);
        toast({
          title: "Error",
          description: "Failed to load report. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId, toast]);

  const handlePrint = () => {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Get all stylesheets
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';
    styleSheets.forEach(sheet => {
      try {
        if (sheet.href && sheet.href.startsWith(window.location.origin)) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssText += rule.cssText + '\n';
          });
        } else if (!sheet.href) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssText += rule.cssText + '\n';
          });
        }
      } catch (e) {
        console.warn('Could not access stylesheet rules:', e);
      }
    });

    // Add print-specific styles
    cssText += `
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .report-container { width: 595px; height: 842px; margin: 0; padding: 0; box-shadow: none; background-color: white !important; overflow: hidden; }
      .report-page, .report-content { width: 575px; height: 820px; margin: auto; background-color: white !important; }
      .header-section, .product-section, .table-section, .notes-section, .signatures-section { background-color: #f4efef !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; break-inside: avoid; }
      img { display: block !important; break-inside: avoid; page-break-inside: avoid; }
      table { break-inside: avoid; page-break-inside: avoid; }
      .equipment-table, .results-table { border-collapse: collapse !important; }
      .table-row { border: none !important; }
      .table-row:first-child .table-cell { border: 0.2px solid rgb(4, 4, 4) !important; }
      .table-cell { background-color: rgba(255, 255, 255, 0.002) !important; border: 0.2px solid rgb(4, 4, 4) !important; }
      .table-cell:first-child { border: 0.2px solid rgb(4, 4, 4) !important; }
      .header-cell { background-color: rgba(31, 31, 31, 0.1) !important; font-weight: 500; }
      .table { border: none !important; }
      .report-content { position: relative; page-break-after: always; }
      @page { margin-bottom: 40px; }
      .report-container { page-break-after: always; }
      .back-button, .download-button { display: none !important; }
    `;

    // Get the report containers
    const reportContainers = document.querySelectorAll('.report-container');
    const reportHTML = Array.from(reportContainers).map(container => {
      return container.outerHTML;
    }).join('\n');

    // Write content to iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Report - ${reportId}</title>
          <style>${cssText}</style>
        </head>
        <body>
          ${reportHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (error) {
        console.error('Print failed:', error);
        toast({
          title: "Error",
          description: "Failed to print report. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
  };

  const handleDownload = () => {
    try {
      // Create a blob with the HTML content
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${reportId.replace(/\//g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <div className="flex sticky top-0 z-50 items-center bg-white border-b p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="flex gap-2 items-center back-button mr-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">Test Report - {reportId}</h1>
        <div className="flex gap-2 items-center ml-auto">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="download-button"
          >
            <Download className="mr-2 w-4 h-4" />
            Print PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="download-button"
          >
            <Download className="mr-2 w-4 h-4" />
            Download HTML
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading report...</p>
        </div>
      ) : (
        <div className="reports-wrapper">
          <div 
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </div>
      )}

      <style jsx global>{`
        .report-container {
          width: 595px;
          height: 842px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .report-page {
          width: 575px;
          height: 820px;
          display: flex;
          flex-direction: column;
        }

        .reports-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          gap: 2rem;
          max-width: 100%;
          overflow-x: hidden;
          margin-top: 0;
        }

        @media (max-width: 595px) {
          .report-container,
          .report-page,
          .report-content {
            max-width: 100%;
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  );
} 