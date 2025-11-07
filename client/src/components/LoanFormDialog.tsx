import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loansApi, clientsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Loan } from "@shared/firestoreTypes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const loanSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  clientName: z.string().min(1, "Client name is required"),
  loanType: z.enum(["personal", "business", "vehicle", "home", "other"]),
  loanAmount: z.string().min(1, "Loan amount is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  tenure: z.string().min(1, "Tenure is required"),
  quotationId: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
}

export function LoanFormDialog({
  open,
  onOpenChange,
  loan,
}: LoanFormDialogProps) {
  const { toast } = useToast();
  const [clientSearch, setClientSearch] = useState("");

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      clientId: loan?.clientId || "",
      clientName: loan?.clientName || "",
      loanType: loan?.loanType || "personal",
      loanAmount: loan?.loanAmount?.toString() || "",
      interestRate: loan?.interestRate?.toString() || "",
      tenure: loan?.tenure?.toString() || "",
      quotationId: loan?.quotationId || "",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", { search: clientSearch }],
    enabled: !loan && clientSearch.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: LoanFormData) => {
    await createMutation.mutateAsync({
      clientId: data.clientId,
      clientName: data.clientName,
      loanType: data.loanType,
      loanAmount: parseFloat(data.loanAmount),
      interestRate: parseFloat(data.interestRate),
      tenure: parseInt(data.tenure),
      quotationId: data.quotationId,
    });
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      form.setValue("clientId", client.id);
      form.setValue("clientName", client.name);
      setClientSearch(client.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {loan ? "Edit Loan" : "Create Loan"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!loan && (
              <FormItem>
                <FormLabel>Search Client</FormLabel>
                <div className="space-y-2">
                  <Input
                    placeholder="Type to search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    data-testid="input-client-search"
                  />
                  {clientSearch.length > 0 && clients.length > 0 && (
                    <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client.id)}
                          className="w-full text-left p-2 hover-elevate rounded-md text-sm"
                          data-testid={`button-select-client-${client.id}`}
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.email} • {client.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled data-testid="input-client-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-loan-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        data-testid="input-loan-amount"
                      />
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
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        data-testid="input-interest-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tenure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenure (months)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-tenure" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quotation ID (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-quotation-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending
                  ? "Creating..."
                  : loan
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
