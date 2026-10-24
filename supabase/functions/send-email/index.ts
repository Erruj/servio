import { deliverEmail } from './handler.ts';
Deno.serve(req => deliverEmail(req));
