import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ChevronLeft, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import "/src/pages/results/ReportGenerate/ReportDesign.css";
import "/src/pages/results/ReportGenerate/ReportDesign.js";
import { API_URLS, apiRequest } from "@/config/api";
import { useParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

function ReportComp({ test, onSave, testId: propTestId }) {
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [testStandards, setTestStandards] = useState([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams();
  const [showNablImage, setShowNablImage] = useState(true);

  // List of editable elements exactly as in report.html
  const editableElements = [
    ".report-number",
    ".report-title",
    ".order-details",
    ".company-details",
    ".date-section",
    ".product-info",
    ".test-title",
    ".lab-reference",
    ".customer-reference",
    ".sample-note",
    ".notes-section",
  ];

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const fetchTestStandards = async () => {
    try {
      if (!test) {
        console.error("No test object available");
        return;
      }
      console.log("Fetching test standards...");
      const response = await apiRequest(API_URLS.getTestStandards);
      console.log("Test standards API response:", response);
      if (response.ok && response.standards) {
        // Find standards for the current material and test type
        const relevantStandards = response.standards.filter(
          (standard) =>
            standard.material === test.material &&
            standard.testType === test.testType
        );
        setTestStandards(relevantStandards);
      }
    } catch (error) {
      console.error("Error fetching test standards:", error);
      toast({
        title: "Error",
        description: "Failed to fetch test standards",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (test) {
      console.log("Test object structure:", JSON.stringify(test, null, 2));
      fetchTestStandards();
      
      // If there's a saved report, use it instead of the template
      if (test.reporturl) {
        console.log("Loading saved report from database");
        // Extract the body content from the saved report
        const savedReportContent = test.reporturl.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || test.reporturl;
        setReportHtml(savedReportContent);
      } else {
        // Load the report template and populate with test data
        fetch("/src/pages/results/ReportGenerate/report.html")
          .then(response => response.text())
          .then(html => {
            // Extract only the body content
            const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || "";
            
            // Replace placeholders with actual data
            let dynamicHtml = bodyContent;
            
            if (test) {
              // Replace report number and order number
              dynamicHtml = dynamicHtml.replace(
                /<div class="report-number">.*?<\/div>/,
                `<div class="report-number">Report No. ${test?.atlId}</div>`
              );
              
              dynamicHtml = dynamicHtml.replace(
                /<div class="order-details">.*?<\/div>/s,
                `<div class="order-details">
                  Order No.* ${test?.atlId}
                  <br />
                  ULR: TC874925000000001F
                </div>`
              );

              // Replace company details with proper null checks
              dynamicHtml = dynamicHtml.replace(
                /<div class="company-details">.*?<\/div>/s,
                `<div class="company-details">
                  Company Name: ${test?.clientName || 'N/A'}<br>
                  Company Address: ${test?.address || 'N/A'}
                </div>`
              );

              // Replace dates
              const formattedDate = formatDate(test.date);
              const completionDate = test.completionDate ? formatDate(test.completionDate) : formattedDate;
              
              dynamicHtml = dynamicHtml.replace(
                /<div class="date">.*?<\/div>/,
                `<div class="date">Date: ${formattedDate}</div>`
              );

              dynamicHtml = dynamicHtml.replace(
                /<div class="receipt-date">.*?<\/div>/s,
                `<div class="receipt-date">
                  Date of Receipt: ${formattedDate}<br>
                  Date of Testing: ${completionDate}
                </div>`
              );

              // Replace client details with proper null checks
              dynamicHtml = dynamicHtml.replace(
                /<div class="client-details">.*?<\/div>/s,
                `<div class="client-details">
                  Client Name: ${test?.clientName || 'N/A'}<br>
                  Contact: ${test?.contactNo || 'N/A'}
                </div>`
              );

              // Get the first test from the tests array
              const firstTest = test.tests?.[0];
              if (firstTest) {
                // Replace product info
                dynamicHtml = dynamicHtml.replace(
                  /<div class="product-info">.*?<\/div>/s,
                  `<div class="product-info">
                    Product Name: ${test.material || 'N/A'}<br>
                    Material ID: ${test?.materialId || 'N/A'}<br>
                    Test Standard: ${testStandards.length > 0 
                      ? testStandards.map(standard => standard.standard).join(", ")
                      : firstTest.tests?.[0]?.standard || 'N/A'}<br>
                    Condition: Satisfactory<br>
                    Description: ${firstTest.material || 'N/A'}
                  </div>`
                );

                // Replace test title
                dynamicHtml = dynamicHtml.replace(
                  /<div class="test-title">.*?<\/div>/,
                  `<div class="test-title">${
                    test.testType?.toLowerCase().includes('chemical') 
                      ? `Chemical Analysis of ${test.material}` 
                      : test.testType?.toLowerCase().includes('mechanical')
                        ? `Mechanical Analysis of ${test.material}`
                        : test.testType || 'N/A'
                  }</div>`
                );

                // Replace lab reference
                dynamicHtml = dynamicHtml.replace(
                  /<div class="lab-reference">.*?<\/div>/s,
                  `<div class="lab-reference">
                    Lab Reference No. ${test?.testId || 'N/A'}<br>
                    Test Period: ${formattedDate} to ${completionDate}<br><br>
                  </div>`
                );

                // Replace customer reference with proper null checks
                dynamicHtml = dynamicHtml.replace(
                  /<div class="customer-reference">.*?<\/div>/,
                  `<div class="customer-reference">Customer's Reference: ${test?.clientName || 'N/A'}</div>`
                );

                // Generate equipment table rows
                if (test.equipmenttable) {
                  dynamicHtml = dynamicHtml.replace(
                    /<div class="table equipment-table">.*?<\/div>/s,
                    `<div class="table equipment-table">${test.equipmenttable}</div>`
                  );
                }

                // Generate results table rows
                if (test.resulttable) {
                  dynamicHtml = dynamicHtml.replace(
                    /<div class="table results-table">.*?<\/div>/s,
                    `<div class="table results-table">${test.resulttable}</div>`
                  );
                }
              }

              // Get signature details based on test type
              const getSignatureDetails = () => {
                const isChemical = test.testType?.toLowerCase() === 'chemical';
                return {
                  image: isChemical 
                    ? "https://cdn.builder.io/api/v1/image/assets/TEMP/61e0073eec73441338ae842f0b8ebf39c3ea9529?placeholderIfAbsent=true"
                    : "https://res.cloudinary.com/dzus0pcxr/image/upload/v1747115216/jaymit_sir_sign_vyzyyo.png",
                  name: isChemical ? "Nisha Kamble" : "Jaymit Mali",
                  position: isChemical ? "Quality Manager" : "Technical Manager",
                  designation: isChemical ? "Chemical Signatory" : "Mechanical Signatory"
                };
              };

              const signatureDetails = getSignatureDetails();

              // Replace signature details in both signature sections
              const replaceSignatureDetails = (htmlContent) => {
                // Replace first signature section
                let updatedHtml = htmlContent.replace(
                  /<div class="signatures-section">[\s\S]*?<div class="signatures-left">[\s\S]*?<div class="signature-block">[\s\S]*?<img[^>]*class="signature-image"[^>]*>[\s\S]*?<div class="signature-details">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
                  `<div class="signatures-section">
                    <div class="signatures-left">
                      <div class="signature-block">
                        <img src="${signatureDetails.image}" class="signature-image" alt="Signature" />
                        <div class="signature-details">
                          ${signatureDetails.name}
                          <br />
                          ${signatureDetails.position}
                          <br />
                          ${signatureDetails.designation}
                        </div>
                      </div>`
                );

                // Replace second signature section
                updatedHtml = updatedHtml.replace(
                  /<div class="signatures-section-2">[\s\S]*?<div class="signatures-left">[\s\S]*?<div class="signature-block">[\s\S]*?<img[^>]*class="signature-image"[^>]*>[\s\S]*?<div class="signature-details">[\s\S]*?<\/div>[\s\S]*?<\/div>/,
                  `<div class="signatures-section-2">
                    <div class="signatures-left">
                      <div class="signature-block">
                        <img src="${signatureDetails.image}" class="signature-image" alt="Signature" />
                        <div class="signature-details">
                          ${signatureDetails.name}
                          <br />
                          ${signatureDetails.position}
                          <br />
                          ${signatureDetails.designation}
                        </div>
                      </div>`
                );

                return updatedHtml;
              };

              // Apply signature changes to both signature sections
              dynamicHtml = replaceSignatureDetails(dynamicHtml);
            }

            setReportHtml(dynamicHtml);
          })
          .catch(error => {
            console.error("Error loading report template:", error);
            toast({
              title: "Error",
              description: "Failed to load report template",
              variant: "destructive",
            });
          });
      }
    }
  }, [test]);

  // Separate useEffect for handling test standards updates
  useEffect(() => {
    if (testStandards.length > 0) {
      // Update report with test standards if needed
      console.log("Test standards updated:", testStandards);
    }
  }, [testStandards]);

  useEffect(() => {
    let currentPage = 1;
    let isLocked = false;
    const LOCK_DURATION = 1000;

    // Function to check if section overlaps with footer or exceeds content area
    function checkSectionOverflow(section) {
      if (!section) return true;

      const reportContent = document.querySelector(".report-content");
      const footer = document.querySelector(".footer-logo");
      if (!reportContent || !footer) return true;

      const sectionRect = section.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const contentRect = reportContent.getBoundingClientRect();

      // Check if section bottom overlaps with footer or exceeds content height
      const sectionBottom = sectionRect.bottom;
      const footerTop = footerRect.top;
      const contentBottom = contentRect.bottom - 20; // 20px buffer

      return sectionBottom >= footerTop || sectionBottom >= contentBottom;
    }

    // Function to check if there's enough space for a section
    function hasEnoughSpace(sectionClass) {
      const section = document.querySelector(sectionClass);
      if (!section) return false;

      // Check if any previous sibling sections overflow
      let currentSection = section.previousElementSibling;
      while (currentSection) {
        if (checkSectionOverflow(currentSection)) {
          return false;
        }
        currentSection = currentSection.previousElementSibling;
      }

      // Check if this section would overflow
      return !checkSectionOverflow(section);
    }

    // Function to check content changes and adjust layout
    function checkContentChanges() {
      if (isLocked) return;
      isLocked = true;

      const notes1 = document.querySelector(".notes-section");
      const signatures1 = document.querySelector(".signatures-section");

      // First check notes section
      if (notes1 && checkSectionOverflow(notes1)) {
        forcePageTwo(".notes-section", ".notes-section-2");
        forcePageTwo(".signatures-section", ".signatures-section-2");
      } else if (signatures1 && checkSectionOverflow(signatures1)) {
        // If notes fit but signatures don't, move only signatures
        forcePageTwo(".signatures-section", ".signatures-section-2");
      }

      setTimeout(() => {
        isLocked = false;
      }, LOCK_DURATION);
    }

    // Function to force page 2 display for a section
    function forcePageTwo(section1Class, section2Class) {
      const section1 = document.querySelector(section1Class);
      const section2 = document.querySelector(section2Class);

      if (!section1 || !section2) return;

      // Synchronize content between notes sections before moving to page 2
      if (section1Class === ".notes-section") {
        section2.innerHTML = section1.innerHTML;
      }

      section1.style.transition = "opacity 0.3s ease-out";
      section2.style.transition = "opacity 0.3s ease-out";

      section1.style.opacity = "0";
      setTimeout(() => {
        section1.style.display = "none";
        section2.style.display = section1Class === ".signatures-section" ? "flex" : "block";
        section2.style.opacity = "1";
        checkSecondPageVisibility();
      }, 300);
      
      currentPage = 2;
    }

    // Function to check if notes are on page 2
    function areNotesOnPageTwo() {
      const notes1 = document.querySelector(".notes-section");
      const notes2 = document.querySelector(".notes-section-2");
      return notes1 && notes2 && notes1.style.display === "none" && notes2.style.display !== "none";
    }

    // Function to check if second page is needed
    function checkSecondPageVisibility() {
      const notes2 = document.querySelector(".notes-section-2");
      const signatures2 = document.querySelector(".signatures-section-2");
      const secondPage = document.querySelectorAll(".report-container")[1];

      if (!secondPage) return;

      const isNotes2Visible = notes2 && notes2.style.display !== "none";
      const isSignatures2Visible = signatures2 && signatures2.style.display !== "none";

      if (!isNotes2Visible && !isSignatures2Visible) {
        secondPage.style.display = "none";
      } else {
        secondPage.style.display = "flex";
      }
    }

    // Initialize page state
    function initializePageState() {
      const signatures1 = document.querySelector(".signatures-section");
      const signatures2 = document.querySelector(".signatures-section-2");
      const notes1 = document.querySelector(".notes-section");
      const notes2 = document.querySelector(".notes-section-2");

      if (!signatures1 || !signatures2 || !notes1 || !notes2) return;

      // Add smooth transitions
      signatures1.style.transition = "opacity 0.3s ease-out";
      signatures2.style.transition = "opacity 0.3s ease-out";
      notes1.style.transition = "opacity 0.3s ease-out";
      notes2.style.transition = "opacity 0.3s ease-out";

      // Reset opacity and display
      signatures1.style.opacity = "1";
      signatures2.style.opacity = "1";
      notes1.style.opacity = "1";
      notes2.style.opacity = "1";

      // Initially show everything on page 1
      notes1.style.display = "block";
      notes2.style.display = "none";
      signatures1.style.display = "flex";
      signatures2.style.display = "none";

      // Check for overflow and adjust layout
      checkContentChanges();
    }

    // Add MutationObserver to sync notes content between pages
    function setupNotesSync() {
      const notes1 = document.querySelector(".notes-section");
      const notes2 = document.querySelector(".notes-section-2");
      
      if (!notes1 || !notes2) return;

      // Create MutationObserver to watch for content changes in notes section 1
      const notesObserver = new MutationObserver((mutations) => {
        // Sync content to notes section 2
        notes2.innerHTML = notes1.innerHTML;
      });

      // Observe the first notes section for changes
      notesObserver.observe(notes1, { 
        childList: true, 
        subtree: true, 
        characterData: true,
        attributes: false 
      });

      return notesObserver;
    }

    // Setup event listeners
    function setupEventListeners() {
      // Create MutationObserver to watch for content changes
      const contentObserver = new MutationObserver(() => {
        checkContentChanges();
      });

      // Setup notes sync observer
      const notesObserver = setupNotesSync();

      // Observe both notes and signatures sections
      const notes = document.querySelector(".notes-section");
      const signatures = document.querySelector(".signatures-section");

      if (notes) {
        contentObserver.observe(notes, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: true 
        });
      }

      if (signatures) {
        contentObserver.observe(signatures, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: true 
        });
      }

      // Handle window resize
      const handleResize = () => {
        if (!isLocked) {
          initializePageState();
        }
      };

      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("load", initializePageState, { passive: true });

      return () => {
        contentObserver.disconnect();
        if (notesObserver) notesObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("load", initializePageState);
      };
    }

    // Initialize
    const cleanup = setupEventListeners();
    initializePageState();

    // Cleanup on component unmount
    return cleanup;
  }, [reportHtml]); // Only run when reportHtml changes

  useEffect(() => {
    if (isEditingEnabled) {
      enableEditing();
    } else {
      disableEditing();
    }
  }, [isEditingEnabled]);

  const enableEditing = () => {
    const reportContainer = document.querySelector(".report-content");
    if (!reportContainer) return;

    editableElements.forEach(selector => {
      const elements = reportContainer.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.querySelector("img")) {
          element.contentEditable = "true";
        }
      });
    });

    // Make notes-section-2 also editable
    const notes2 = document.querySelector(".notes-section-2");
    if (notes2 && !notes2.querySelector("img")) {
      notes2.contentEditable = "true";
    }

    // Check NABL logo visibility when enabling editing
    checkNablLogoVisibility();
  };

  const disableEditing = () => {
    const reportContainer = document.querySelector(".report-content");
    if (!reportContainer) return;

    editableElements.forEach(selector => {
      const elements = reportContainer.querySelectorAll(selector);
      elements.forEach(element => {
        element.contentEditable = "false";
      });
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Get both report containers
      const reportContainers = document.querySelectorAll(".report-container");
      if (!reportContainers || reportContainers.length === 0) return;

      // Get all stylesheets
      const styleSheets = Array.from(document.styleSheets);
      let cssText = '';

      // Extract CSS from all stylesheets
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

      // Add additional styles to disable editing and handle NABL image visibility
      cssText += `
        [contenteditable="true"] {
          box-shadow: none !important;
          border-radius: 0 !important;
          cursor: default !important;
          pointer-events: none !important;
        }
        .edit-button, .download-button, .nabl-checkbox-container {
          display: none !important;
        }
        .table-cell[contenteditable="true"] {
          box-shadow: none !important;
          pointer-events: none !important;
        }
        .logo-left {
          opacity: ${showNablImage ? '1' : '0'} !important;
          visibility: ${showNablImage ? 'visible' : 'hidden'} !important;
        }
      `;

      // Create a complete HTML document with both pages
      const completeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Report - ${test?.atlId}</title>
            <style>
              ${cssText}
            </style>
          </head>
          <body>
            ${Array.from(reportContainers).map(container => {
              // Clone the container to avoid modifying the original
              const clone = container.cloneNode(true);
              
              // Remove any editing-related attributes and classes
              clone.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
                el.removeAttribute('style');
                el.classList.remove('editing');
              });

              // Remove any editing buttons
              clone.querySelectorAll('.edit-button, .download-button').forEach(el => {
                el.remove();
              });

              // Ensure NABL logo visibility is properly set in both pages
              const nablLogos = clone.querySelectorAll('.logo-left');
              nablLogos.forEach(logo => {
                if (logo) {
                  logo.style.opacity = showNablImage ? '1' : '0';
                  logo.style.visibility = showNablImage ? 'visible' : 'hidden';
                }
              });

              return clone.outerHTML;
            }).join('\n')}
          </body>
        </html>
      `;

      // Save the report
      await onSave(completeHtml);

      // Update the local state with the saved content
      setReportHtml(completeHtml);

      toast({
        title: "Success",
        description: "Report saved successfully. Reloading page...",
      });

      // Disable editing
      setIsEditingEnabled(false);
      disableEditing();

      // Wait for a short moment to show the success message
      setTimeout(() => {
        // Reload the page to show the saved changes
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (isEditingEnabled) {
      setIsEditingEnabled(false);
    }

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
    console.log(cssText);
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
      .edit-button, .download-button, .nabl-checkbox-container { display: none !important; }
    `;

    // Get the report containers as they are (with inline styles)
    const reportContainers = document.querySelectorAll('.report-container');
    const reportHTML = Array.from(reportContainers).map(container => {
      // Deep clone the node to preserve inline styles and current state
      return container.outerHTML;
    }).join('\n');

    // Write content to iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Report - ${test?.atlId}</title>
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

  const getTestId = () => test?._id || test?.id || propTestId || params.testId;

  const handleApproveReport = async () => {
    try {
      setIsApproving(true);
      const testId = getTestId();
      const response = await apiRequest(
        API_URLS.approveIndividualReport(testId),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: test.atlId,
            testType: test.testType,
            material: test.material,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report approved successfully",
        });
        window.history.back();
      }
    } catch (error) {
      console.error("Error approving report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve report",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectReport = async () => {
    if (!rejectionRemark.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRejecting(true);
      const testId = getTestId();
      const response = await apiRequest(
        API_URLS.rejectIndividualReport(testId),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: test.atlId,
            testType: test.testType,
            material: test.material,
            remark: rejectionRemark.trim(),
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report rejected successfully",
        });
        setShowRejectDialog(false);
        window.history.back();
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject report",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Update the useEffect for NABL image visibility
  useEffect(() => {
    const nablLogos = document.querySelectorAll('.logo-left');
    nablLogos.forEach(logo => {
      if (logo) {
        logo.style.opacity = showNablImage ? '1' : '0';
        logo.style.visibility = showNablImage ? 'visible' : 'hidden';
      }
    });
  }, [showNablImage]);

  // Update the checkbox handler
  const handleNablToggle = (checked) => {
    setShowNablImage(checked);
    const nablLogos = document.querySelectorAll('.logo-left');
    nablLogos.forEach(logo => {
      if (logo) {
        logo.style.opacity = checked ? '1' : '0';
        logo.style.visibility = checked ? 'visible' : 'hidden';
      }
    });
  };

  // Update checkNablLogoVisibility to check both pages
  const checkNablLogoVisibility = () => {
    const nablLogos = document.querySelectorAll('.logo-left');
    if (nablLogos.length > 0) {
      // Check the first logo's visibility state
      const firstLogo = nablLogos[0];
      const isVisible = firstLogo.style.opacity !== '0' && firstLogo.style.visibility !== 'hidden';
      setShowNablImage(isVisible);
    }
  };

  return (
    <div className="relative min-h-screen bg-white">
      <div className="flex sticky top-0 z-50 items-center -mt-3 bg-white border-b">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex gap-2 items-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="mb-1 -ml-3">
            {console.log("Report data:", test)}
            <h1 className="text-lg font-semibold">Edit Report</h1>
            <div className="flex gap-3 items-center">
              <p className="text-sm text-muted-foreground">
                ATL ID: {test?.atlId} | Material: {test?.material}
              </p>
              {console.log("Report approval status:", test?.testReportApproval)}
              {console.log("Report remark:", test?.reportRemark)}
              {test?.testReportApproval === -1 && (
                <p className="text-sm text-red-600">
                  <span className="font-medium">Rejection Remark:</span> {test?.reportRemark || "very bad"}
                </p>
              )}
            </div>
          </div>
          {/* Only show approval/reject buttons for superadmin when report is pending approval */}
          {user?.role === 0 && test?.testReportApproval === 1 && (
            <div className="flex gap-2">
              <Button
                onClick={handleApproveReport}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="destructive"
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </div>
          )}
          {/* Only show edit controls if report is not approved */}
          {test?.testReportApproval !== 2 && (
            <>
              {isEditingEnabled && (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsEditingEnabled(!isEditingEnabled)}
                disabled={isSaving}
                className="edit-button"
              >
                {isEditingEnabled ? "Disable Editing" : "Enable Editing"}
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 items-center ml-auto">
          {isEditingEnabled && (
            <div className="flex gap-2 items-center mr-2 nabl-checkbox-container">
              <Checkbox
                id="nabl-visibility"
                checked={showNablImage}
                onCheckedChange={handleNablToggle}
              />
              <label
                htmlFor="nabl-visibility"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show NABL Logo
              </label>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="download-button"
          >
            <Download className="mr-2 w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this report. This will be visible to the section head.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectionRemark}
              onChange={(e) => setRejectionRemark(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectReport}
              variant="destructive"
              disabled={isRejecting || !rejectionRemark.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="reports-wrapper">
        <div 
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />
      </div>

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

        .company-logo {
          aspect-ratio: 1.06;
          object-fit: contain;
          object-position: center;
          width: 69px;
          align-self: flex-end;
        }

        .report-content {
          width: 575px;
          height: 820px;
          background-color: rgba(255, 255, 255, 0);
          border: 1px solid rgba(0, 0, 0, 1);
          display: flex;
          flex-direction: column;
          overflow: visible;
          position: relative;
        }

        .logo-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 559px;
          height: 57px;
          padding: 0;
          margin: 0 auto;
          position: relative;
        }

        .logo-left {
          margin-top: 5px;
          height: 50px;
          width: auto;
          object-fit: contain;
          transition: opacity 0.2s ease-in-out;
          position: absolute;
          left: 0;
        }

        .logo-center {
          height: 45px;
          width: auto;
          object-fit: contain;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .logo-right {
          height: 50px;
          width: auto;
          object-fit: contain;
          position: absolute;
          right: 0;
        }

        .divider-line {
          object-fit: contain;
          object-position: center;
          width: 559px;
          margin-top: 3px;
          margin-left: 8px;
        }

        .header-section {
          background-color: #f4efef;
          display: flex;
          align-items: stretch;
          margin: 5px 10px 5px 10px;
          padding: 12px 10px;
          flex-direction: column;
          overflow: visible;
          border-radius: 5px;
          height: auto;
          position: relative;
        }

        .header-top {
          display: flex;
          padding-top: -15px;
          width: 100%;
          margin-bottom: 0px;
        }

        .report-number {
          font-size: 10px;
          font-weight: normal;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          line-height: 1.2;
          flex: 1;
          max-width: 30%;
          position: block;
        }

        .report-title {
          text-shadow: 0px 5px 7px rgba(0, 0, 0, 0.25);
          font-size: 12px;
          text-align: center;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 800;
          line-height: 1;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          margin-top: -1px;
        }

        .date {
          font-size: 10px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
          text-align: right;
          flex: 1;
        }

        .order-details {
          font-size: 10px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
          line-height: 1.4;
          margin-top: 3px;
          max-width: 65%;
        }

        .company-details {
          font-size: 10px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
          line-height: 1.2;
          margin-top: 2px;
          max-width: 65%;
          
        }

        .date-section {
          position: absolute;
          top: 12px;
          right: 10px;
          text-align: right;
          font-size: 10px;
          line-height: 1.4;
          margin-top: -1px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
        }

        .receipt-date {
          margin-top: 2px;
        }

        .client-details {
          margin-top: 2px;
          line-height: 1.2;
        }

        .product-section,
        .product-section[contenteditable="true"] {
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          display: flex;
          align-items: stretch;
          color: rgba(0, 0, 0, 1);
          flex-wrap: wrap;
          margin: 5px 10px 5px 10px;
          padding: 12px 10px;
          height: auto;
          position: relative;
          overflow: visible;
        }

        .product-info {
          font-size: 10px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
          line-height: 12px;
          margin: 12px 0;
          white-space: normal;
          overflow-wrap: break-word;
          word-wrap: break-word;
          width: 37%;
        }

        .product-info br {
          display: block;
          margin: 2px 0;
        }

        .test-info {
          display: flex;
          padding-bottom: -20px;
          flex: 1;
        }

        .test-title {
          text-shadow: 0px 5px 7px rgba(0, 0, 0, 0.25);
          font-size: 11px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 700;
          line-height: 1;
          text-align: center;
          margin-left: -50px;
          margin-top: -2px;
          transform: translateX(-10%);
          position: relative;
          width: 100%;
          display: block;
          width: calc(100% + 200px);
          max-width: 300px;
        }

        .sample-note {
          font-size: 10px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 400;
          line-height: 1.4;
          margin-top: -10px;
          height: 12px;
          transform: translateX(90%);
        }

        .sample-note[contenteditable="true"] {
          margin-top: -10px;
          height: 12px;
          transform: translateX(90%);
        }

        .reference-info,
        .reference-info[contenteditable="true"] {
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 400;
          text-align: right;
          margin-top: 12px;
          margin-left: 50px;
          padding-bottom: 0px;
        }

        .lab-reference {
          line-height: 12px;
          padding-top: 1px;
          text-align: right;
          white-space: nowrap;
          margin-top: 0px;
          height: 25px;
          width: 185px;
        }

        .lab-reference[contenteditable="true"] {
          margin-bottom: -25px;
        }

        .customer-reference {
          line-height: 1.2;
          margin-top: 5px;
        }

        .customer-reference[contenteditable="true"] {
          line-height: 1.2;
          margin-top: -55px;
        }

        .table-section {
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          height: auto;
          width:auto;
          display: flex;
          min-height: 200px;
          margin: 5px 10px 5px 10px;
          padding: 12px 10px;
          flex-direction: column;
          overflow: visible;
          align-items: stretch;
        }

        .equipment-title,
        .results-title {
          color: rgba(0, 0, 0, 1);
          text-shadow: 0px 5px 7px rgba(0, 0, 0, 0.25);
          font-size: 11px;
          font-family: Geologica, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 700;
          line-height: 1;
          text-align: center;
          width: 100%;
          margin-top: -5px;
          margin-bottom: 5px;
        }

        .results-title {
          margin-top: 7px;
        }

        

        .table {
          width: 100%;
          border: none;
          border-collapse: collapse;
          text-align: center;
          align-items: center;
        }

        .table-row {
          border-bottom: 0.2px solid rgb(4, 4, 4);
        }

        .table-row:first-child {
          border-top: 0.2px solid rgb(4, 4, 4);
        }

        .table-cell {
          border-right: 0.2px solid rgb(4, 4, 4);
          padding: 1px 4px;
          font-size: 9px;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          min-height: 15px;
          height: auto;
          display: flex;
          align-items: center;
          white-space: normal;
          overflow: visible;
          line-height: 1.2;
        }

        .table-cell:first-child {
          border-left: 0.2px solid rgb(4, 4, 4);
        }

        .header-cell {
          background-color: rgba(31, 31, 31, 0.08);
          font-weight: 500;
          text-align: center;
          font-size: 10px;
          min-height: 10px;
        }

        .equipment-table .table-row {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr;
        }

        .results-table .table-row {
          display: grid;
          grid-template-columns: 40px 1.2fr 0.8fr 2fr;
        }

        .results-table .table-cell:nth-child(4) {
          white-space: normal;
          text-align: left;
          line-height: 1.2;
          padding: 2px 4px;
        }

        .results-table .table-cell:nth-child(3) {
          justify-content: center;
        }

        .results-table .table-cell:first-child {
          justify-content: center;
        }

        .notes-section,
        .notes-section[contenteditable="true"] {
          display: block;
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          margin: 5px 10px 5px 10px;
          padding: 8px 10px;
          overflow: visible;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 10px;
          color: rgba(0, 0, 0, 1);
          font-weight: 400;
          line-height: 12px;
          position: relative;
          overflow: visible;
          height: auto;
        }

        .notes-section-2,
        .notes-section-2[contenteditable="true"] {
          display: none;
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          margin: 5px 10px 5px 10px;
          padding: 8px 10px;
          overflow: visible;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 10px;
          color: rgba(0, 0, 0, 1);
          font-weight: 400;
          line-height: 12px;
          position: relative;
          overflow: visible;
          height: auto;
        }

        .notes-section[contenteditable="true"] {
          min-height: auto;
        }

        .notes-section-2[contenteditable="true"] {
          min-height: auto;
        }

        .note-title {
          font-family: Geologica, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 700;
        }

        .signatures-section {
          
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          
          margin: 5px 10px 0px 10px;
          padding: 5px 10px 15px;
          align-items: flex-start;
          gap: 20px;
          overflow: visible;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 10px;
          color: rgba(0, 0, 0, 1);
          font-weight: 400;
          flex-wrap: wrap;
          justify-content: space-between;
          min-height: 70px;
          height: auto;
        }

        .signatures-section-2 {
          
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          margin: 5px 10px 0px 10px;
          padding: 5px 10px 15px;
          align-items: flex-start;
          gap: 20px;
          overflow: visible;
          font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 10px;
          color: rgba(0, 0, 0, 1);
          font-weight: 400;
          flex-wrap: wrap;
          justify-content: space-between;
          min-height: 70px;
          height: auto;
        }

        .signatures-left {
          align-self: stretch;
          display: flex;
          align-items: stretch;
          gap: 13px;
          line-height: 12px;
        }

        .signature-image {
          aspect-ratio: 1.58;
          object-fit: contain;
          object-position: center;
          width: 84px;
          margin-top: -7px;
        }

        .signature-image-2 {
          aspect-ratio: 2.2;
          object-fit: contain;
          object-position: center;
          width: 88px;
          margin-bottom: 7px;
        }

        .signature-details {
          margin-top: -5px;
        }

        .certification-image {
          aspect-ratio: 1.11;
          object-fit: contain;
          object-position: center;
          padding-top: 1px;
          width: 90px;
          flex-shrink: 0;
          margin-left: 5px;
        }

        .nabl-section {
          display: flex;
          align-items: stretch;
          white-space: nowrap;
          text-align: center;
          line-height: 1.2;
        }

        .nabl-logo {
          aspect-ratio: 0.93;
          object-fit: contain;
          object-position: center;
          width: 79px;
          flex-shrink: 0;
          transition: display 0.2s ease-in-out;
        }

        .nabl-stamp {
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
          align-self: flex-start;
          aspect-ratio: 1;
          padding: 73px 27px 0;
        }

        .stamp-background {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
          object-position: center;
        }

        .footer-logo {
          aspect-ratio: 4.95;
          object-fit: contain;
          object-position: center;
          width: 183px;
          height: 30px;
          align-self: center;
          margin-top: auto;
          max-width: 100%;
          margin-bottom: 5px;
        }

        .download-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          transition: background-color 0.2s;
        }

        .download-btn:hover {
          background-color: #0056b3;
        }

        .download-btn:active {
          transform: translateY(1px);
        }

        @media (max-width: 595px) {
          .report-container,
          .report-page,
          .report-content,
          .logo-container,
          .divider-line,
          .header-section,
          .table-section,
          .equipment-table,
          .results-table,
          .table,
          .table-row {
            max-width: 100%;
          }

          .company-logo {
            margin-right: 4px;
          }

          .header-section {
            margin-right: 2px;
          }

          .company-details {
            margin-right: 10px;
          }

          .test-title {
            margin-right: 8px;
            margin-left: 10px;
          }

          .sample-note {
            margin-top: 40px;
          }

          .lab-reference {
            margin-left: 10px;
          }

          .notes-section {
            margin-right: 4px;
          }

          .nabl-stamp {
            padding-left: 20px;
            padding-right: 20px;
            white-space: initial;
          }
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4;
            margin: 0;
            bleed: 0;
            width: 595px;
            height: 842px;
          }

          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .edit-button {
            display: none;
          }

          .report-container {
            width: 595px;
            height: 842px;
            margin: 0;
            padding: 0;
            box-shadow: none;
            background-color: white !important;
            overflow: hidden;
          }

          .report-page,
          .report-content {
            width: 575px;
            height: 820px;
            margin: auto;
            background-color: white !important;
          }

          .header-section,
          .product-section,
          .table-section,
          .notes-section,
          .signatures-section {
            background-color: #f4efef !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            break-inside: avoid;
          }

          img {
            display: block !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .equipment-table,
          .results-table {
            border-collapse: collapse !important;
          }

          .table-row {
            border: none !important;
          }

          .table-row:first-child .table-cell {
            border: 0.2px solid rgb(4, 4, 4) !important;
          }

          .table-cell {
            background-color: rgba(255, 255, 255, 0.002) !important;
            border: 0.2px solid rgb(4, 4, 4) !important;
          }

          .table-cell:first-child {
            border: 0.2px solid rgb(4, 4, 4) !important;
          }

          .header-cell {
            background-color: rgba(31, 31, 31, 0.1) !important;
            font-weight: 500;
          }

          .table {
            border: none !important;
          }

          .report-content {
            position: relative;
            page-break-after: always;
          }

          @page {
            margin-bottom: 40px;
          }

          .report-container {
            page-break-after: always;
          }
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

        [contenteditable="true"] {
          box-shadow: 0 0 0 1px #007bff;
          border-radius: 2px;
          min-height: 1em;
          display: inline-block;
        }
        
        .table-cell[contenteditable="true"] {
          display: table-cell;
          box-shadow: inset 0 0 0 1px #007bff;
        }
        
        .company-details[contenteditable="true"] {
          margin-top: 7px;
          padding-top: 2px;
          padding-bottom: 2px;
          font-size: 11px;
          line-height: 1.2;
          max-width: 65%;
        }
        
        .test-title[contenteditable="true"] {
          position: relative;
          top: 0px;
          margin-bottom: 10px;
          display: block;
        }
        
        .reference-info[contenteditable="true"] {
          display: block;
          position: relative;
          line-height: 1.1;
          padding: 2px 0;
          height: 65px;
        }
      `}</style>
    </div>
  );
};

export default ReportComp;