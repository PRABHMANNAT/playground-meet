import {randomBytes} from 'node:crypto';import {writeFile,mkdir,access} from 'node:fs/promises';
const meet=process.argv[2]||'meet.tryplayground.net',rtc=process.argv[3]||'rtc.meet.tryplayground.net';
if(![meet,rtc].every(v=>/^[a-z0-9.-]+$/.test(v)&&v.includes('.')))throw new Error('Provide valid DNS hostnames without protocols.');
try{await access('.env.production');throw new Error('.env.production already exists. Preserve it; do not regenerate live secrets.');}catch(e){if(e.code!=='ENOENT')throw e;}
const db=randomBytes(32).toString('hex'),key='APG'+randomBytes(12).toString('hex'),secret=randomBytes(48).toString('hex');
await mkdir('deploy',{recursive:true});
await writeFile('.env.production',`MEET_DOMAIN=${meet}\nRTC_DOMAIN=${rtc}\nAPP_URL=https://${meet}\nPOSTGRES_PASSWORD=${db}\nDATABASE_URL=postgresql://meet:${db}@db:5432/meet\nLIVEKIT_URL=wss://${rtc}\nLIVEKIT_INTERNAL_URL=https://${rtc}\nLIVEKIT_API_KEY=${key}\nLIVEKIT_API_SECRET=${secret}\n`,{mode:0o600,flag:'wx'});
await writeFile('deploy/livekit.generated.yaml',`port: 7880\nbind_addresses: ["0.0.0.0"]\nrtc:\n  tcp_port: 7881\n  port_range_start: 50000\n  port_range_end: 50100\n  use_external_ip: true\nroom:\n  max_participants: 25\n  empty_timeout: 300\nturn:\n  enabled: true\n  domain: ${rtc}\n  udp_port: 3478\nwebhook:\n  api_key: ${key}\n  urls: ["http://127.0.0.1:3000/api/livekit/webhook"]\n`,{mode:0o600,flag:'wx'});
console.log('Production configuration created. Secrets were not printed. Follow docs/DEPLOYMENT.md before starting services.');
