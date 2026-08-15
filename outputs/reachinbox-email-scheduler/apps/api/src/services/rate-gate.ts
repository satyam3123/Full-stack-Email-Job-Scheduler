import { redisConnection } from '../queue/connection.js';

const reserveSlotScript = `
local nextAt = redis.call('GET', KEYS[1])
local now = tonumber(ARGV[1])
local spacing = tonumber(ARGV[2])
if nextAt and tonumber(nextAt) > now then
  return tonumber(nextAt) - now
end
local reservedUntil = now + spacing
redis.call('SET', KEYS[1], reservedUntil, 'PX', spacing * 2)
return 0
`;

/** Atomically spaces actual SMTP calls across every worker/instance. */
export async function waitForGlobalSendSlot(minimumDelayMs: number): Promise<number> {
  return Number(await redisConnection.eval(reserveSlotScript, 1, 'email-send:next-slot', Date.now(), minimumDelayMs));
}
