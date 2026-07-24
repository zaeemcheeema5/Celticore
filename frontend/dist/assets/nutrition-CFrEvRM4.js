import{c as a,g as e}from"./index-BhWghfEG.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]],s=a("clipboard-check",o),r={submitRequest:t=>e.post("/api/nutrition",t),getAllRequests:()=>e.get("/api/nutrition"),getRequest:t=>e.get(`/api/nutrition/${t}`),updateStatus:(t,i)=>e.put(`/api/nutrition/${t}/status`,{status:i}),addNotes:(t,i)=>e.put(`/api/nutrition/${t}/notes`,{admin_notes:i})};export{s as C,r as n};
