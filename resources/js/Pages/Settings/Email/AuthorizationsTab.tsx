import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Info } from 'lucide-react';

export default function AuthorizationsTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Autorizações de E-mail</CardTitle>
                    <CardDescription>
                        Configure regras de autorização para criação de tickets por e-mail
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Em desenvolvimento:</strong> Esta funcionalidade permitirá configurar
                            regras de autorização, como:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Whitelist de domínios permitidos</li>
                                <li>Blacklist de remetentes bloqueados</li>
                                <li>Regras de validação de assunto</li>
                                <li>Aprovação manual para novos contatos</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}

