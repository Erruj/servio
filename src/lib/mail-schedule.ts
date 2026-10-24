export const DEFAULT_UNDO_SECONDS=8;
export const UNDO_OPTIONS=[5,10,20,30] as const;
export function schedulePreset(kind:'tomorrow'|'monday',now=new Date()) {
 const date=new Date(now);date.setHours(8,0,0,0);
 date.setDate(date.getDate()+(kind==='tomorrow'?1:((8-date.getDay())%7 || 7)));
 return date;
}
export function deliveryDue(sendAt:string,now:number){return new Date(sendAt).getTime()<=now;}
