import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { apiRequest, API_URLS } from "@/config/api";

export function AtlIdDialog({ open, onOpenChange, onValidAtlId }) {
  const [atlId, setAtlId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const validateAtlIdFormat = (id) => {
    // ATL ID must follow pattern: ATL/YY/MM/T_NUMBER
    const pattern = /^ATL\/\d{2}\/\d{2}\/T_\d+$/;
    return pattern.test(id);
  };

  const checkAtlIdUniqueness = async (id) => {
    try {
      const response = await apiRequest(API_URLS.getAllTests);
      if (response.ok) {
        const existingIds = response.tests.map(test => test.testId);
        return !existingIds.includes(id);
      }
      return false;
    } catch (error) {
      console.error("Error checking ATL ID uniqueness:", error);
      throw new Error("Failed to validate ATL ID uniqueness");
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!atlId.trim()) {
      setError("ATL ID is required");
      return;
    }

    if (!validateAtlIdFormat(atlId.trim())) {
      setError("ATL ID must follow the pattern ATL/YY/MM/T_NUMBER (e.g., ATL/25/09/T_5)");
      return;
    }

    setIsValidating(true);
    
    try {
      const isUnique = await checkAtlIdUniqueness(atlId.trim());
      
      if (!isUnique) {
        setError("This ATL ID already exists. Please choose a different one.");
        setIsValidating(false);
        return;
      }

      // ATL ID is valid and unique
      onValidAtlId(atlId.trim());
      setAtlId("");
      setError("");
      onOpenChange(false);
    } catch (error) {
      setError(error.message || "Failed to validate ATL ID");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    setAtlId("");
    setError("");
    onOpenChange(false);
  };

  const handleAtlIdChange = (e) => {
    setAtlId(e.target.value);
    setError(""); // Clear error when user starts typing
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter ATL ID</DialogTitle>
          <DialogDescription>
            Please enter a unique ATL ID following the pattern ATL/YY/MM/T_NUMBER (e.g., ATL/25/09/T_5)
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="atlId" className="text-right">
              ATL ID
            </Label>
            <Input
              id="atlId"
              value={atlId}
              onChange={handleAtlIdChange}
              placeholder="ATL/25/09/T_5"
              className="col-span-3"
              disabled={isValidating}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isValidating || !atlId.trim()}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}