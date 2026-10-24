export function mayDeliver(row:{folder:string;send_status:string;send_at:string|null},now=Date.now()) {
 return row.folder==='scheduled' && row.send_status==='queued' && !!row.send_at && new Date(row.send_at).getTime()<=now;
}
export function undoOpen(until:string|null,now=Date.now()){return !!until && new Date(until).getTime()>now;}
