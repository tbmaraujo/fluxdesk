import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function IndexSimple() {
  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Clientes - Teste</h2>
        </div>
      }
    >
      <Head title="Clientes" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p>Página de teste funcionando!</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
