import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Trash2, Calendar } from "lucide-react";
import HandsTable from "@/components/HandsTable";
import { EquipmentSelectionTable } from "../../components/EquipmentSelectionTable";
import { API_URLS, apiRequest } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import EditableTable from "@/components/EditableTable";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTable, setShowTable] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [imageData, setImageData] = useState({});
  const [clientData, setClientData] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [testStandards, setTestStandards] = useState([]);
  const [existingEquipmentTable, setExistingEquipmentTable] = useState(null);
  const [existingResultTable, setExistingResultTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState("");
  const [rejectionRemark, setRejectionRemark] = useState("");
  const test = location.state?.test;
  const { toast } = useToast();
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tempReportData, setTempReportData] = useState(null);

  useEffect(() => {
    console.log("Test object:", test);
    // Check if test exists and has clientName
    if (test) {
      console.log("Full test object for debugging:", test);
      fetchClientData();
      fetchTestStandards();
      checkExistingTables();
    }
  }, [test]);

  const checkExistingTables = async () => {
    try {
      if (!test || !test.atlId || !test.testType || !test.material) {
        console.error("Missing required test information");
        setLoading(false);
        return;
      }

      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId) {
        console.error("Test ID not found in URL");
        setLoading(false);
        return;
      }

      console.log("Checking for existing tables for test ID:", testId);
      const response = await apiRequest(`${API_URLS.TESTS}/${testId}`);

      if (response.ok && response.test) {
        // Find the specific test with matching atlId, testType, AND material
        const testDetail = response.test.tests.find(
          (t) =>
            t.atlId === test.atlId &&
            t.testType === test.testType &&
            t.material === test.material
        );

        if (testDetail) {
          console.log("Found existing test details:", testDetail);

          if (testDetail.equipmenttable) {
            console.log("Found existing equipment table");
            setExistingEquipmentTable(testDetail.equipmenttable);
          }

          if (testDetail.resulttable) {
            console.log("Found existing result table");
            setExistingResultTable(testDetail.resulttable);
            setShowTable(true);
          }

          // Update test status based on testResultStatus field
          console.log("Test result status:", testDetail.testResultStatus);
          console.log("Test result remark:", testDetail.testResultRemark);

          if (testDetail.testResultStatus === "Results Approved") {
            setTestStatus("Results Approved");
          } else if (testDetail.testResultStatus === "Results Rejected") {
            setTestStatus("Results Rejected");
            // Set the rejection remark
            if (testDetail.testResultRemark) {
              setRejectionRemark(testDetail.testResultRemark);
              toast({
                title: "Results Rejected",
                description: `Reason: ${testDetail.testResultRemark}`,
                variant: "destructive",
              });
            }
          } else if (testDetail.equipmenttable && testDetail.resulttable) {
            if (testDetail.testResultStatus === "Pending") {
              setTestStatus("Sent for Approval");
            } else {
              // If no status is set but tables exist, consider it as pending
              setTestStatus("Sent for Approval");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing tables:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add an effect to periodically check for status updates
  // useEffect(() => {
  //   if (test) {
  //     checkExistingTables();
  //   }
  // }, [test]);

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
    }
  };

  const fetchClientData = async () => {
    try {
      if (!test) {
        console.error("No test object available");
        return;
      }

      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId) {
        console.error("Test ID not found in URL");
        return;
      }

      console.log("Fetching test data...");
      const response = await apiRequest(`${API_URLS.TESTS}/${testId}`);
      console.log("Test API response:", response);

      if (response.ok && response.test) {
        // Set client data from the complete test document
        setClientData({
          clientname: response.test.clientName,
          address: response.test.address,
          contactno: response.test.contactNo,
          emailId: response.test.emailId
        });
      } else {
        console.error("Failed to fetch test data:", response);
      }
    } catch (error) {
      console.error("Error fetching test data:", error);
    }
  };

  const fetchEquipmentDetails = async (equipmentIds) => {
    try {
      const response = await apiRequest(API_URLS.getEquipmentByIds, {
        method: "POST",
        body: JSON.stringify({ equipmentIds }),
      });
      if (response.ok) {
        setEquipmentDetails(response.equipment);
      }
    } catch (error) {
      console.error("Error fetching equipment details:", error);
    }
  };

  useEffect(() => {
    if (selectedEquipment.length > 0) {
      const equipmentIds = selectedEquipment.map((eq) => eq._id);
      fetchEquipmentDetails(equipmentIds);
    }
  }, [selectedEquipment]);

  useEffect(() => {
    // Function to load image and convert to base64
    const loadImage = async (path) => {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error loading image:", error);
        return "";
      }
    };

    // Load all images
    const loadAllImages = async () => {
      const images = {
        logo1: await loadImage("/images/image4.png"),
        logo2: await loadImage("/images/image5.png"),
        signature: await loadImage("/images/image1.jpg"),
        stamp: await loadImage("/images/image3.png"),
      };
      setImageData(images);
    };

    loadAllImages();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleGenerateTable = () => {
    setShowTable(true);
  };

  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
  };

  const handleDownload = async () => {
    try {
      const hotContainer = document.querySelector(".handsontable");
      if (!hotContainer) return;

      const containerDiv = hotContainer.closest("[data-headers]");
      if (!containerDiv) return;

      const headers = JSON.parse(
        containerDiv.getAttribute("data-headers") || "[]"
      );
      const data = JSON.parse(
        containerDiv.getAttribute("data-table-content") || "[]"
      );

      // Generate equipment table HTML
      const equipmentTableHtml = `
  <div style="display: flex; justify-content: center; padding-left: 20px; padding-right: 20px; width: 400pt;">
    <table style="border-collapse: collapse; margin: 0 auto; width: 100%;" cellspacing="0">
      <tr style="height: auto">
        <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Equipment</p>
        </td>
        <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Range</p>
        </td>
        <td style="width: 100pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Certificate No.</p>
        </td>
        <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Calibrated date</p>
        </td>
        <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Due Date</p>
        </td>
        <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; background-color: rgba(31, 31, 31, 0.08);">
          <p class="s4" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 10px; font-weight: 500;">Calibrated By</p>
        </td>
      </tr>
      ${equipmentDetails
        .map(
          (equipment) => `
        <tr style="height: 15pt">
          <td style="width: 62pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              equipment.equipment || ""
            }</p>
          </td>
          <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              equipment.range || ""
            }</p>
          </td>
          <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              equipment.cno || ""
            }</p>
          </td>
          <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              new Date(equipment.cdate).toLocaleDateString() || ""
            }</p>
          </td>
          <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              new Date(equipment.ddate).toLocaleDateString() || ""
            }</p>
          </td>
          <td style="width: 84pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt">
            <p class="s1" style="padding-top: 2pt; text-indent: 0pt; text-align: center; font-size: 9px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif;">${
              equipment.cname || ""
            }</p>
          </td>
        </tr>
      `
        )
        .join("")}
    </table>
  </div>`

    // Generate results table HTML
    const resultsTableHtml = `
      <div style="display: flex; justify-content: center; padding-left: 20px; padding-right: 20px; width: 400pt;">
        <table style="border-collapse: collapse; margin: 0 auto; width: 100%;" cellspacing="0">
          ${(() => {
            try {
              // Get merged cells data
              const mergedCellsData =
                typeof containerDiv.getAttribute("data-merged-cells") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-merged-cells") || "[]"
                    )
                  : [];

              // Get column widths and row heights
              const columnWidths =
                typeof containerDiv.getAttribute("data-column-widths") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-column-widths") || "[]"
                    )
                  : [];

              const rowHeights =
                typeof containerDiv.getAttribute("data-row-heights") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-row-heights") || "[]"
                    )
                  : [];

              // Get table content
              const data =
                typeof containerDiv.getAttribute("data-table-content") ===
                "string"
                  ? JSON.parse(
                      containerDiv.getAttribute("data-table-content") || "[]"
                    )
                  : [];

              const mergedCellsMap = new Map();

              // Create a map of merged cells for easy lookup
              mergedCellsData.forEach((mc) => {
                for (let row = mc.row; row < mc.row + mc.rowspan; row++) {
                  for (let col = mc.col; col < mc.col + mc.colspan; col++) {
                    if (row === mc.row && col === mc.col) {
                      mergedCellsMap.set(`${row},${col}`, {
                        rowspan: mc.rowspan,
                        colspan: mc.colspan,
                        value: data[mc.row][mc.col],
                      });
                    } else {
                      mergedCellsMap.set(`${row},${col}`, { skip: true });
                    }
                  }
                }
              });

              return data
                .map((row, rowIndex) => {
                  const rowHeight = rowHeights[rowIndex] || 15;
                  const isFirstRow = rowIndex === 0;
                  let rowHtml = `<tr style="height: ${rowHeight}pt">`;

                  row.forEach((cell, colIndex) => {
                    const mergedCell = mergedCellsMap.get(
                      `${rowIndex},${colIndex}`
                    );
                    const colWidth = columnWidths[colIndex] || 84;

                    if (mergedCell?.skip) {
                      return;
                    }

                    if (mergedCell) {
                      rowHtml += `
                        <td style="width: ${colWidth}pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; ${isFirstRow ? 'background-color: rgba(31, 31, 31, 0.08);' : ''} padding: 1px 1px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif; font-size: ${isFirstRow ? '10px' : '9px'}; font-weight: ${isFirstRow ? '700' : 'normal'}; text-align: center; vertical-align: middle;"
                            rowspan="${mergedCell.rowspan}"
                            colspan="${mergedCell.colspan}">
                          <p class="${isFirstRow ? "s4" : "s1"}" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${mergedCell.value || ""}</p>
                        </td>`;
                    } else {
                      rowHtml += `
                        <td style="width: ${colWidth}pt; border-top-style: solid; border-top-width: 1pt; border-left-style: solid; border-left-width: 1pt; border-bottom-style: solid; border-bottom-width: 1pt; border-right-style: solid; border-right-width: 1pt; ${isFirstRow ? 'background-color: rgba(31, 31, 31, 0.08);' : ''} padding: 1px 1px; font-family: Gulzar, -apple-system, Roboto, Helvetica, sans-serif; font-size: ${isFirstRow ? '10px' : '9px'}; font-weight: ${isFirstRow ? '700' : 'normal'}; text-align: center; vertical-align: middle;">
                          <p class="${isFirstRow ? "s4" : "s1"}" style="padding-top: 2pt; text-indent: 0pt; text-align: center">${cell || ""}</p>
                        </td>`;
                    }
                  });

                  rowHtml += `</tr>`;
                  return rowHtml;
                })
                .join("");
            } catch (error) {
              console.error("Error generating results table HTML:", error);
              return "<tr><td>Error generating table</td></tr>";
            }
          })()}
        </table>
      </div>`;

      // Store the data temporarily
      const tempData = {
        equipmentTableHtml,
        resultsTableHtml
      };

      // Store the data for later use after date dialog
      setTempReportData(tempData);

      // Open the date dialog
      setShowDateDialog(true);

    } catch (error) {
      console.error("Error preparing report:", error);
      toast({
        title: "Error",
        description: "Failed to prepare the report data",
        variant: "destructive",
      });
    }
  };

  // Function to handle the final save after date entry
  const handleFinalSave = async () => {
    try {
      // Validate dates
      if (!fromDate || !toDate) {
        toast({
          title: "Error",
          description: "Both From and To dates are required",
          variant: "destructive",
        });
        return;
      }

      // Make sure To date is not before From date
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      
      if (toDateObj < fromDateObj) {
        toast({
          title: "Error",
          description: "To date cannot be earlier than From date",
          variant: "destructive",
        });
        return;
      }

      // Use the temporarily stored data
      const { equipmentTableHtml, resultsTableHtml } = tempReportData;

      // Check if the report is too large (over 40MB to be safe)
      const reportSize = new Blob([equipmentTableHtml + resultsTableHtml]).size;
      const maxSize = 40 * 1024 * 1024; // 40MB in bytes

      console.log("Report size:", reportSize, "bytes");

      if (reportSize > maxSize) {
        toast({
          title: "Error",
          description:
            "Report is too large to upload. Please reduce the amount of data or contact support.",
          variant: "destructive",
        });
        return;
      }

      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      console.log("Test ID from URL:", testId);
      console.log("Test object:", test);
      console.log("ATL ID:", test?.atlId);

      if (!testId) {
        throw new Error("Test ID not found in URL. Cannot upload report.");
      }

      if (!test?.atlId) {
        throw new Error(
          "ATL ID not found in test object. Cannot upload report."
        );
      }

      // Generate the full report HTML
      const reportHtml = await generateReportHtml(test, equipmentTableHtml, resultsTableHtml);

      // Upload the report to the server
      console.log("Sending report to server...");
      console.log("Equipment table HTML type:", typeof equipmentTableHtml);
      console.log("Result table HTML type:", typeof resultsTableHtml);

      const response = await apiRequest(API_URLS.uploadTestReport(testId), {
        method: "POST",
        body: JSON.stringify({
          atlId: test.atlId,
          testType: test.testType,
          material: test.material,
          equipmenttable: String(equipmentTableHtml),
          resulttable: String(resultsTableHtml),
          reportHtml: reportHtml,
          status: "Test Values Added",
          fromDate: fromDate, // Add the from date
          toDate: toDate // Add the to date
        }),
      });

      console.log("Server response:", response);

      if (!response.ok) {
        throw new Error(response.error || "Failed to upload report");
      }

      // Show success message
      toast({
        title: "Success",
        description: "Report saved successfully",
      });

      // Close the dialog
      setShowDateDialog(false);

      window.location.reload();

      // Download the report after successful save
      const blob = new Blob([reportHtml], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Test_Report_${test.atlId}_${test.testType
        .split("-")[0]
        .trim()}_${test.material}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error handling report:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to save report";
      if (error.message && error.message.includes("request entity too large")) {
        errorMessage =
          "Report is too large to upload. Please reduce the amount of data or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Function to generate the full report HTML
  const generateReportHtml = async (test, equipmentTableHtml, resultsTableHtml) => {
    try {
      // Fetch both template and CSS
      const [templateResponse, cssResponse] = await Promise.all([
        fetch("/images/report-template.html"),
        fetch("/images/ReportDesign.css")
      ]);

      if (!templateResponse.ok) {
        throw new Error(`Failed to fetch report template: ${templateResponse.statusText}`);
      }
      if (!cssResponse.ok) {
        throw new Error(`Failed to fetch CSS: ${cssResponse.statusText}`);
      }

      const [html, css] = await Promise.all([
        templateResponse.text(),
        cssResponse.text()
      ]);
      
      // Extract only the body content
      const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || "";
      
      // Replace placeholders with actual data
      let dynamicHtml = bodyContent;
      
      // Format date to DD-MM-YYYY
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
      };

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

      // Replace company details
      dynamicHtml = dynamicHtml.replace(
        /<div class="company-details">.*?<\/div>/s,
        `<div class="company-details">
          Company Name: ${clientData?.clientname || test?.clientName || 'N/A'}<br>
          Company Address: ${clientData?.address || test?.address || 'N/A'}
        </div>`
      );

      // Replace dates
      const formattedDate = formatDate(test.date);
      const completionDate = test.completionDate ? formatDate(test.completionDate) : formattedDate;
      
      // Format test period dates if available
      const testPeriodFrom = fromDate ? formatDate(fromDate) : formattedDate;
      const testPeriodTo = toDate ? formatDate(toDate) : completionDate;
      
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

      // Replace client details
      dynamicHtml = dynamicHtml.replace(
        /<div class="client-details">.*?<\/div>/s,
        `<div class="client-details">
          Client Name: ${clientData?.clientname || test?.clientName || 'N/A'}<br>
          Contact: ${clientData?.contactno || test?.contactNo || 'N/A'}
        </div>`
      );

      // Replace product info
      dynamicHtml = dynamicHtml.replace(
        /<div class="product-info">.*?<\/div>/s,
        `<div class="product-info">
          Product Name: ${test.material || 'N/A'}<br>
          Material ID: ${test?.materialId || 'N/A'}<br>
          Test Standard: ${testStandards.length > 0 
            ? testStandards.map(standard => standard.standard).join(", ")
            : test.tests?.[0]?.standard || 'N/A'}<br>
          Condition: Satisfactory<br>
          Description: ${test.material || 'N/A'}
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

      // Replace lab reference with test period
      dynamicHtml = dynamicHtml.replace(
        /<div class="lab-reference">.*?<\/div>/s,
        `<div class="lab-reference">
          Lab Reference No. ${test?.atlId || 'N/A'}<br>
          Test Period: ${testPeriodFrom} to ${testPeriodTo}<br><br>
        </div>`
      );

      // Replace customer reference
      dynamicHtml = dynamicHtml.replace(
        /<div class="customer-reference">.*?<\/div>/,
        `<div class="customer-reference">Customer's Reference: ${clientData?.clientname || test?.clientName || 'N/A'}</div>`
      );

      // Replace equipment and results tables
      if (equipmentTableHtml) {
        dynamicHtml = dynamicHtml.replace(
          /<div class="table equipment-table">.*?<\/div>/s,
          equipmentTableHtml
        );
      }

      if (resultsTableHtml) {
        dynamicHtml = dynamicHtml.replace(
          /<div class="table results-table">.*?<\/div>/s,
          resultsTableHtml
        );
      }

      // Get signature details based on test type
      const getSignatureDetails = () => {
        const isChemical = test.testType?.toLowerCase().includes('chemical');
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

      // Add wrapper and additional styles for proper page layout
      const additionalStyles = `
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
          font-size: 11px;
          font-weight: normal;
          line-height: 1.2;
          flex: 1;
          max-width: 30%;
          position: block;
        }

        .report-title {
          text-shadow: 0px 5px 7px rgba(0, 0, 0, 0.25);
          font-size: 12px;
          text-align: center;
          font-family: Geologica, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 800;
          line-height: 1;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          margin-top: -1px;
        }

        .date {
          font-size: 11px;
          text-align: right;
          flex: 1;
        }

        .order-details {
          font-size: 11px;
          line-height: 1.4;
          margin-top: 3px;
          max-width: 65%;
        }

        .company-details {
          font-size: 11px;
          line-height: 1.2;
          margin-top: 2px;
          max-width: 65%;
        }

        .date-section {
          position: absolute;
          top: 12px;
          right: 10px;
          text-align: right;
          font-size: 11px;
          line-height: 1.4;
          margin-top: -1px;
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
          font-family: Geologica, -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 700;
          line-height: 1;
          text-align: center;
          margin-left: -30px;
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
          min-height: 245px;
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
          display: flex;
          border-radius: 5px;
          background-color: rgba(244, 239, 239, 1);
          display: flex;
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
          display: none;
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
      `;

      // Add table-specific styles
      const tableStyles = `
        .table {
          width: 100%;
          border: none;
          border-collapse: collapse;
          text-align: center;
          align-items: center;
        }

        .equipment-table .table-row {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr;
        }

        .results-table .table-row {
          display: grid;
          grid-template-columns: 40px 1.2fr 0.8fr 2fr;
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

        .results-table .table-cell:nth-child(4) {
          white-space: normal;
          text-align: left;
          line-height: 1.2;
          padding: 2px 4px;
        }

        .results-table .table-cell:nth-child(3),
        .results-table .table-cell:first-child {
          justify-content: center;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .equipment-table,
          .results-table {
            border-collapse: collapse !important;
          }
        }
      `;

      // Create a complete HTML document
      const completeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Report - ${test?.atlId}</title>
            <style>
              ${css}
              ${additionalStyles}
              ${tableStyles}
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: white;">
            <div class="reports-wrapper">
              ${dynamicHtml}
            </div>
          </body>
        </html>
      `;

      return completeHtml;
    } catch (error) {
      console.error("Error generating report HTML:", error);
      throw error;
    }
  };

  const handleDelete = () => {
    setShowTable(false);
  };

  const renderExistingEquipmentTable = () => {
    if (!existingEquipmentTable) return null;

    return (
      <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Equipment Table</h2>
          <Button
            onClick={() => {
              // Reset just the equipment table
              setExistingEquipmentTable(null);
              toast({
                title: "Equipment Table Reset",
                description: "You can now select new equipment.",
              });
            }}
            variant="outline"
            className="dark:bg-white dark:text-black"
          >
            Replace Equipment Table
          </Button>
        </div>

        {/* Display the equipment table without editing capability */}
        <div
          className="flex overflow-auto justify-center items-center p-4 rounded-md border equipment-table-display"
          dangerouslySetInnerHTML={{ __html: existingEquipmentTable }}
        />
      </div>
    );
  };

  const renderExistingResultTable = () => {
    if (!existingResultTable) return null;

    return (
      <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Result Table</h2>
          <Button
            onClick={() => {
              // Reset just the result table
              setExistingResultTable(null);
              setShowTable(false);
              toast({
                title: "Result Table Reset",
                description: "You can now create a new result table.",
              });
            }}
            variant="outline"
          >
            Replace Result Table
          </Button>
        </div>
        <EditableTable
          htmlContent={existingResultTable}
          onSave={(updatedHtml) => {
            handleSaveTableUpdate(updatedHtml, "result");
          }}
        />
      </div>
    );
  };

  const handleSaveTableUpdate = async (updatedHtml, tableType) => {
    try {
      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId || !test?.atlId || !test?.testType || !test?.material) {
        throw new Error("Missing required test information");
      }

      console.log(`Saving updated ${tableType} table...`);

      // Extract only the table content from the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = updatedHtml;
      const tableContent = tempDiv.querySelector('.table')?.outerHTML || updatedHtml;

      // Create payload with only the table data
      const payload = {
        atlId: test.atlId,
        testType: test.testType,
        material: test.material
      };

      // Set the appropriate field based on table type
      if (tableType === "equipment") {
        payload.equipmenttable = tableContent;
        // Update local state
        setExistingEquipmentTable(tableContent);
      } else if (tableType === "result") {
        payload.resulttable = tableContent;
        // Update local state
        setExistingResultTable(tableContent);
      }

      // Send update to the server
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testId}/update-table`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.error || `Failed to update ${tableType} table`
        );
      }

      toast({
        title: "Success",
        description: `${
          tableType.charAt(0).toUpperCase() + tableType.slice(1)
        } table updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${tableType} table:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to update ${tableType} table`,
        variant: "destructive",
      });
    }
  };

  const handleSaveEquipment = async () => {
    try {
      if (selectedEquipment.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one equipment",
          variant: "destructive",
        });
        return;
      }

      // Generate equipment table HTML with minimal styling
      const equipmentTableHtml = `
        <table class="table equipment-table" cellspacing="0">
          <tr class="table-row">
            <td class="table-cell header-cell">Equipment Used</td>
            <td class="table-cell header-cell">Range</td>
            <td class="table-cell header-cell">Certificate No.</td>
            <td class="table-cell header-cell">Calibration Date</td>
            <td class="table-cell header-cell">Due Date</td>
            <td class="table-cell header-cell">Calibrated By</td>
          </tr>
          ${equipmentDetails.map((equipment) => `
            <tr class="table-row">
              <td class="table-cell">${equipment.equipment || ""}</td>
              <td class="table-cell">${equipment.range || ""}</td>
              <td class="table-cell">${equipment.cno || ""}</td>
              <td class="table-cell">${new Date(equipment.cdate).toLocaleDateString() || ""}</td>
              <td class="table-cell">${new Date(equipment.ddate).toLocaleDateString() || ""}</td>
              <td class="table-cell">${equipment.cname || ""}</td>
            </tr>
          `).join("")}
        </table>`;

      // Extract the test ID from the URL
      const urlParts = window.location.pathname.split("/");
      const testId = urlParts[urlParts.length - 2];

      if (!testId || !test?.atlId || !test?.testType || !test?.material) {
        throw new Error("Missing required test information");
      }

      // Create payload with only the equipment table
      const payload = {
        atlId: test.atlId,
        testType: test.testType,
        material: test.material,
        equipmenttable: equipmentTableHtml
      };

      // Send update to the server
      const response = await apiRequest(
        `${API_URLS.TESTS}/${testId}/update-table`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(response.error || `Failed to save equipment table`);
      }

      // Update local state
      setExistingEquipmentTable(equipmentTableHtml);

      toast({
        title: "Success",
        description: "Equipment table saved successfully",
      });
    } catch (error) {
      console.error("Error saving equipment table:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save equipment table",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[95vh] dark:bg-black overflow-y-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold dark:text-white">Add Test Results</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center my-8">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 max-w-[1200px] mx-auto px-4 pb-8">
          <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
            <div className="flex justify-between items-center">
              <div>
                <label className="block mb-2">
                  Test ID: {test?.atlId || "N/A"}
                </label>
                <label className="block mb-2">
                  Material: {test?.material || "N/A"}
                </label>
                <label className="block mb-2">
                  Date: {test?.date || "N/A"}
                </label>
                <label className="block mb-2">
                  Test Type: {test?.testType || "N/A"}
                </label>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    testStatus === "Results Approved"
                      ? "bg-green-100 text-green-800"
                      : testStatus === "Results Rejected"
                      ? "bg-red-100 text-red-800"
                      : testStatus === "Sent for Approval"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {testStatus}
                </div>
                {rejectionRemark && testStatus === "Results Rejected" && (
                  <div className="max-w-md text-sm text-right text-red-600">
                    <span className="font-semibold">
                      Section Head's Remark:
                    </span>
                    <br />
                    {rejectionRemark}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Saved Equipment Table Section */}
          {existingEquipmentTable && renderExistingEquipmentTable()}

          {/* Equipment Selection Table - Only show if no existing equipment table */}
          {!existingEquipmentTable && (
            <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Select Equipment</h2>
                {selectedEquipment.length > 0 && (
                  <Button
                    onClick={handleSaveEquipment}
                    className="flex gap-2 items-center"
                    variant="outline"
                  >
                    Save Equipment Selection
                  </Button>
                )}
              </div>
              <EquipmentSelectionTable
                onEquipmentSelect={handleEquipmentSelect}
              />
            </div>
          )}

          {/* Saved Result Table Section */}
          {existingResultTable && renderExistingResultTable()}

          {/* Date Range Dialog */}
          <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Test Period</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromDate" className="flex gap-2 items-center">
                    <Calendar className="w-4 h-4" /> From Date
                  </Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toDate" className="flex gap-2 items-center">
                    <Calendar className="w-4 h-4" /> To Date
                  </Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFinalSave}>Save Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Results Table - Only show if no existing result table */}
          {!existingResultTable && (
            <div className="flex flex-col items-center w-full">
              {!showTable ? (
                <Button onClick={handleGenerateTable} className="mt-4">
                  Generate Table
                </Button>
              ) : (
                <div className="p-6 w-full bg-white rounded-lg shadow-sm dark:bg-black">
                  <div className="flex gap-4 justify-end mb-4">
                    <Button
                      onClick={handleDownload}
                      className="flex gap-2 items-center"
                      variant="outline"
                    >
                      <Download className="w-4 h-4" />
                      Save
                    </Button>
                    <Button
                      onClick={handleDelete}
                      className="flex gap-2 items-center"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-center">
                    Result Table
                  </h2>
                  <div className="overflow-x-auto">
                    {showTable && (
                      <HandsTable showTable={showTable} test={test} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

