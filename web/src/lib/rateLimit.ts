import { Ratelimit } from "@upstash/ratelimit";
import {redis} from "@/lib/redis";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1m"),//ek minute me 5 request
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export default ratelimit;