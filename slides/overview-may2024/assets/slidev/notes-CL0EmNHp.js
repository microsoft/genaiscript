import{d as F,t as y,L as N,z as d,M as T,o as u,b as f,e as t,h as C,B as o,l as r,k as p,x as z,F as $}from"../modules/vue-CJM4v41W.js";import{k as B,l as L,s as l,n as U,o as D,p as E}from"../index-QkK5sYl8.js";import{_ as H,C as M}from"./NoteDisplay.vue_vue_type_style_index_0_lang-CJJscCqB.js";import{_ as v}from"./IconButton.vue_vue_type_script_setup_true_lang-D6o-v3Uk.js";import"../modules/shiki-I8BuRXXi.js";const V={class:"h-full pt-2 flex flex-col"},I={class:"flex-none border-t border-main",px3:"",py2:""},P={class:"flex-none border-t border-main"},R={class:"flex gap-1 items-center px-6 py-3"},j={key:0,class:"i-carbon:minimize"},q={key:1,class:"i-carbon:maximize"},A={class:"p2 text-center"},X=F({__name:"notes",setup(G){B({title:`Notes - ${D}`});const{slides:b,total:m}=L(),{isFullscreen:_,toggle:g}=E,x=y(),a=N("slidev-notes-font-size",18),i=d(()=>{var e;return((e=l.lastUpdate)==null?void 0:e.type)==="viewer"?l.viewerPage:l.page}),k=d(()=>b.value.find(e=>e.no===i.value));T(i,()=>{var e;(e=x.value)==null||e.scrollTo({left:0,top:0,behavior:"smooth"}),window.scrollTo({left:0,top:0,behavior:"smooth"})});function w(){a.value=a.value+1}function S(){a.value=a.value-1}const h=d(()=>{var n,c;const e=((n=l.lastUpdate)==null?void 0:n.type)==="viewer"?l.viewerClicks:l.clicks,s=((c=l.lastUpdate)==null?void 0:c.type)==="viewer"?l.viewerClicksTotal:l.clicksTotal;return U(y(e),void 0,s)});return(e,s)=>{var n,c;return u(),f($,null,[t("div",{class:"fixed top-0 left-0 h-3px bg-primary transition-all duration-500",style:C({width:`${(i.value-1)/(o(m)-1)*100+1}%`})},null,4),t("div",V,[t("div",{ref_key:"scroller",ref:x,class:"px-5 flex-auto h-full overflow-auto",style:C({fontSize:`${o(a)}px`})},[r(H,{note:(n=k.value)==null?void 0:n.meta.slide.note,"note-html":(c=k.value)==null?void 0:c.meta.slide.noteHTML,placeholder:`No notes for Slide ${i.value}.`,"clicks-context":h.value,"auto-scroll":!0},null,8,["note","note-html","placeholder","clicks-context"])],4),t("div",I,[r(M,{"clicks-context":h.value,readonly:""},null,8,["clicks-context"])]),t("div",P,[t("div",R,[r(v,{title:o(_)?"Close fullscreen":"Enter fullscreen",onClick:o(g)},{default:p(()=>[o(_)?(u(),f("div",j)):(u(),f("div",q))]),_:1},8,["title","onClick"]),r(v,{title:"Increase font size",onClick:w},{default:p(()=>s[0]||(s[0]=[t("div",{class:"i-carbon:zoom-in"},null,-1)])),_:1}),r(v,{title:"Decrease font size",onClick:S},{default:p(()=>s[1]||(s[1]=[t("div",{class:"i-carbon:zoom-out"},null,-1)])),_:1}),s[2]||(s[2]=t("div",{class:"flex-auto"},null,-1)),t("div",A,z(i.value)+" / "+z(o(m)),1)])])])],64)}}});export{X as default};