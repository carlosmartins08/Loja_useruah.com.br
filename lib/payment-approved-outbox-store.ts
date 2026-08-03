import { randomUUID } from 'crypto';
import type { PoolConnection } from 'mysql2/promise';
import type { PaymentRecord } from '@/lib/payments';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type PaymentApprovedTransactionResult =
  | { kind: 'already_processed' }
  | { kind: 'not_found' }
  | { kind: 'processed'; payment: PaymentRecord };

export class PaymentApprovedTransactionError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToPayment(row: MysqlRow): PaymentRecord {
  return {
    paymentId: String(row.payment_id),
    orderId: String(row.order_id),
    provider: (row.provider ? String(row.provider) : 'sandbox') as PaymentRecord['provider'],
    method: row.method as PaymentRecord['method'],
    amount: Number(row.amount),
    currency: 'BRL',
    status: row.status as PaymentRecord['status'],
    providerReference: String(row.provider_reference),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    approvedAt: mysqlDatetimeToIso(row.approved_at),
  };
}

async function rollbackQuietly(connection: PoolConnection) {
  try {
    await connection.rollback();
  } catch {
    // Preserve the original transaction error.
  }
}

export async function applyPaymentApprovedTransaction(input: {
  provider: string;
  providerReference: string;
  providerEventId: string;
  injectFailureBeforeCommit?: boolean;
}): Promise<PaymentApprovedTransactionResult> {
  if (!shouldUseMysql()) {
    throw new PaymentApprovedTransactionError('mysql_required_for_payment_approved');
  }

  const pool = await getMysqlPool();
  if (!pool) {
    throw new PaymentApprovedTransactionError('mysql_required_for_payment_approved');
  }

  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [inboxRows] = await connection.execute<MysqlRow[]>(
      `SELECT id, processed
       FROM provider_webhook_events
       WHERE provider = ? AND provider_event_id = ?
       LIMIT 1
       FOR UPDATE`,
      [input.provider, input.providerEventId]
    );
    const inbox = inboxRows[0];
    if (!inbox) {
      throw new PaymentApprovedTransactionError('provider_webhook_event_not_found');
    }
    if (Boolean(inbox.processed)) {
      await connection.commit();
      committed = true;
      return { kind: 'already_processed' };
    }

    const [paymentRows] = await connection.execute<MysqlRow[]>(
      `SELECT * FROM payments WHERE provider_reference = ? LIMIT 1 FOR UPDATE`,
      [input.providerReference]
    );
    const paymentRow = paymentRows[0];
    if (!paymentRow) {
      await connection.rollback();
      return { kind: 'not_found' };
    }
    if (String(paymentRow.status) !== 'processing') {
      throw new PaymentApprovedTransactionError('invalid_transition');
    }

    const [orderRows] = await connection.execute<MysqlRow[]>(
      `SELECT order_id, status FROM orders WHERE order_id = ? LIMIT 1 FOR UPDATE`,
      [String(paymentRow.order_id)]
    );
    const orderRow = orderRows[0];
    if (!orderRow) {
      throw new PaymentApprovedTransactionError('order_not_found');
    }
    if (String(orderRow.status) !== 'placed') {
      throw new PaymentApprovedTransactionError('invalid_transition');
    }

    const now = new Date().toISOString();
    const mysqlNow = toMysqlDatetime(now);
    const [paymentUpdate] = await connection.execute<MysqlResult>(
      `UPDATE payments
       SET status = 'approved', approved_at = ?
       WHERE payment_id = ? AND status = 'processing'`,
      [mysqlNow, String(paymentRow.payment_id)]
    );
    if (paymentUpdate.affectedRows !== 1) {
      throw new PaymentApprovedTransactionError('invalid_transition');
    }

    const [orderUpdate] = await connection.execute<MysqlResult>(
      `UPDATE orders
       SET status = 'paid', updated_at = ?, paid_at = ?
       WHERE order_id = ? AND status = 'placed'`,
      [mysqlNow, mysqlNow, String(orderRow.order_id)]
    );
    if (orderUpdate.affectedRows !== 1) {
      throw new PaymentApprovedTransactionError('invalid_transition');
    }

    await connection.execute<MysqlResult>(
      `INSERT INTO payment_events
        (event_id, payment_id, event_name, from_status, to_status, meta, created_at)
       VALUES (?, ?, 'payment.approved', 'processing', 'approved', ?, ?)`,
      [
        randomUUID(),
        String(paymentRow.payment_id),
        JSON.stringify({
          provider: input.provider,
          providerReference: input.providerReference,
          eventId: input.providerEventId,
        }),
        mysqlNow,
      ]
    );

    await connection.execute<MysqlResult>(
      `INSERT INTO payment_approved_outbox
        (outbox_id, event_type, payment_id, order_id, payload_json, status, attempt_count,
         available_at, last_error, created_at, updated_at, processed_at)
       VALUES (?, 'PaymentApproved', ?, ?, ?, 'pending', 0, ?, NULL, ?, ?, NULL)`,
      [
        `OUT-${randomUUID()}`,
        String(paymentRow.payment_id),
        String(orderRow.order_id),
        JSON.stringify({
          eventId: input.providerEventId,
          provider: input.provider,
          providerReference: input.providerReference,
          paymentId: String(paymentRow.payment_id),
          orderId: String(orderRow.order_id),
        }),
        mysqlNow,
        mysqlNow,
        mysqlNow,
      ]
    );

    const [inboxUpdate] = await connection.execute<MysqlResult>(
      `UPDATE provider_webhook_events
       SET processed = 1, processed_at = ?, error_message = NULL, updated_at = ?
       WHERE provider = ? AND provider_event_id = ? AND processed = 0`,
      [mysqlNow, mysqlNow, input.provider, input.providerEventId]
    );
    if (inboxUpdate.affectedRows !== 1) {
      throw new PaymentApprovedTransactionError('provider_webhook_event_state_conflict');
    }

    if (input.injectFailureBeforeCommit) {
      throw new PaymentApprovedTransactionError('qa_injected_failure_before_commit');
    }

    await connection.commit();
    committed = true;

    return {
      kind: 'processed',
      payment: rowToPayment({ ...paymentRow, status: 'approved', approved_at: mysqlNow }),
    };
  } catch (error) {
    if (!committed) await rollbackQuietly(connection);
    throw error;
  } finally {
    connection.release();
  }
}
