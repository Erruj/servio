import {test,expect} from 'bun:test';
import {newSenderMail,unsubscribeHeaders} from './sender-rules';
test('sync reads both unsubscribe headers case-insensitively',()=>{
 expect(unsubscribeHeaders([{name:'List-Unsubscribe',value:'<https://news.example.com/unsubscribe>'},{name:'LIST-UNSUBSCRIBE-POST',value:'List-Unsubscribe=One-Click'}])).toEqual({list_unsubscribe:'<https://news.example.com/unsubscribe>',list_unsubscribe_post:'List-Unsubscribe=One-Click'});
});
test('new blocked sender messages go directly to Spam and await mailbox move',()=>{
 expect(newSenderMail({from_email:'NEWS@EXAMPLE.COM'},new Set(['news@example.com']))).toEqual({from_email:'NEWS@EXAMPLE.COM',folder:'spam',spam_move_pending:true});
 expect(newSenderMail({from_email:'other@example.com'},new Set(['news@example.com']))).toEqual({from_email:'other@example.com'});
});