import { deliverEmail } from '../_shared/mail-send/handler.ts';
Deno.serve(req => deliverEmail(req));
