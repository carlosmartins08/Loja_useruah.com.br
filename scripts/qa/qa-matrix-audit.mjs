#!/usr/bin/env node

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3214';

async function run() {
  const response = await fetch(`${baseUrl}/api/admin/matrix-audit`, {
    headers: {
      'x-actor-id': 'qa-platform-admin',
      'x-actor-role': 'platform_admin',
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status !== 200 || !data?.ok) {
    console.error(
      JSON.stringify(
        {
          status: 'FAIL',
          baseUrl,
          reason: 'matrix_audit_unavailable',
          httpStatus: response.status,
          payload: data,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const registrationInconsistencies = Number(data?.summary?.registrationInconsistencies ?? 0);
  const catalogInconsistencies = Number(data?.summary?.catalogInconsistencies ?? 0);

  if (registrationInconsistencies > 0 || catalogInconsistencies > 0) {
    console.error(
      JSON.stringify(
        {
          status: 'FAIL',
          baseUrl,
          reason: 'matrix_inconsistencies_detected',
          summary: data.summary,
          registrationDrift: data.registrationDrift ?? [],
          catalogDrift: data.catalogDrift ?? [],
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        baseUrl,
        report: ['QA-MATRIX-01 registration matrix consistent', 'QA-MATRIX-02 catalog matrix consistent'],
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        baseUrl,
        reason: 'unexpected_error',
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});

