function formatTime(ms) {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}µs` : `${ms.toFixed(1)}ms`;
}

function colorStatus(status) {
  if (!process.stdout.isTTY) return String(status);
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  return `\x1b[32m${status}\x1b[0m`;
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;
  const ip = req.ip || req.socket?.remoteAddress || '-';

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const userId = req.user?.id || '-';
    const timestamp = new Date().toISOString();
    const length = res.get('content-length') || '-';
    console.log(
      `[${timestamp}] ${ip} ${userId} ${method} ${originalUrl} ${colorStatus(res.statusCode)} ${length}b ${formatTime(durationMs)}`
    );
  });

  next();
}

module.exports = { requestLogger };
