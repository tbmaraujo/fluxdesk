import { Head } from '@inertiajs/react';
import { Button } from '../Components/ui/button';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function ShadcnTest() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Head title="Teste shadcn/ui" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-6">Teste dos componentes shadcn/ui</h1>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Botões</h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Tamanhos</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <span className="h-4 w-4 flex items-center justify-center">+</span>
                </Button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Estado</h2>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button className={cn("animate-pulse")}>Animado</Button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Com evento</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  onClick={() => setCount(prev => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Contador: {count}
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Variáveis CSS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-background border border-border">bg-background</div>
                <div className="p-4 rounded-md bg-primary text-primary-foreground">bg-primary</div>
                <div className="p-4 rounded-md bg-secondary text-secondary-foreground">bg-secondary</div>
                <div className="p-4 rounded-md bg-muted text-muted-foreground">bg-muted</div>
                <div className="p-4 rounded-md bg-accent text-accent-foreground">bg-accent</div>
                <div className="p-4 rounded-md bg-destructive text-destructive-foreground">bg-destructive</div>
                <div className="p-4 rounded-md bg-card text-card-foreground">bg-card</div>
                <div className="p-4 rounded-md bg-popover text-popover-foreground">bg-popover</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
