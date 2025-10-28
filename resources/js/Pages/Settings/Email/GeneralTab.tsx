import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';

export default function GeneralTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                        Configure assinatura de e-mail e separador de respostas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="separator">Frase do separador de e-mail</Label>
                        <Input
                            id="separator"
                            placeholder="Responda acima desta linha e não apague as mensagens anteriores"
                            defaultValue="Responda acima desta linha e não apague as mensagens anteriores"
                        />
                        <p className="text-sm text-gray-500">
                            Texto que aparece nos e-mails para indicar onde o cliente deve responder
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Logo assinatura de e-mail</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <div className="text-gray-500">
                                    <p className="text-sm">Tamanho mínimo: 180x77</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Logo cabeçalho de e-mail</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <div className="text-gray-500">
                                    <p className="text-sm">Tamanho mínimo: 180x77</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button>Salvar Alterações</Button>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    As configurações gerais afetam todos os e-mails enviados pelo sistema.
                </AlertDescription>
            </Alert>
        </div>
    );
}

