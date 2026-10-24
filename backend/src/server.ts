import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './db';

const DEFAULT_PORT = 4000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

createApp(prisma).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
