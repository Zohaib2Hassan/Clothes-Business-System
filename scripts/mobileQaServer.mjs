// Isolated synthetic-data server for mobile integration QA. Never uses shop DB.
import { randomBytes } from 'node:crypto';
Object.assign(process.env, { MONGO_URI: 'mongodb://127.0.0.1:27018/threadly_mobile_qa_20261023', PORT:'5005', NODE_ENV:'test', SERVE_WEB:'false', JWT_SECRET:randomBytes(32).toString('hex'), EMAIL_USER:'',EMAIL_PASS:'',SMTP_USER:'',SMTP_PASS:'',GEMINI_API_KEY:'',GOOGLE_API_KEY:'',ML_SERVICE_URL:'http://127.0.0.1:59999' });
await import('../server/server.js');
