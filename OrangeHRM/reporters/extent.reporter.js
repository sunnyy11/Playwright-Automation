const fs = require('fs');
const path = require('path');

const reportDirectory = path.resolve(process.cwd(), 'extent-report');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

class ExtentReporter {
  constructor() {
    this.tests = new Map();
  }

  onTestEnd(test, result) {
    this.tests.set(test.id, {
      name: test.titlePath().slice(1).join(' > '),
      file: path.relative(process.cwd(), test.location.file),
      status: result.status,
      duration: result.duration,
    });
  }

  onEnd() {
    const tests = [...this.tests.values()];
    const counts = tests.reduce((summary, test) => {
      const status = test.status === 'skipped' ? 'skipped' : test.status === 'passed' ? 'passed' : 'failed';
      summary[status] += 1;
      return summary;
    }, { passed: 0, failed: 0, skipped: 0 });

    const rows = tests.map((test) => {
      const status = test.status === 'skipped' ? 'skipped' : test.status === 'passed' ? 'passed' : 'failed';
      return `<tr><td>${escapeHtml(test.name)}</td><td>${escapeHtml(test.file)}</td><td><span class="status ${status}">${status}</span></td><td>${test.duration} ms</td></tr>`;
    }).join('');

    const generatedAt = new Date().toLocaleString();
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Playwright Extent Report</title>
  <style>
    :root { color-scheme: light; font-family: Arial, sans-serif; background: #f4f6f8; color: #17202a; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1100px; margin: 0 auto; }
    h1 { margin: 0 0 8px; }
    .meta { color: #5f6b76; margin-bottom: 24px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: white; border: 1px solid #dce2e7; border-radius: 8px; padding: 18px; }
    .card strong { display: block; font-size: 30px; margin-top: 8px; }
    .passed strong { color: #16803c; } .failed strong { color: #c62828; } .skipped strong { color: #8a6100; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dce2e7; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e8ecef; }
    th { background: #eef1f4; }
    .status { display: inline-block; min-width: 64px; padding: 4px 8px; border-radius: 999px; text-align: center; text-transform: capitalize; }
    .status.passed { background: #dff4e7; color: #166534; } .status.failed { background: #fde2e2; color: #991b1b; } .status.skipped { background: #fff1c7; color: #7c5700; }
    @media (max-width: 700px) { body { padding: 16px; } .summary { grid-template-columns: 1fr; } table { font-size: 12px; } th, td { padding: 8px; } }
  </style>
</head>
<body>
  <main>
    <h1>Playwright Extent Report</h1>
    <div class="meta">Generated ${escapeHtml(generatedAt)}</div>
    <section class="summary">
      <div class="card passed">Passed<strong>${counts.passed}</strong></div>
      <div class="card failed">Failed<strong>${counts.failed}</strong></div>
      <div class="card skipped">Skipped<strong>${counts.skipped}</strong></div>
    </section>
    <table>
      <thead><tr><th>Scenario</th><th>File</th><th>Status</th><th>Duration</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No tests were recorded.</td></tr>'}</tbody>
    </table>
  </main>
</body>
</html>`;

    fs.mkdirSync(reportDirectory, { recursive: true });
    fs.writeFileSync(path.join(reportDirectory, 'index.html'), html, 'utf8');
  }
}

module.exports = ExtentReporter;