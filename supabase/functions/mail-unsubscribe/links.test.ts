import {test,expect} from 'bun:test';
import {unsubscribeTarget,publicAddress} from './links';
test('RFC 8058 uses POST only for an HTTPS target with One-Click header',()=>{
 expect(unsubscribeTarget('<https://news.capterra.com/unsubscribe?id=1>','List-Unsubscribe=One-Click').oneClick).toBe(true);
 expect(unsubscribeTarget('<mailto:leave@example.com>','List-Unsubscribe=One-Click').oneClick).toBe(false);
 expect(unsubscribeTarget('<https://news.example.com>','')).toEqual({https:'https://news.example.com/',mailto:undefined,oneClick:false});
});
test('unsubscribe rejects internal and reserved network destinations',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','::1','0.0.0.0','224.0.0.1']) expect(publicAddress(ip)).toBe(false);
 expect(publicAddress('8.8.8.8')).toBe(true);
});