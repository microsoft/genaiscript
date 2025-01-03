import{p as B}from"./chunk-K2ZEYYM2-BHOqS3Ue.js";import{p as U}from"./gitGraph-YCYPL57B-5MQDGNWY-CDQ1are6.js";import{H as q,q as H,t as V,s as Z,g as j,e as J,d as K,a as i,m as C,y as Q,f as X,I as Y,a9 as ee,ab as te,ac as z,ad as ae,n as re,ae as ie}from"./Mermaid.vue_vue_type_script_setup_true_lang-KYDylbl7.js";import"./chunk-TGZYFRKZ-7XD5vmeM.js";import"./index-CxaabCn0.js";import"./modules/vue-DrrT_JbO.js";import"./modules/shiki-Bvzriiql.js";import"./modules/file-saver-CsNJ2AjR.js";var F=q.pie,D={sections:new Map,showData:!1,config:F},m=D.sections,w=D.showData,se=structuredClone(F),oe=i(()=>structuredClone(se),"getConfig"),ne=i(()=>{m=new Map,w=D.showData,Q()},"clear"),le=i(({label:e,value:a})=>{m.has(e)||(m.set(e,a),C.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),ce=i(()=>m,"getSections"),pe=i(e=>{w=e},"setShowData"),de=i(()=>w,"getShowData"),G={getConfig:oe,clear:ne,setDiagramTitle:H,getDiagramTitle:V,setAccTitle:Z,getAccTitle:j,setAccDescription:J,getAccDescription:K,addSection:le,getSections:ce,setShowData:pe,getShowData:de},ge=i((e,a)=>{B(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ue={parse:i(async e=>{const a=await U("pie",e);C.debug(a),ge(a,G)},"parse")},fe=i(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),me=fe,he=i(e=>{const a=[...e.entries()].map(s=>({label:s[0],value:s[1]})).sort((s,n)=>n.value-s.value);return ie().value(s=>s.value)(a)},"createPieArcs"),Se=i((e,a,W,s)=>{C.debug(`rendering pie chart
`+e);const n=s.db,y=X(),T=Y(n.getConfig(),y.pie),$=40,o=18,d=4,l=450,h=l,S=ee(a),c=S.append("g");c.attr("transform","translate("+h/2+","+l/2+")");const{themeVariables:r}=y;let[A]=te(r.pieOuterStrokeWidth);A??(A=2);const _=T.textPosition,g=Math.min(h,l)/2-$,I=z().innerRadius(0).outerRadius(g),M=z().innerRadius(g*_).outerRadius(g*_);c.append("circle").attr("cx",0).attr("cy",0).attr("r",g+A/2).attr("class","pieOuterCircle");const b=n.getSections(),v=he(b),O=[r.pie1,r.pie2,r.pie3,r.pie4,r.pie5,r.pie6,r.pie7,r.pie8,r.pie9,r.pie10,r.pie11,r.pie12],p=ae(O);c.selectAll("mySlices").data(v).enter().append("path").attr("d",I).attr("fill",t=>p(t.data.label)).attr("class","pieCircle");let E=0;b.forEach(t=>{E+=t}),c.selectAll("mySlices").data(v).enter().append("text").text(t=>(t.data.value/E*100).toFixed(0)+"%").attr("transform",t=>"translate("+M.centroid(t)+")").style("text-anchor","middle").attr("class","slice"),c.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-(l-50)/2).attr("class","pieTitleText");const x=c.selectAll(".legend").data(p.domain()).enter().append("g").attr("class","legend").attr("transform",(t,u)=>{const f=o+d,R=f*p.domain().length/2,L=12*o,N=u*f-R;return"translate("+L+","+N+")"});x.append("rect").attr("width",o).attr("height",o).style("fill",p).style("stroke",p),x.data(v).append("text").attr("x",o+d).attr("y",o-d).text(t=>{const{label:u,value:f}=t.data;return n.getShowData()?`${u} [${f}]`:u});const P=Math.max(...x.selectAll("text").nodes().map(t=>(t==null?void 0:t.getBoundingClientRect().width)??0)),k=h+$+o+d+P;S.attr("viewBox",`0 0 ${k} ${l}`),re(S,l,k,T.useMaxWidth)},"draw"),ve={draw:Se},_e={parser:ue,db:G,renderer:ve,styles:me};export{_e as diagram};
