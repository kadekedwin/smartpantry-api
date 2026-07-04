function ok(res, data, message = 'OK', status = 200) {
  return res.status(status).json({ data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ data: null, message });
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { ok, fail, ApiError };
