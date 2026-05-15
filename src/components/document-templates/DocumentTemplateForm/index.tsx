"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

import { documentTemplateSchema, DocumentTemplateFormData, TEMPLATE_CATEGORY_LABELS, TEMPLATE_CATEGORIES } from "@/lib/validations/document-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateBodyEditor } from "@/components/document-templates/TemplateBodyEditor";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShortcutHelperPanel } from "../ShortcutHelperPanel";
import { TemplatePreviewModal } from "../TemplatePreviewModal";
import { findInvalidShortcuts } from "@/utils/parse-template";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DocumentTemplateFormProps {
  initialData?: DocumentTemplateFormData & { id: string };
  actionFn: (formData: FormData) => Promise<void>;
  isOwnerOrAdmin: boolean;
  userId: string;
  creatorId?: string | null;
}

export function DocumentTemplateForm({ initialData, actionFn, isOwnerOrAdmin, userId, creatorId }: DocumentTemplateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();

  const canEdit = !initialData || isOwnerOrAdmin || userId === creatorId;

  const form = useForm<DocumentTemplateFormData>({
    resolver: zodResolver(documentTemplateSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      category: "outros",
      content: "",
      visibility: "private",
      hideTitleWhenPrinted: false,
      isActive: true,
    },
  });

  const contentValue = form.watch("content");
  const invalidShortcuts = findInvalidShortcuts(contentValue);

  const onSubmit = (data: DocumentTemplateFormData) => {
    if (invalidShortcuts.length > 0) {
      toast.error("Existem atalhos inválidos no conteúdo. Verifique os alertas.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        await actionFn(formData);
        toast.success(initialData ? "Modelo atualizado!" : "Modelo criado com sucesso!");
        router.push("/document-templates");
      } catch (error) {
        toast.error("Erro ao salvar o modelo de documento.");
        console.error(error);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/document-templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {initialData ? "Editar Modelo" : "Novo Modelo"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPreviewOpen(true)}
            disabled={!contentValue}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          {canEdit && (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Modelo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="md:col-span-3 overflow-y-auto pr-2 pb-8">
          <Form {...form}>
            <form className="space-y-6">
              {!canEdit && (
                <Alert>
                  <AlertTitle>Modo de visualização</AlertTitle>
                  <AlertDescription>
                    Você não tem permissão para editar este modelo. Apenas o criador ou administradores podem editá-lo.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Documento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Atestado de Comparecimento" disabled={!canEdit} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select disabled={!canEdit} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TEMPLATE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {TEMPLATE_CATEGORY_LABELS[cat]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Breve descrição para ajudar na busca" disabled={!canEdit} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Visibilidade</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                              disabled={!canEdit}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="private" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Particular (Só você vê)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="shared" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Compartilhado (Todos na clínica)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="hideTitleWhenPrinted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                disabled={!canEdit}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Ocultar título na impressão
                              </FormLabel>
                              <FormDescription>
                                Não exibe o título no topo da folha quando impresso.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Corpo do Documento</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0 h-full">
                  {invalidShortcuts.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTitle>Atalhos Inválidos Detectados</AlertTitle>
                      <AlertDescription>
                        Os seguintes atalhos não são reconhecidos: <strong className="font-mono">{invalidShortcuts.join(", ")}</strong>. Eles não serão substituídos.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        <FormControl>
                          <TemplateBodyEditor
                            value={field.value}
                            onChange={field.onChange}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="hidden md:block col-span-1 h-full sticky top-0 rounded-md border overflow-hidden">
          <ShortcutHelperPanel />
        </div>
      </div>

      <TemplatePreviewModal 
        isOpen={previewOpen} 
        setIsOpen={setPreviewOpen} 
        content={contentValue} 
        title={form.watch("title")}
        hideTitleWhenPrinted={form.watch("hideTitleWhenPrinted")}
      />
    </div>
  );
}
