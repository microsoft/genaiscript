import{p as N}from"./chunk-K2ZEYYM2-pBWHtY8T.js";import{p as B}from"./radar-MK3ICKWK-55CS4JTO-Br9po1fi.js";import{a as i,g as U,s as V,b as Z,c as j,v as q,t as H,l as C,d as J,G as K,a7 as Q,a9 as X,aa as z,ab as Y,f as tt,A as et,ac as at,I as rt}from"./Mermaid.vue_vue_type_script_setup_true_lang-DnLLJQzm.js";import"./chunk-TGZYFRKZ-DtG7EnqW.js";import"./index-YoX1Dgrx.js";import"./modules/vue-BG_aqJxD.js";import"./modules/shiki-BflhZvTg.js";import"./modules/file-saver-C8BEGaqa.js";var it=rt.pie,D={sections:new Map,showData:!1},h=D.sections,w=D.showData,st=structuredClone(it),ot=i(()=>structuredClone(st),"getConfig"),nt=i(()=>{h=new Map,w=D.showData,et()},"clear"),lt=i(({label:t,value:a})=>{h.has(t)||(h.set(t,a),C.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),ct=i(()=>h,"getSections"),pt=i(t=>{w=t},"setShowData"),dt=i(()=>w,"getShowData"),G={getConfig:ot,clear:nt,setDiagramTitle:H,getDiagramTitle:q,setAccTitle:j,getAccTitle:Z,setAccDescription:V,getAccDescription:U,addSection:lt,getSections:ct,setShowData:pt,getShowData:dt},gt=i((t,a)=>{N(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),ut={parse:i(async t=>{const a=await B("pie",t);C.debug(a),gt(a,G)},"parse")},ft=i(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),ht=ft,mt=i(t=>{const a=[...t.entries()].map(s=>({label:s[0],value:s[1]})).sort((s,n)=>n.value-s.value);return at().value(s=>s.value)(a)},"createPieArcs"),vt=i((t,a,F,s)=>{C.debug(`rendering pie chart
`+t);const n=s.db,y=J(),T=K(n.getConfig(),y.pie),$=40,o=18,d=4,c=450,m=c,v=Q(a),l=v.append("g");l.attr("transform","translate("+m/2+","+c/2+")");const{themeVariables:r}=y;let[A]=X(r.pieOuterStrokeWidth);A??(A=2);const _=T.textPosition,g=Math.min(m,c)/2-$,W=z().innerRadius(0).outerRadius(g),I=z().innerRadius(g*_).outerRadius(g*_);l.append("circle").attr("cx",0).attr("cy",0).attr("r",g+A/2).attr("class","pieOuterCircle");const b=n.getSections(),S=mt(b),M=[r.pie1,r.pie2,r.pie3,r.pie4,r.pie5,r.pie6,r.pie7,r.pie8,r.pie9,r.pie10,r.pie11,r.pie12],p=Y(M);l.selectAll("mySlices").data(S).enter().append("path").attr("d",W).attr("fill",e=>p(e.data.label)).attr("class","pieCircle");let E=0;b.forEach(e=>{E+=e}),l.selectAll("mySlices").data(S).enter().append("text").text(e=>(e.data.value/E*100).toFixed(0)+"%").attr("transform",e=>"translate("+I.centroid(e)+")").style("text-anchor","middle").attr("class","slice"),l.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const x=l.selectAll(".legend").data(p.domain()).enter().append("g").attr("class","legend").attr("transform",(e,u)=>{const f=o+d,P=f*p.domain().length/2,R=12*o,L=u*f-P;return"translate("+R+","+L+")"});x.append("rect").attr("width",o).attr("height",o).style("fill",p).style("stroke",p),x.data(S).append("text").attr("x",o+d).attr("y",o-d).text(e=>{const{label:u,value:f}=e.data;return n.getShowData()?`${u} [${f}]`:u});const O=Math.max(...x.selectAll("text").nodes().map(e=>(e==null?void 0:e.getBoundingClientRect().width)??0)),k=m+$+o+d+O;v.attr("viewBox",`0 0 ${k} ${c}`),tt(v,c,k,T.useMaxWidth)},"draw"),St={draw:vt},_t={parser:ut,db:G,renderer:St,styles:ht};export{_t as diagram};
