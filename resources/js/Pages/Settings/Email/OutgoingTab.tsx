import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Info } from 'lucide-react';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';

export default function OutgoingTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configurações de Envio</CardTitle>
                    <CardDescription>
                        Configure como os e-mails são enviados pelo sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="from_email">E-mail de Envio (From)</Label>
                        <Input
                            id="from_email"
                            type="email"
                            placeholder="noreply@fluxdesk.com.br"
                            defaultValue="noreply@fluxdesk.com.br"
                        />
                        <p className="text-sm text-gray-500">
                            E-mail que aparecerá como remetente nas notificações
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="from_name">Nome do Remetente</Label>
                        <Input
                            id="from_name"
                            type="text"
                            placeholder="Fluxdesk"
                            defaultValue="Fluxdesk"
                        />
                        <p className="text-sm text-gray-500">
                            Nome que aparecerá junto com o e-mail do remetente
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button>Salvar Alterações</Button>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    O sistema está configurado para usar <strong>Amazon SES</strong> na região{' '}
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">us-east-2</code>.
                    {' '}Certifique-se de que o domínio está verificado no console da AWS.
                </AlertDescription>
            </Alert>
        </div>
    );
}

