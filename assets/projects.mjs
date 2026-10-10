export function visibleProjects(library){return library.projects.filter(project=>!project.deletedAt)}
export function selectedProject(library,id){
  const projects=visibleProjects(library);
  return projects.find(project=>project.id===id)||projects.find(project=>project.id===library.activeProjectId)||projects[0]||{id:'',placeholder:true,project:{name:'Projects',title:'Chưa có dự án',logo:null},team:[],posts:[],finish:{title:'',body:'',media:[]}};
}
export function trashProject(library,id,deletedAt=new Date().toISOString()){
  const next=structuredClone(library),project=next.projects.find(project=>project.id===id);
  if(!project||project.deletedAt)throw new Error('Dự án không còn trong danh sách.');
  project.deletedAt=deletedAt;
  if(next.activeProjectId===id)next.activeProjectId=visibleProjects(next)[0]?.id||'';
  return next;
}
export function restoreProject(library,id){
  const next=structuredClone(library),project=next.projects.find(project=>project.id===id);
  if(!project?.deletedAt)throw new Error('Dự án không nằm trong Thùng rác.');
  delete project.deletedAt;
  if(!visibleProjects(next).some(project=>project.id===next.activeProjectId))next.activeProjectId=id;
  return next;
}
