import{_ as f}from"./VClick-BljA4HC7.js";import{d as g,z as v,o as c,b as _,e as t,f as S,i as h,h as $,c as k,k as a,l as u,q as y,s as P,B as p}from"../modules/vue-DYDBCuvn.js";import{u as w,f as x}from"./context-DiR1ZhSl.js";import"../index-BlQ9OrMa.js";import"../modules/shiki-RU0M5gy7.js";function d(e){return e.startsWith("/")?"/genaiscript/slides/garage-august2024/"+e.slice(1):e}function z(e,r=!1,o="cover"){const s=e&&(e[0]==="#"||e.startsWith("rgb")),n={background:s?e:void 0,color:e&&!s?"white":void 0,backgroundImage:s?void 0:e?r?`linear-gradient(#0005, #0008), url(${d(e)})`:`url("${d(e)}")`:void 0,backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:o};return n.background||delete n.background,n}const C={class:"grid grid-cols-2 w-full h-full auto-rows-fr"},B=g({__name:"image-right",props:{image:{type:String},class:{type:String},backgroundSize:{type:String,default:"cover"}},setup(e){const r=e,o=v(()=>z(r.image,!1,r.backgroundSize));return(s,n)=>(c(),_("div",C,[t("div",{class:h(["slidev-layout default",r.class])},[S(s.$slots,"default")],2),t("div",{class:"w-full h-full",style:$(o.value)},null,4)]))}}),R={__name:"vision.md__slidev_2",setup(e){const{$slidev:r,$nav:o,$clicksContext:s,$clicks:n,$page:b,$renderContext:L,$frontmatter:m}=w();return s.setup(),(A,l)=>{const i=f;return c(),k(B,y(P(p(x)(p(m),1))),{default:a(()=>[l[2]||(l[2]=t("h1",null,"Prompts are programs",-1)),l[3]||(l[3]=t("h2",null,null,-1)),l[4]||(l[4]=t("h3",null,"Scripting languages have had enormous impact",-1)),l[5]||(l[5]=t("ul",null,[t("li",null,"csh, bash, Perl, JavaScript, Python, etc.")],-1)),u(i,null,{default:a(()=>l[0]||(l[0]=[t("h3",null,"GenAIScript, a LLM-first script",-1),t("ul",null,[t("li",null,"JavaScript"),t("li",null,"genai runtime (PDF decoders, …)"),t("li",null,"context size handling"),t("li",null,"structured output parsing"),t("li",null,"tools…")],-1)])),_:1}),u(i,null,{default:a(()=>l[1]||(l[1]=[t("p",null," ",-1),t("h3",null,"Goal: A new era of LLM-powered scripts",-1)])),_:1})]),_:1},16)}}};export{R as default};