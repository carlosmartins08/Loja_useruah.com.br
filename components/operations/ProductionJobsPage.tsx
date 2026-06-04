'use client';

import React from 'react';
import { Factory, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';

interface ProductionJob {
  productionJobId: string;
  orderId: string;
  status: 'queued' | 'in_progress' | 'ready_to_ship' | 'shipped' | 'issue_reported' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<ProductionJob['status'], string> = {
  queued: 'Na fila',
  in_progress: 'Em producao',
  ready_to_ship: 'Pronto para envio',
  shipped: 'Enviado',
  issue_reported: 'Com problema',
  cancelled: 'Cancelado',
};

export default function MerchantProductionPage() {
  const [jobs, setJobs] = React.useState<ProductionJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});
  const [shippingDrafts, setShippingDrafts] = React.useState<Record<string, { trackingCode: string; carrier: string }>>({});

  const load = React.useCallback(async () => {
    setError(null);
    const data = await getJson<{ ok: true; jobs: ProductionJob[] }>('/api/production-jobs');
    setJobs(data.jobs);
  }, []);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      load()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && (err.status === 401 || err.status === 403)) {
            setError('Sessao invalida para producao. Atualize a pagina para renovar a sessao.');
            return;
          }
          setError('Nao foi possivel carregar a fila de producao.');
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
  }, [load]);

  async function startProduction(jobId: string) {
    setActionLoading((prev) => ({ ...prev, [jobId]: true }));
    setError(null);
    try {
      await postJson(`/api/production-jobs/${jobId}/start`);
      await load();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('Este job nao pode ser iniciado no estado atual.');
      } else {
        setError('Nao foi possivel iniciar a producao deste pedido.');
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  async function shipProduction(jobId: string) {
    const draft = shippingDrafts[jobId];
    if (!draft?.trackingCode?.trim() || !draft?.carrier?.trim()) {
      setError('Informe transportadora e codigo de rastreio para registrar o envio.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [jobId]: true }));
    setError(null);
    try {
      await postJson(`/api/production-jobs/${jobId}/ship`, {
        trackingCode: draft.trackingCode.trim(),
        carrier: draft.carrier.trim(),
      });
      await load();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('Este job nao pode ser enviado no estado atual.');
      } else {
        setError('Nao foi possivel registrar o envio deste pedido.');
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  const inProgress = jobs.filter((job) => job.status === 'in_progress').length;
  const queued = jobs.filter((job) => job.status === 'queued').length;
  const issues = jobs.filter((job) => job.status === 'issue_reported').length;

  return (
    <main className='min-h-screen bg-ruah-25 pb-40 font-sans'>
      <div className='max-w-7xl mx-auto px-6 pt-20'>
        <div className='flex flex-col md:flex-row justify-between items-end gap-8 mb-16'>
          <div className='flex flex-col gap-6'>
            <h1 className='text-5xl lg:text-7xl font-serif uppercase italic leading-none font-black text-ruah-950'>
              FILA DE <span className='text-accent-gold'>producao.</span>
            </h1>
            <p className='text-xs font-bold text-ruah-400 uppercase tracking-[0.2em] leading-loose max-w-xl'>
              Visao operacional baseada na fila real de producao.
            </p>
          </div>
          <div className='flex gap-4'>
            <div className='relative'>
              <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-ruah-300' />
              <input type='text' placeholder='Busca visual (sem filtro ativo)' className='pl-12 pr-6 py-4 bg-white border border-ruah-100 rounded-2xl text-xs font-medium outline-none w-64 shadow-sm' />
            </div>
            <button className='p-4 bg-white border border-ruah-100 rounded-2xl text-ruah-950 transition-all shadow-sm'>
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-10'>
          <div className='lg:col-span-1 flex flex-col gap-6'>
            <div className='bg-ruah-950 text-white p-10 rounded-[3rem] shadow-2xl'>
              <div className='flex flex-col gap-8'>
                <div className='flex flex-col gap-2'>
                  <span className='text-xs font-semibold text-accent-gold uppercase tracking-[0.2em]'>Capacidade Atual</span>
                  <h2 className='text-6xl font-serif italic font-black'>{jobs.length ? Math.round((inProgress / jobs.length) * 100) : 0}%</h2>
                </div>
              </div>
            </div>

            <div className='bg-white border border-ruah-50 p-8 rounded-[2.5rem] flex flex-col gap-3 shadow-sm'>
              <h3 className='text-xs font-semibold uppercase tracking-[0.4em] text-ruah-300'>Alertas de Sincronia</h3>
              <div className='flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100'>
                <AlertCircle size={18} className='text-red-500' />
                <span className='text-xs font-semibold text-red-700 uppercase tracking-widest'>{issues} Jobs com problema</span>
              </div>
              <div className='flex items-center gap-4 p-5 bg-green-50 rounded-2xl border border-green-100'>
                <CheckCircle2 size={18} className='text-green-600' />
                <span className='text-xs font-semibold text-green-700 uppercase tracking-widest'>{queued} Jobs aguardando fila</span>
              </div>
            </div>
          </div>

          <div className='lg:col-span-2 flex flex-col gap-6'>
            <div className='flex justify-between items-center px-4'>
              <h3 className='text-xs font-semibold uppercase tracking-[0.4em] text-ruah-300'>Fulfillment Ativo</h3>
              <span className='text-xs font-semibold text-accent-gold uppercase tracking-widest bg-accent-gold/10 px-2 py-1 rounded'>Dados Reais</span>
            </div>

            {loading ? (
              <div className='text-xs text-ruah-400 uppercase tracking-widest px-4'>Carregando fila...</div>
            ) : error ? (
              <div className='text-xs text-red-600 uppercase tracking-widest px-4'>{error}</div>
            ) : jobs.length === 0 ? (
              <div className='text-xs text-ruah-400 uppercase tracking-widest px-4'>Nenhum job na fila.</div>
            ) : (
              <div className='flex flex-col gap-6'>
                {jobs.map((job) => (
                  <div key={job.productionJobId} className='bg-white border border-ruah-50 p-8 rounded-[2.5rem]'>
                    <div className='flex flex-col md:flex-row justify-between gap-8'>
                      <div className='flex gap-6'>
                        <div className='w-20 h-20 bg-ruah-25 rounded-2xl flex items-center justify-center text-ruah-200'>
                          <Factory size={32} />
                        </div>
                        <div className='flex flex-col justify-center gap-1'>
                          <span className='text-xs font-semibold text-accent-gold uppercase tracking-[0.2em]'>{job.productionJobId}</span>
                          <h4 className='text-2xl font-serif uppercase italic font-black leading-tight text-ruah-950'>{job.orderId}</h4>
                          <p className='text-xs font-semibold text-ruah-400 uppercase tracking-widest'>{STATUS_LABEL[job.status]}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <span className='text-xs font-semibold text-ruah-300 uppercase block mb-1'>Atualizado</span>
                        <span className='text-sm font-mono text-ruah-950'>{new Date(job.updatedAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className='mt-6 border-t border-ruah-100 pt-6'>
                      {job.status === 'queued' ? (
                        <button
                          type='button'
                          disabled={Boolean(actionLoading[job.productionJobId])}
                          onClick={() => void startProduction(job.productionJobId)}
                          className='rounded-xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50'
                        >
                          Iniciar producao
                        </button>
                      ) : null}

                      {job.status === 'in_progress' ? (
                        <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]'>
                          <input
                            type='text'
                            value={shippingDrafts[job.productionJobId]?.carrier ?? ''}
                            onChange={(event) =>
                              setShippingDrafts((prev) => ({
                                ...prev,
                                [job.productionJobId]: {
                                  trackingCode: prev[job.productionJobId]?.trackingCode ?? '',
                                  carrier: event.target.value,
                                },
                              }))
                            }
                            placeholder='Transportadora'
                            className='rounded-xl border border-ruah-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]'
                          />
                          <input
                            type='text'
                            value={shippingDrafts[job.productionJobId]?.trackingCode ?? ''}
                            onChange={(event) =>
                              setShippingDrafts((prev) => ({
                                ...prev,
                                [job.productionJobId]: {
                                  trackingCode: event.target.value,
                                  carrier: prev[job.productionJobId]?.carrier ?? '',
                                },
                              }))
                            }
                            placeholder='Codigo de rastreio'
                            className='rounded-xl border border-ruah-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]'
                          />
                          <button
                            type='button'
                            disabled={Boolean(actionLoading[job.productionJobId])}
                            onClick={() => void shipProduction(job.productionJobId)}
                            className='rounded-xl bg-emerald-600 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50'
                          >
                            Registrar envio
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
