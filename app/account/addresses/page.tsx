'use client';

import React from 'react';
import { Edit2, MapPin, Plus, Save, Star, Trash2 } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';
import { useUser } from '@/context/UserContext';
import {
  dedupeAddresses,
  formatAddressLine,
  readAddressBook,
  toAddressBookEntry,
  type AddressBookEntry,
  type ShippingAddressInput,
  writeAddressBook,
} from '@/lib/address-book';

interface OrderWithAddress {
  orderId: string;
  items: Array<{
    shippingAddress: ShippingAddressInput;
  }>;
}

const EMPTY_FORM: ShippingAddressInput & { label: string } = {
  label: '',
  recipientName: '',
  cep: '',
  street: '',
  number: '',
  city: '',
  state: '',
  country: 'BR',
};

function normalizeDefault(addresses: AddressBookEntry[]) {
  if (addresses.length === 0) return addresses;
  if (addresses.some((entry) => entry.isDefault)) return addresses;
  return addresses.map((entry, index) => ({ ...entry, isDefault: index === 0 }));
}

export default function AddressesPage() {
  const { userId } = useUser();
  const [addresses, setAddresses] = React.useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const persist = React.useCallback(
    (next: AddressBookEntry[]) => {
      const normalized = normalizeDefault(next);
      setAddresses(normalized);
      writeAddressBook(userId, normalized.filter((entry) => entry.source === 'saved'));
    },
    [userId]
  );

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      const savedAddresses = readAddressBook(userId);
      getJson<{ ok: true; orders: OrderWithAddress[] }>('/api/orders')
        .then((payload) => {
          if (!active) return;
          const derived = payload.orders
            .map((order, index) => order.items[0]?.shippingAddress)
            .filter((address): address is ShippingAddressInput => Boolean(address))
            .map((address, index) =>
              toAddressBookEntry(address, {
                id: `order-${index}-${address.cep}`,
                label: `Usado em pedido`,
                source: 'order',
                isDefault: false,
              })
            );
          persist(dedupeAddresses([...savedAddresses, ...derived]));
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sua sessao expirou. Entre novamente para ver seus enderecos.');
          } else {
            setError('Nao foi possivel carregar seus enderecos agora.');
          }
          persist(savedAddresses);
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [persist, userId]);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startEditing(entry: AddressBookEntry) {
    setEditingId(entry.id);
    setForm({
      label: entry.label,
      recipientName: entry.recipientName,
      cep: entry.cep,
      street: entry.street,
      number: entry.number,
      city: entry.city,
      state: entry.state,
      country: entry.country,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.label.trim() || !form.recipientName.trim() || !form.cep.trim() || !form.street.trim() || !form.number.trim() || !form.city.trim() || !form.state.trim() || !form.country.trim()) {
      setError('Preencha os campos minimos do endereco antes de salvar.');
      return;
    }

    setError(null);
    const nextEntry = toAddressBookEntry(form, {
      id: editingId ?? undefined,
      label: form.label.trim(),
      source: 'saved',
      isDefault: editingId ? addresses.find((entry) => entry.id === editingId)?.isDefault ?? false : addresses.length === 0,
    });

    const base = addresses.filter((entry) => entry.id !== editingId && !(entry.source === 'order' && formatAddressLine(entry) === formatAddressLine(nextEntry)));
    persist([...base, nextEntry]);
    resetForm();
  }

  function handleDelete(id: string) {
    persist(addresses.filter((entry) => entry.id !== id));
    if (editingId === id) resetForm();
  }

  function makeDefault(id: string) {
    persist(addresses.map((entry) => ({ ...entry, isDefault: entry.id === id })));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-serif italic uppercase leading-none text-ruah-950">Enderecos</h2>
          <p className="text-sm font-medium text-ruah-500 mt-4">
            Salve os dados de entrega da Fase 1 e reaproveite enderecos que voce ja usou em pedidos.
          </p>
        </div>
        <button
          onClick={resetForm}
          className="flex items-center gap-3 bg-ruah-950 text-white px-8 py-5 rounded-2xl hover:bg-accent-gold transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">Novo endereco</span>
        </button>
      </div>

      {loading ? <p className="text-sm text-ruah-500">Carregando enderecos...</p> : null}
      {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

      {!loading ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-ruah-950">{editingId ? 'Editar endereco' : 'Salvar endereco'}</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['label', 'Apelido'],
                ['recipientName', 'Nome de quem recebe'],
                ['cep', 'CEP'],
                ['street', 'Rua'],
                ['number', 'Numero'],
                ['city', 'Cidade'],
                ['state', 'Estado'],
                ['country', 'Pais'],
              ].map(([field, label]) => (
                <label key={field} className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">{label}</span>
                  <input
                    value={form[field as keyof typeof form]}
                    onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                    className="w-full rounded-2xl border border-ruah-200 px-4 py-3 text-sm text-ruah-950"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-ruah-950 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                <Save size={14} />
                Salvar endereco
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="rounded-2xl border border-ruah-200 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-700">
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm text-sm text-ruah-500">
                Nenhum endereco salvo ainda.
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-[2rem] border p-6 shadow-sm ${addr.isDefault ? 'border-accent-gold/30 bg-white' : 'border-ruah-100 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-ruah-50 p-3">
                        <MapPin size={18} className={addr.isDefault ? 'text-accent-gold' : 'text-ruah-400'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-serif italic text-ruah-950">{addr.label}</p>
                          {addr.isDefault ? (
                            <span className="rounded-full bg-accent-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-accent-gold">
                              Principal
                            </span>
                          ) : null}
                          {addr.source === 'order' ? (
                            <span className="rounded-full bg-ruah-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-500">
                              Pedido
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-medium text-ruah-700">{addr.recipientName}</p>
                        <p className="mt-1 text-sm text-ruah-500">{formatAddressLine(addr)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => makeDefault(addr.id)} className="p-2 text-ruah-300 hover:text-accent-gold transition-colors" title="Definir principal">
                        <Star size={16} />
                      </button>
                      <button onClick={() => startEditing(addr)} className="p-2 text-ruah-300 hover:text-accent-gold transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      {addr.source === 'saved' ? (
                        <button onClick={() => handleDelete(addr.id)} className="p-2 text-ruah-300 hover:text-red-500 transition-colors" title="Remover">
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
