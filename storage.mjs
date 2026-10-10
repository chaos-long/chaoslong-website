import {personalDefaults} from './blog.mjs';
export const MAX_FILE = 20 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/ogg']);
export const documentTypes=Object.freeze(Object.assign(Object.create(null),{pdf:'application/pdf',txt:'text/plain',md:'text/markdown',markdown:'text/markdown',csv:'text/csv',json:'application/json',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',zip:'application/zip'}));
const documentMime=new Set(Object.values(documentTypes));
export function safeFileUrl(value){if(typeof value==='string'){const match=value.match(/^data:([^;]+);base64,[A-Za-z0-9+/=]+$/);if(match&&documentMime.has(match[1]))return value}return safeUrl(value)}
export function safeUrl(value, {image=false}={}) {
  if (typeof value !== 'string' || !value) return '';
  if (image && /^data:(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|ogg));base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  if (/^(assets|media)\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function videoEmbed(value) {
  const safe = safeUrl(value); if (!safe) return '';
  const u = new URL(safe);
  if (['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)) {
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : '';
  }
  if (['vimeo.com','www.vimeo.com'].includes(u.hostname)) {
    const id = u.pathname.match(/^\/(\d+)\/?$/)?.[1]; return id ? `https://player.vimeo.com/video/${id}` : '';
  }
  return '';
}
export async function readMediaFile(file) {
  const extension=file.name.split('.').pop().toLowerCase(),documentType=documentTypes[extension];
  if (!allowedTypes.has(file.type)&&!documentType) throw new Error('Chọn ảnh/video hoặc tài liệu PDF, Word, Excel, PowerPoint, TXT, MD, CSV, JSON, ZIP.');
  if (file.size > MAX_FILE) throw new Error('Mỗi file tối đa 20 MB. Với video dài, hãy dùng link YouTube/Vimeo.');
  const src = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(new Error('Không đọc được file.')); reader.readAsDataURL(file); });
  return {id:crypto.randomUUID(),type:documentType?'file':file.type.startsWith('image/')?'image':'video',src:documentType?src.replace(/^data:[^;]*;base64,/,`data:${documentType};base64,`):src,caption:'',name:file.name,size:file.size,...(documentType?{extension}:{})};
}
export async function localRead() {
  const db = await database(); return new Promise((resolve,reject)=>{const req=db.transaction('drafts').objectStore('drafts').get('content');req.onsuccess=()=>{resolve(req.result);db.close()};req.onerror=()=>{reject(req.error);db.close()};});
}
export async function localWrite(data) {
  const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(data,'content');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(new Error('Trình duyệt không còn đủ dung lượng. Hãy giảm số file hoặc kết nối GitHub.'))};tx.onabort=tx.onerror;});
}
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('forma-project-journal-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Trình duyệt chưa cho phép lưu bản xem thử.'))});}
export function validContent(data) {
  const projectValid=p=>typeof p?.project?.name==='string' && Array.isArray(p.team) && Array.isArray(p.posts) && typeof p.finish?.title==='string';
  if(data?.schemaVersion===1)return projectValid(data);
  return data?.schemaVersion===2 && Array.isArray(data.projects) && data.projects.length>0 && data.projects.every(p=>typeof p.id==='string'&&projectValid(p)) && new Set(data.projects.map(p=>p.id)).size===data.projects.length && (!data.personal||(typeof data.personal.name==='string'&&typeof data.personal.headline==='string'&&Array.isArray(data.personal.posts)));
}
export function normalizeLibrary(data){
  if(!validContent(data))throw new Error('Nội dung website chưa đúng định dạng.');
  if(data.schemaVersion===2){const library=structuredClone(data);library.personal??=personalDefaults();return library;}
  const old=structuredClone(data);delete old.schemaVersion;
  return {schemaVersion:2,activeProjectId:'project-forma',personal:personalDefaults(),projects:[{id:'project-forma',archived:false,createdAt:'2026-10-10',...old}]};
}
function utf8Base64(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
export class GitHubStore {
  constructor({owner,repo,branch,token,request=globalThis.fetch.bind(globalThis)}){
    if(!/^[A-Za-z0-9-]+$/.test(owner)||(!/^[A-Za-z0-9_.-]+$/.test(repo)||['.','..'].includes(repo)))throw new Error('Tên tài khoản hoặc repository không hợp lệ.');
    this.owner=owner;this.repo=repo;this.branch=branch;this.token=token;this.request=request;this.base=`https://api.github.com/repos/${owner}/${repo}`;this.mediaCache=new Map();this.outdatedHeads=new Set();this.adminVerified=false;
  }
  async api(path,method='GET',body){
    const url=new URL(`${this.base}${path}`);
    const repositoryPath=`/repos/${this.owner}/${this.repo}`;
    if(url.origin!=='https://api.github.com'||!(url.pathname===repositoryPath||url.pathname.startsWith(repositoryPath+'/')))throw new Error('Địa chỉ API GitHub không hợp lệ.');
    if(method==='GET')url.searchParams.set('_fresh',crypto.randomUUID());
    const response=await this.request(url.href,{method,cache:'no-store',redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${this.token}`,'X-GitHub-Api-Version':'2026-03-10',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok){
      if(response.status===401)throw new Error('Token không hợp lệ hoặc đã hết hạn. Hãy kết nối lại.');
      if(response.status===403)throw new Error('GitHub từ chối thao tác. Kiểm tra quyền Contents: Read and write, hạn mức API và chính sách của repository.');
      if(response.status===404)throw new Error('Không tìm thấy repo, nhánh hoặc content.json. Đưa mã nguồn lên repository trước khi kết nối.');
      if(response.status===409||response.status===422)throw new Error('Repository vừa có thay đổi hoặc nhánh được bảo vệ. Kết nối lại để lấy bản mới trước khi lưu; nội dung đang soạn vẫn ở đây.');
      throw new Error(`Chưa lưu được lên GitHub (HTTP ${response.status}). Hãy thử lại.`);
    }
    return response.json();
  }
  async load(){
    this.adminVerified=false;
    const identityResponse=await this.request('https://api.github.com/user',{method:'GET',cache:'no-store',redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${this.token}`,'X-GitHub-Api-Version':'2026-03-10'}});
    if(!identityResponse.ok)throw new Error('Không xác thực được tài khoản GitHub. Kiểm tra token và thời hạn.');
    const identity=await identityResponse.json();
    if(String(identity.login).toLowerCase()!=='chaos-long'||this.owner.toLowerCase()!=='chaos-long')throw new Error('Chỉ tài khoản chaos-long được quyền chỉnh sửa website này.');
    const repo=await this.api('');if(repo.permissions && !repo.permissions.push)throw new Error('Tài khoản này chưa có quyền ghi vào repository.');
    this.branch=this.branch||repo.default_branch;
    const ref=await this.api(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
    const file=await this.api(`/contents/content.json?ref=${ref.object.sha}`);
    if(file.encoding!=='base64'||!file.content)throw new Error('content.json phải dưới 1 MB và đúng định dạng của website.');
    const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0));const data=JSON.parse(new TextDecoder().decode(bytes));
    if(!validContent(data))throw new Error('Repository chưa có đúng cấu trúc nội dung của website.');
    this.contentSha=file.sha;this.outdatedHeads.clear();this.adminVerified=true;return data;
  }
  async save(content,message='Update project journal') {
    if(!this.adminVerified)throw new Error('Cần xác thực tài khoản quản trị chaos-long trước khi lưu.');
    if(this.busy)throw new Error('Đang lưu một thay đổi khác.');this.busy=true;
    try{
      // URL nonces bypass upstream caches as well as the browser's HTTP cache.
      // A pinned commit keeps the file revision and parent tree from the same snapshot.
      let ref,head,current;
      for(let attempt=0;attempt<4;attempt++){
        ref=await this.api(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
        current=await this.api(`/contents/content.json?ref=${ref.object.sha}`);
        if(current.sha===this.contentSha&&!this.outdatedHeads.has(ref.object.sha))break;
        if(attempt===3)throw new Error('Nội dung trên GitHub khác với phiên đang mở. Bản đang soạn vẫn được giữ; hãy kiểm tra xem có tab khác vừa lưu nội dung này không.');
        await new Promise(resolve=>setTimeout(resolve,200*(attempt+1)));
      }
      head=await this.api(`/git/commits/${ref.object.sha}`);
      const data=structuredClone(content);const tree=[];const newCache=new Map();let total=0;
      const visit=async object=>{
        for(const key of Object.keys(object)){
          const value=object[key];
          if((key==='src'||key==='photo'||key==='cover')&&typeof value==='string'&&value.startsWith('data:')){
            const match=value.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);const documentAllowed=key==='src'&&object.type==='file'&&documentTypes[object.extension]===match?.[1];if(!match||(!allowedTypes.has(match[1])&&!documentAllowed))throw new Error('File media không được hỗ trợ.');
            const size=match[2].length*3/4;total+=size;if(size>MAX_FILE+2||total>40*1024*1024)throw new Error('Mỗi file tối đa 20 MB, mỗi lần lưu tối đa 40 MB. Video dài hãy dùng link.');
            const ext=documentAllowed?object.extension:{ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif','video/mp4':'mp4','video/webm':'webm','video/ogg':'ogv'}[match[1]];
            const path=`media/${crypto.randomUUID()}.${ext}`;const blob=await this.api('/git/blobs','POST',{content:match[2],encoding:'base64'});
            tree.push({path,mode:'100644',type:'blob',sha:blob.sha});object[key]=path;newCache.set(path,value);
          }else if(value && typeof value==='object')await visit(value);
        }
      };await visit(data);
      const serialized=JSON.stringify(data,null,2)+'\n';if(new TextEncoder().encode(serialized).length>900000)throw new Error('Nội dung chữ quá lớn. Hãy rút ngắn bài viết để content.json dưới 900 KB.');
      const blob=await this.api('/git/blobs','POST',{content:utf8Base64(serialized),encoding:'base64'});
      tree.push({path:'content.json',mode:'100644',type:'blob',sha:blob.sha});
      const nextTree=await this.api('/git/trees','POST',{base_tree:head.tree.sha,tree});
      const commit=await this.api('/git/commits','POST',{message,tree:nextTree.sha,parents:[ref.object.sha]});
      await this.api(`/git/refs/heads/${encodeURIComponent(this.branch)}`,'PATCH',{sha:commit.sha,force:false});
      this.outdatedHeads.add(ref.object.sha);this.contentSha=blob.sha;for(const [path,url]of newCache)this.mediaCache.set(path,url);
      return data;
    }finally{this.busy=false}
  }
  disconnect(){this.token='';this.adminVerified=false;this.mediaCache.clear();this.outdatedHeads.clear();}
}
