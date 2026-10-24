export type MailSearchFilters = { words?: string; from?: string[]; to?: string[]; subject?: string[]; label?: string[]; in?: string; before?: string; after?: string; attachment?: boolean; unread?: boolean; starred?: boolean };
export function parseMailSearch(query: string): MailSearchFilters {
  if(query.length>1000) throw new Error('invalid');
  const filters: MailSearchFilters = {}; const words: string[]=[];
  const tokens=query.match(/(?:[^\s"]|"[^"]*")+/g)||[];
  for(const token of tokens){
    const match=token.match(/^(from|to|subject|has|is|label|in|before|after):(.+)$/i);
    if(!match){words.push(token);continue;}
    const key=match[1].toLowerCase();const value=match[2].replace(/^"|"$/g,'');
    if(['from','to','subject','label'].includes(key)){const k=key as 'from'|'to'|'subject'|'label';filters[k]=[...(filters[k]||[]),value];}
    else if(key==='has'&&value==='attachment')filters.attachment=true;
    else if(key==='is'&&value==='unread')filters.unread=true;
    else if(key==='is'&&value==='starred')filters.starred=true;
    else if(key==='in'&&['inbox','sent','archive','spam','trash','drafts','scheduled','snoozed'].includes(value))filters.in=value;
    else if(key==='before'||key==='after'){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('invalid');
      filters[key]=value;
    }else throw new Error('invalid');
  }
  if(words.length)filters.words=words.join(' ');
  return filters;
}
export function initiallyOpenMessageIds<T extends {id:string;receivedAt:string}>(messages:T[]):string[]{
  const newest=[...messages].sort((a,b)=>new Date(b.receivedAt).getTime()-new Date(a.receivedAt).getTime()||b.id.localeCompare(a.id))[0];
  return newest?[newest.id]:[];
}