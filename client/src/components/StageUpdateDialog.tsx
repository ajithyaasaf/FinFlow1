import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tantml:invoke>
<invoke name="queryClient";
import { Loan, LoanStage, LoanStageDetail } from "@shared/firestoreTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Circle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { uploadApi, documentsApi } from "@/lib/api";

const LOAN_STAGE_LABELS: Record<LoanStage, string> = {
  application_submitted: "Application Submitted",
  document_verification: "Document Verification",
  credit_appraisal: "Credit Appraisal",
  sanction: "Sanction",
  agreement_signed: "Agreement Signed",
  disbursement_ready: "Disbursement Ready",
};

const stageUpdateSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  completed: z.boolean(),
  remarks: z.string().optional(),
});

type StageUpdateFormData = z.infer<typeof stageUpdateSchema>;

interface StageUpdateDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageUpdateDialog({
  loan,
  open,
  onOpenChange,
}: StageUpdateDialogProps) {
  const { toast } = useToast();
  const [selectedStage, setSelectedStage] = useState<LoanStageDetail | null>(
    null
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  const form = useForm<StageUpdateFormData>({
    resolver: zodResolver(stageUpdateSchema),
    defaultValues: {
      stage: "",
      completed: false,
      remarks: "",
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: loansApi.updateStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Success",
        description: "Stage updated successfully",
      });
      setSelectedStage(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stage",
        variant: "destructive",
      });
    },
  });

  const handleStageSelect = (stage: LoanStageDetail) => {
    setSelectedStage(stage);
    form.setValue("stage", stage.stage);
    form.setValue("completed", stage.completed);
    form.setValue("remarks", stage.remarks || "");
  };

  const handleSubmit = async (data: StageUpdateFormData) => {
    await updateStageMutation.mutateAsync({
      id: loan.id,
      data: {
        stage: data.stage,
        completed: data.completed,
        remarks: data.remarks,
      },
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedStage) return;

    setUploadingFile(true);
    try {
      // Get upload URL
      const { uploadUrl, path } = await uploadApi.getUploadUrl({
        fileName: file.name,
        contentType: file.type,
        resourceId: loan.id,
        fileType: "document",
      });

      // Upload file to Firebase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Get download URL
      const { url } = await documentsApi.getDownloadUrl(
        "loans",
        loan.id,
        path.split("/").pop() || file.name
      );

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Refresh loan data to show new document
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            Update Loan Stage - {loan.loanNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-semibold">{loan.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="font-semibold">
                ₹{loan.loanAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Select Stage to Update</h3>
            <div className="space-y-2">
              {loan.stages.map((stage) => (
                <button
                  key={stage.stage}
                  type="button"
                  onClick={() => handleStageSelect(stage)}
                  className={`w-full p-3 rounded-md border text-left hover-elevate active-elevate-2 ${
                    selectedStage?.stage === stage.stage
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  data-testid={`button-select-stage-${stage.stage}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {stage.completed ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">
                          {LOAN_STAGE_LABELS[stage.stage]}
                        </p>
                        {stage.remarks && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {stage.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    {stage.completed && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                  {stage.documents && stage.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {stage.documents.map((doc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {doc.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedStage && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4 border-t pt-4"
              >
                <h3 className="font-semibold">
                  Update {LOAN_STAGE_LABELS[selectedStage.stage]}
                </h3>

                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-completed"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Mark this stage as completed
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter any notes or comments..."
                          data-testid="textarea-remarks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Upload Documents</FormLabel>
                  <div className="mt-2">
                    <label
                      htmlFor="stage-document-upload"
                      className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover-elevate active-elevate-2 ${
                        uploadingFile ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      <span>
                        {uploadingFile
                          ? "Uploading..."
                          : "Click to upload document"}
                      </span>
                    </label>
                    <input
                      id="stage-document-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      data-testid="input-document-upload"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedStage(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStageMutation.isPending}
                    data-testid="button-submit"
                  >
                    {updateStageMutation.isPending
                      ? "Updating..."
                      : "Update Stage"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
