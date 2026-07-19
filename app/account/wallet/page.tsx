'use client';

import React from 'react';
import { Wallet } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="text-4xl font-serif italic uppercase leading-none">Minha Carteira</h2>
        <p className="text-sm font-medium text-ruah-500 mt-4">A carteira da conta será exibida quando houver dados financeiros reais vinculados ao usuário.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 rounded-[3rem] border border-dashed border-ruah-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ruah-50 text-accent-gold">
            <Wallet size={28} />
          </div>
          <h3 className="mt-6 text-2xl font-serif italic text-ruah-950">Carteira em preparação</h3>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ruah-500">
            Não há saldo, transações ou cartões salvos confirmados para exibir. Esses dados dependem de serviços financeiros reais e não serão simulados nesta conta.
          </p>
        </div>
      </div>
    </div>
  );
}
