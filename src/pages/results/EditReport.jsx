import { useLocation, useNavigate } from "react-router-dom";
import ReportComp from "@/components/Report/ReportComp";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { apiRequest, API_URLS } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function EditReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { test: initialTest, testId } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!testId) {
          throw new Error("No test ID provided");
        }
        
        const response = await apiRequest(`${API_URLS.TESTS}/${testId}/report-data`);
        if (!response.ok) {
          throw new Error(response.error || "Failed to fetch report data");
        }
        
        // Find the specific test from the report data
        const specificTest = response.reportData.tests.find(
          t => t.atlId === initialTest.atlId && 
              t.testType === initialTest.testType && 
              t.material === initialTest.material
        );
        
        if (!specificTest) {
          throw new Error("Specific test not found in report data");
        }

        // Combine the report data with the specific test data
        const completeTestData = {
          ...specificTest,
          clientName: response.reportData.clientName,
          emailId: response.reportData.emailId,
          contactNo: response.reportData.contactNo,
          address: response.reportData.address,
          testId: response.reportData.testId,
          status: response.reportData.status
        };

        setReportData(completeTestData);
      } catch (error) {
        console.error("Error fetching report data:", error);
        setError(error.message);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [testId, initialTest]);

  const handleSaveReport = async (content) => {
    try {
      const response = await apiRequest(
        API_URLS.editReport(testId),
        {
          method: "POST",
          body: JSON.stringify({
            atlId: reportData.atlId,
            testType: reportData.testType,
            material: reportData.material,
            reportHtml: content
          }),
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to save report changes");
      }

      toast({
        title: "Success",
        description: "Report changes saved successfully",
      });
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save report changes",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading report data...</span>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error || "No report data found"}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ReportComp test={reportData} testId={testId} onSave={handleSaveReport} />
    </div>
  );
} 