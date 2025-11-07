import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import type { Client, Quotation } from "@shared/firestoreTypes";

const quotationFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  loanType: z.enum(["personal", "business", "vehicle", "home", "other"]),
  loanAmount: z.string().min(1, "Loan amount is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  tenure: z.string().min(1, "Tenure is required"),
  processingFee: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

interface QuotationFormDialogProps {
  quotation?: Quotation;
  trigger?: React.ReactNode;
  onSubmit: (data: any) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function QuotationFormDialog({
  quotation,
  trigger,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: QuotationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const isControlled = controlledOpen !== undefined;
  const dialogOpen = isControlled ? controlledOpen : open;
  const setDialogOpen = isControlled ? controlledOnOpenChange! : setOpen;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", clientSearch],
    queryFn: () => clientsApi.getAll({ search: clientSearch || undefined }),
    enabled: !quotation, // Only fetch when creating new quotation
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: quotation ? {
      clientId: quotation.clientId,
      clientName: quotation.clientName,
      loanType: quotation.loanType,
      loanAmount: quotation.loanAmount.toString(),
      interestRate: quotation.interestRate.toString(),
      tenure: quotation.tenure.toString(),
      processingFee: quotation.processingFee?.toString() || "",
      notes: quotation.notes || "",
    } : {
      clientId: "",
      clientName: "",
      loanType: "personal",
      loanAmount: "",
      interestRate: "",
      tenure: "",
      processingFee: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (selectedClient) {
      form.setValue("clientId", selectedClient.id);
      form.setValue("clientName", selectedClient.name);
      if (selectedClient.loanType) {
        form.setValue("loanType", selectedClient.loanType);
      }
      if (selectedClient.requestedAmount) {
        form.setValue("loanAmount", selectedClient.requestedAmount.toString());
      }
    }
  }, [selectedClient, form]);

  const handleSubmit = async (data: QuotationFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        loanAmount: parseFloat(data.loanAmount),
        interestRate: parseFloat(data.interestRate),
        tenure: parseInt(data.tenure),
        processingFee: data.processingFee ? parseFloat(data.processingFee) : undefined,
      };
      
      await onSubmit(submitData);
      setDialogOpen(false);
      form.reset();
      setSelectedClient(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? "Edit Quotation" : "Create New Quotation"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {!quotation && !selectedClient && (
              <div className="space-y-3">
                <Label>Select Client</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-10"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    data-testid="input-search-quotation-clients"
                  />
                </div>
                {clients.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clients.slice(0, 5).map((client) => (
                      <Card
                        key={client.id}
                        className="p-3 cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setSelectedClient(client)}
                        data-testid={`card-select-client-${client.id}`}
                      >
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email} • {client.phone}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(selectedClient || quotation) && (
              <>
                {selectedClient && (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Selected Client</p>
                    <p className="font-medium">{selectedClient.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedClient(null)}
                      className="mt-2"
                    >
                      Change Client
                    </Button>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="loanType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quotation-loan-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal Loan</SelectItem>
                          <SelectItem value="business">Business Loan</SelectItem>
                          <SelectItem value="vehicle">Vehicle Loan</SelectItem>
                          <SelectItem value="home">Home Loan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loanAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-quotation-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" data-testid="input-quotation-interest" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenure (months) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-quotation-tenure" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Fee (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-quotation-processing-fee" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-quotation-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSubmitting}
                    data-testid="button-cancel-quotation"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} data-testid="button-submit-quotation">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {quotation ? "Update Quotation" : "Create Quotation"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>;
}
