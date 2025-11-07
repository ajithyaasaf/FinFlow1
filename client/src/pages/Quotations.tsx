import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, AlertTriangle, Loader2, FileText } from "lucide-react";
import QuotationFormDialog from "@/components/QuotationFormDialog";
import { quotationsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { Quotation } from "@shared/firestoreTypes";
import { format } from "date-fns";

export default function Quotations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [highValueFilter, setHighValueFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations", statusFilter, highValueFilter],
    queryFn: () =>
      quotationsApi.getAll({
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        isHighValue: highValueFilter !== "all" ? (highValueFilter === "high") : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: quotationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      quotationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation",
        variant: "destructive",
      });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: quotationsApi.downloadPDF,
    onSuccess: (blob: Blob, quotationId: string) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    if (editingQuotation) {
      await updateMutation.mutateAsync({ id: editingQuotation.id, data });
      setEditingQuotation(undefined);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormOpen(true);
  };

  const handleDownloadPDF = (quotationId: string) => {
    downloadPDFMutation.mutate(quotationId);
  };

  const filteredQuotations = quotations.filter((q) =>
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === "draft").length,
    finalized: quotations.filter((q) => q.status === "finalized").length,
    sent: quotations.filter((q) => q.status === "sent").length,
    accepted: quotations.filter((q) => q.status === "accepted").length,
    rejected: quotations.filter((q) => q.status === "rejected").length,
    highValue: quotations.filter((q) => q.isHighValue).length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">Manage loan quotations and generate PDFs</p>
          </div>
          <QuotationFormDialog
            trigger={
              <Button data-testid="button-create-quotation">
                <Plus className="w-4 h-4 mr-2" />
                New Quotation
              </Button>
            }
            onSubmit={handleSubmit}
            open={formOpen && !editingQuotation}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingQuotation(undefined);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-total-quotations">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600" data-testid="text-draft-quotations">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Finalized</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-finalized-quotations">{stats.finalized}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600" data-testid="text-sent-quotations">{stats.sent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600" data-testid="text-accepted-quotations">{stats.accepted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">High Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600" data-testid="text-high-value-quotations">{stats.highValue}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name or quotation number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-quotations"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={highValueFilter} onValueChange={setHighValueFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-high-value-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quotations</SelectItem>
              <SelectItem value="high">High Value Only</SelectItem>
              <SelectItem value="normal">Normal Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quotations found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || highValueFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first quotation to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredQuotations.map((quotation) => (
              <Card key={quotation.id} className="hover-elevate" data-testid={`card-quotation-${quotation.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{quotation.clientName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{quotation.quotationNumber}</p>
                    </div>
                    {quotation.isHighValue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        High Value
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Loan Amount</p>
                      <p className="font-semibold">₹{quotation.loanAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{quotation.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tenure</p>
                      <p className="font-semibold">{quotation.tenure} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EMI</p>
                      <p className="font-semibold">₹{quotation.emi?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge
                      variant={
                        quotation.status === "accepted"
                          ? "default"
                          : quotation.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      data-testid={`badge-status-${quotation.id}`}
                    >
                      {quotation.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(quotation.createdAt instanceof Date ? quotation.createdAt : quotation.createdAt.toDate(), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quotation)}
                      className="flex-1"
                      data-testid={`button-edit-quotation-${quotation.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownloadPDF(quotation.id)}
                      disabled={downloadPDFMutation.isPending}
                      className="flex-1"
                      data-testid={`button-download-pdf-${quotation.id}`}
                    >
                      {downloadPDFMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingQuotation && (
        <QuotationFormDialog
          quotation={editingQuotation}
          onSubmit={handleSubmit}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingQuotation(undefined);
          }}
        />
      )}
    </div>
  );
}
