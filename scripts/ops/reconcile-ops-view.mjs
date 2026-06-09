#!/usr/bin/env node
import mysql from 'mysql2/promise';

const baseUrl = process.env.RECON_BASE_URL || process.env.QA_BASE_URL;
const databaseUrl = process.env.DATABASE_URL;
const sampleSize = Number(process.env.RECON_SAMPLE_SIZE || '20');

if (!baseUrl) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'missing_env', missing: ['RECON_BASE_URL|QA_BASE_URL'] }, null, 2));
  process.exit(1);
}
if (!databaseUrl) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'missing_env', missing: ['DATABASE_URL'] }, null, 2));
  process.exit(1);
}

const pool = mysql.createPool(databaseUrl);

function normalizeShipment(status) {
  if (!status) return null;
  return status === 'created' ? 'shipped' : status;
}

async function run() {
  const [orders] = await pool.execute(
    `SELECT order_id, customer_id, status
       FROM orders
      ORDER BY created_at DESC
      LIMIT ?`,
    [sampleSize]
  );

  const mismatches = [];
  for (const row of orders) {
    const orderId = String(row.order_id);
    const customerId = String(row.customer_id);
    const dbOrderStatus = String(row.status);

    const [[paymentRows], [productionRows], [shipmentRows]] = await Promise.all([
      pool.execute(`SELECT status FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`, [orderId]),
      pool.execute(`SELECT status FROM production_jobs WHERE order_id = ? LIMIT 1`, [orderId]),
      pool.execute(`SELECT status FROM shipments WHERE order_id = ? LIMIT 1`, [orderId]),
    ]);

    const apiResponse = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/orders/${orderId}/status`, {
      headers: {
        'x-actor-id': customerId,
        'x-actor-role': 'customer',
      },
    });

    if (!apiResponse.ok) {
      mismatches.push({
        orderId,
        reason: 'api_error',
        status: apiResponse.status,
      });
      continue;
    }

    const payload = await apiResponse.json();
    const dbPaymentStatus = paymentRows[0] ? String(paymentRows[0].status) : null;
    const dbProductionStatus = productionRows[0] ? String(productionRows[0].status) : null;
    const dbShipmentStatus = shipmentRows[0] ? normalizeShipment(String(shipmentRows[0].status)) : null;
    const apiShipmentStatus = payload.shipment?.status ?? null;

    if (
      payload.status !== dbOrderStatus ||
      payload.paymentStatus !== dbPaymentStatus ||
      payload.productionStatus !== dbProductionStatus ||
      apiShipmentStatus !== dbShipmentStatus
    ) {
      mismatches.push({
        orderId,
        api: {
          orderStatus: payload.status,
          paymentStatus: payload.paymentStatus,
          productionStatus: payload.productionStatus,
          shipmentStatus: apiShipmentStatus,
        },
        db: {
          orderStatus: dbOrderStatus,
          paymentStatus: dbPaymentStatus,
          productionStatus: dbProductionStatus,
          shipmentStatus: dbShipmentStatus,
        },
      });
    }
  }

  await pool.end();

  const result = {
    status: mismatches.length === 0 ? 'PASS' : 'FAIL',
    sampled: orders.length,
    mismatches,
  };

  if (mismatches.length > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch(async (error) => {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'exception', message: String(error) }, null, 2));
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
