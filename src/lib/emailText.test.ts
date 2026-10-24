// @ts-ignore Bun tests
import {test,expect} from 'bun:test';
import {splitQuotedReply} from './emailText';
test('quotes preserve the new reply and previous text',()=>{expect(splitQuotedReply('Nieuw antwoord\n\nOn Monday Alex wrote:\n> previous')).toEqual({main:'Nieuw antwoord',quoted:'On Monday Alex wrote:\n> previous'});});
test('Spanish quoted reply',()=>{expect(splitQuotedReply('Gracias\nEl lunes Ana escribió:\nAnterior')).toEqual({main:'Gracias',quoted:'El lunes Ana escribió:\nAnterior'});});
test('ordinary prose is not hidden',()=>{expect(splitQuotedReply('Op kantoor werken wij vandaag.')).toEqual({main:'Op kantoor werken wij vandaag.',quoted:null});});