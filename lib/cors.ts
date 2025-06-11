// lib/cors.js
import Cors from 'cors';

const cors = Cors({
  origin: '*', // Βάλε ['http://localhost:8081'] για ΜΟΝΟ το react dev!
  methods: ['GET', 'POST', 'OPTIONS'],
});

export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default cors;
