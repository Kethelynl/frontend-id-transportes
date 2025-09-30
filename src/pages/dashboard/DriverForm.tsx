import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const driverFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  cpf: z.string().min(11, { message: "CPF deve ter 11 dígitos." }).max(14, { message: "CPF inválido."}),
  cnh: z.string().min(11, { message: "CNH deve ter 11 dígitos." }).max(11, { message: "CNH inválida."}),
  phone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos." }),
  company_id: z.string().min(1, { message: "A empresa é obrigatória." }),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

interface DriverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DriverForm({ open, onOpenChange, onSuccess }: DriverFormProps) {
  const { toast } = useToast();
  const { user: authUser, company: selectedCompany } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      cpf: "",
      cnh: "",
      phone: "",
      company_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      const companyId = selectedCompany?.id ?? authUser?.company_id ?? '';
      form.setValue('company_id', String(companyId));
    }
  }, [open, selectedCompany, authUser, form]);

  async function onSubmit(data: DriverFormValues) {
    setIsSubmitting(true);
    try {
      // CORREÇÃO: Usar a rota que cria o usuário e o motorista juntos.
      const payload = {
        username: data.username,
        password: data.password,
        email: data.email,
        full_name: data.name,
        cpf: data.cpf.replace(/\D/g, ''),
        cnh: data.cnh.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        company_id: data.company_id,
      };

      const response = await apiService.registerDriverAccount(payload);

      if (response.success) {
        toast({
          title: "Motorista Cadastrado!",
          description: `O motorista ${data.name} foi criado com sucesso.`,
        });
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        throw new Error(response.error || "Falha ao criar motorista.");
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar motorista:", error);
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível cadastrar o motorista. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para adicionar um novo motorista ao sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: joao.silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: joao.silva@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Crie uma senha forte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="cnh"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>CNH</FormLabel>
                    <FormControl>
                        <Input placeholder="00000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Motorista"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}