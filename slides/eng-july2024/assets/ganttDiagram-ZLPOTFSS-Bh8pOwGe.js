import{a as c,b as de,r as ot,M as Ke,N as Ie,f as ce,s as ct,g as lt,q as ut,t as dt,e as ft,d as ht,x as mt,m as be,l as pe,O as kt,P as yt,Q as gt,n as pt,R as vt,S as Tt,T as bt,U as je,V as Be,W as qe,X as Ge,Y as Xe,Z as He,$ as Ue,a0 as xt,h as _t,v as wt,a1 as Dt,a2 as St,a3 as Ct,a4 as Et,a5 as Mt,a6 as It,a7 as At}from"./Mermaid.vue_vue_type_script_setup_true_lang-CMllKN7m.js";import"./modules/vue-DbbOcb5G.js";import"./index-CkZH9Rf3.js";import"./modules/shiki-DLUXL2qD.js";import"./modules/file-saver-LUhfcczZ.js";var Lt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/isoWeek.js"(e,s){(function(a,r){typeof e=="object"&&typeof s<"u"?s.exports=r():typeof define=="function"&&define.amd?define(r):(a=typeof globalThis<"u"?globalThis:a||self).dayjs_plugin_isoWeek=r()})(e,function(){var a="day";return function(r,n,m){var f=c(function(E){return E.add(4-E.isoWeekday(),a)},"a"),w=n.prototype;w.isoWeekYear=function(){return f(this).year()},w.isoWeek=function(E){if(!this.$utils().u(E))return this.add(7*(E-this.isoWeek()),a);var g,M,O,P,j=f(this),C=(g=this.isoWeekYear(),M=this.$u,O=(M?m.utc:m)().year(g).startOf("year"),P=4-O.isoWeekday(),O.isoWeekday()>4&&(P+=7),O.add(P,a));return j.diff(C,"week")+1},w.isoWeekday=function(E){return this.$utils().u(E)?this.day()||7:this.day(this.day()%7?E:E-7)};var F=w.startOf;w.startOf=function(E,g){var M=this.$utils(),O=!!M.u(g)||g;return M.p(E)==="isoweek"?O?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):F.bind(this)(E,g)}}})}}),Yt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/customParseFormat.js"(e,s){(function(a,r){typeof e=="object"&&typeof s<"u"?s.exports=r():typeof define=="function"&&define.amd?define(r):(a=typeof globalThis<"u"?globalThis:a||self).dayjs_plugin_customParseFormat=r()})(e,function(){var a={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},r=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d/,m=/\d\d/,f=/\d\d?/,w=/\d*[^-_:/,()\s\d]+/,F={},E=c(function(p){return(p=+p)+(p>68?1900:2e3)},"a"),g=c(function(p){return function(S){this[p]=+S}},"f"),M=[/[+-]\d\d:?(\d\d)?|Z/,function(p){(this.zone||(this.zone={})).offset=function(S){if(!S||S==="Z")return 0;var L=S.match(/([+-]|\d\d)/g),Y=60*L[1]+(+L[2]||0);return Y===0?0:L[0]==="+"?-Y:Y}(p)}],O=c(function(p){var S=F[p];return S&&(S.indexOf?S:S.s.concat(S.f))},"u"),P=c(function(p,S){var L,Y=F.meridiem;if(Y){for(var q=1;q<=24;q+=1)if(p.indexOf(Y(q,0,S))>-1){L=q>12;break}}else L=p===(S?"pm":"PM");return L},"d"),j={A:[w,function(p){this.afternoon=P(p,!1)}],a:[w,function(p){this.afternoon=P(p,!0)}],Q:[n,function(p){this.month=3*(p-1)+1}],S:[n,function(p){this.milliseconds=100*+p}],SS:[m,function(p){this.milliseconds=10*+p}],SSS:[/\d{3}/,function(p){this.milliseconds=+p}],s:[f,g("seconds")],ss:[f,g("seconds")],m:[f,g("minutes")],mm:[f,g("minutes")],H:[f,g("hours")],h:[f,g("hours")],HH:[f,g("hours")],hh:[f,g("hours")],D:[f,g("day")],DD:[m,g("day")],Do:[w,function(p){var S=F.ordinal,L=p.match(/\d+/);if(this.day=L[0],S)for(var Y=1;Y<=31;Y+=1)S(Y).replace(/\[|\]/g,"")===p&&(this.day=Y)}],w:[f,g("week")],ww:[m,g("week")],M:[f,g("month")],MM:[m,g("month")],MMM:[w,function(p){var S=O("months"),L=(O("monthsShort")||S.map(function(Y){return Y.slice(0,3)})).indexOf(p)+1;if(L<1)throw new Error;this.month=L%12||L}],MMMM:[w,function(p){var S=O("months").indexOf(p)+1;if(S<1)throw new Error;this.month=S%12||S}],Y:[/[+-]?\d+/,g("year")],YY:[m,function(p){this.year=E(p)}],YYYY:[/\d{4}/,g("year")],Z:M,ZZ:M};function C(p){var S,L;S=p,L=F&&F.formats;for(var Y=(p=S.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(b,x,k){var _=k&&k.toUpperCase();return x||L[k]||a[k]||L[_].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(o,l,h){return l||h.slice(1)})})).match(r),q=Y.length,G=0;G<q;G+=1){var Q=Y[G],X=j[Q],y=X&&X[0],T=X&&X[1];Y[G]=T?{regex:y,parser:T}:Q.replace(/^\[|\]$/g,"")}return function(b){for(var x={},k=0,_=0;k<q;k+=1){var o=Y[k];if(typeof o=="string")_+=o.length;else{var l=o.regex,h=o.parser,d=b.slice(_),v=l.exec(d)[0];h.call(x,v),b=b.replace(v,"")}}return function(i){var u=i.afternoon;if(u!==void 0){var t=i.hours;u?t<12&&(i.hours+=12):t===12&&(i.hours=0),delete i.afternoon}}(x),x}}return c(C,"l"),function(p,S,L){L.p.customParseFormat=!0,p&&p.parseTwoDigitYear&&(E=p.parseTwoDigitYear);var Y=S.prototype,q=Y.parse;Y.parse=function(G){var Q=G.date,X=G.utc,y=G.args;this.$u=X;var T=y[1];if(typeof T=="string"){var b=y[2]===!0,x=y[3]===!0,k=b||x,_=y[2];x&&(_=y[2]),F=this.$locale(),!b&&_&&(F=L.Ls[_]),this.$d=function(d,v,i,u){try{if(["x","X"].indexOf(v)>-1)return new Date((v==="X"?1e3:1)*d);var t=C(v)(d),I=t.year,D=t.month,A=t.day,N=t.hours,W=t.minutes,V=t.seconds,J=t.milliseconds,ie=t.zone,ne=t.week,fe=new Date,he=A||(I||D?1:fe.getDate()),oe=I||fe.getFullYear(),z=0;I&&!D||(z=D>0?D-1:fe.getMonth());var U,B=N||0,ae=W||0,K=V||0,se=J||0;return ie?new Date(Date.UTC(oe,z,he,B,ae,K,se+60*ie.offset*1e3)):i?new Date(Date.UTC(oe,z,he,B,ae,K,se)):(U=new Date(oe,z,he,B,ae,K,se),ne&&(U=u(U).week(ne).toDate()),U)}catch{return new Date("")}}(Q,T,X,L),this.init(),_&&_!==!0&&(this.$L=this.locale(_).$L),k&&Q!=this.format(T)&&(this.$d=new Date("")),F={}}else if(T instanceof Array)for(var o=T.length,l=1;l<=o;l+=1){y[1]=T[l-1];var h=L.apply(this,y);if(h.isValid()){this.$d=h.$d,this.$L=h.$L,this.init();break}l===o&&(this.$d=new Date(""))}else q.call(this,G)}}})}}),Ft=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/advancedFormat.js"(e,s){(function(a,r){typeof e=="object"&&typeof s<"u"?s.exports=r():typeof define=="function"&&define.amd?define(r):(a=typeof globalThis<"u"?globalThis:a||self).dayjs_plugin_advancedFormat=r()})(e,function(){return function(a,r){var n=r.prototype,m=n.format;n.format=function(f){var w=this,F=this.$locale();if(!this.isValid())return m.bind(this)(f);var E=this.$utils(),g=(f||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(M){switch(M){case"Q":return Math.ceil((w.$M+1)/3);case"Do":return F.ordinal(w.$D);case"gggg":return w.weekYear();case"GGGG":return w.isoWeekYear();case"wo":return F.ordinal(w.week(),"W");case"w":case"ww":return E.s(w.week(),M==="w"?1:2,"0");case"W":case"WW":return E.s(w.isoWeek(),M==="W"?1:2,"0");case"k":case"kk":return E.s(String(w.$H===0?24:w.$H),M==="k"?1:2,"0");case"X":return Math.floor(w.$d.getTime()/1e3);case"x":return w.$d.getTime();case"z":return"["+w.offsetName()+"]";case"zzz":return"["+w.offsetName("long")+"]";default:return M}});return m.bind(this)(g)}}})}}),Se=function(){var e=c(function(_,o,l,h){for(l=l||{},h=_.length;h--;l[_[h]]=o);return l},"o"),s=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],a=[1,26],r=[1,27],n=[1,28],m=[1,29],f=[1,30],w=[1,31],F=[1,32],E=[1,33],g=[1,34],M=[1,9],O=[1,10],P=[1,11],j=[1,12],C=[1,13],p=[1,14],S=[1,15],L=[1,16],Y=[1,19],q=[1,20],G=[1,21],Q=[1,22],X=[1,23],y=[1,25],T=[1,35],b={trace:c(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:c(function(o,l,h,d,v,i,u){var t=i.length-1;switch(v){case 1:return i[t-1];case 2:this.$=[];break;case 3:i[t-1].push(i[t]),this.$=i[t-1];break;case 4:case 5:this.$=i[t];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(i[t].substr(11)),this.$=i[t].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=i[t].substr(18);break;case 19:d.TopAxis(),this.$=i[t].substr(8);break;case 20:d.setAxisFormat(i[t].substr(11)),this.$=i[t].substr(11);break;case 21:d.setTickInterval(i[t].substr(13)),this.$=i[t].substr(13);break;case 22:d.setExcludes(i[t].substr(9)),this.$=i[t].substr(9);break;case 23:d.setIncludes(i[t].substr(9)),this.$=i[t].substr(9);break;case 24:d.setTodayMarker(i[t].substr(12)),this.$=i[t].substr(12);break;case 27:d.setDiagramTitle(i[t].substr(6)),this.$=i[t].substr(6);break;case 28:this.$=i[t].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=i[t].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(i[t].substr(8)),this.$=i[t].substr(8);break;case 33:d.addTask(i[t-1],i[t]),this.$="task";break;case 34:this.$=i[t-1],d.setClickEvent(i[t-1],i[t],null);break;case 35:this.$=i[t-2],d.setClickEvent(i[t-2],i[t-1],i[t]);break;case 36:this.$=i[t-2],d.setClickEvent(i[t-2],i[t-1],null),d.setLink(i[t-2],i[t]);break;case 37:this.$=i[t-3],d.setClickEvent(i[t-3],i[t-2],i[t-1]),d.setLink(i[t-3],i[t]);break;case 38:this.$=i[t-2],d.setClickEvent(i[t-2],i[t],null),d.setLink(i[t-2],i[t-1]);break;case 39:this.$=i[t-3],d.setClickEvent(i[t-3],i[t-1],i[t]),d.setLink(i[t-3],i[t-2]);break;case 40:this.$=i[t-1],d.setLink(i[t-1],i[t]);break;case 41:case 47:this.$=i[t-1]+" "+i[t];break;case 42:case 43:case 45:this.$=i[t-2]+" "+i[t-1]+" "+i[t];break;case 44:case 46:this.$=i[t-3]+" "+i[t-2]+" "+i[t-1]+" "+i[t];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(s,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:a,13:r,14:n,15:m,16:f,17:w,18:F,19:18,20:E,21:g,22:M,23:O,24:P,25:j,26:C,27:p,28:S,29:L,30:Y,31:q,33:G,35:Q,36:X,37:24,38:y,40:T},e(s,[2,7],{1:[2,1]}),e(s,[2,3]),{9:36,11:17,12:a,13:r,14:n,15:m,16:f,17:w,18:F,19:18,20:E,21:g,22:M,23:O,24:P,25:j,26:C,27:p,28:S,29:L,30:Y,31:q,33:G,35:Q,36:X,37:24,38:y,40:T},e(s,[2,5]),e(s,[2,6]),e(s,[2,17]),e(s,[2,18]),e(s,[2,19]),e(s,[2,20]),e(s,[2,21]),e(s,[2,22]),e(s,[2,23]),e(s,[2,24]),e(s,[2,25]),e(s,[2,26]),e(s,[2,27]),{32:[1,37]},{34:[1,38]},e(s,[2,30]),e(s,[2,31]),e(s,[2,32]),{39:[1,39]},e(s,[2,8]),e(s,[2,9]),e(s,[2,10]),e(s,[2,11]),e(s,[2,12]),e(s,[2,13]),e(s,[2,14]),e(s,[2,15]),e(s,[2,16]),{41:[1,40],43:[1,41]},e(s,[2,4]),e(s,[2,28]),e(s,[2,29]),e(s,[2,33]),e(s,[2,34],{42:[1,42],43:[1,43]}),e(s,[2,40],{41:[1,44]}),e(s,[2,35],{43:[1,45]}),e(s,[2,36]),e(s,[2,38],{42:[1,46]}),e(s,[2,37]),e(s,[2,39])],defaultActions:{},parseError:c(function(o,l){if(l.recoverable)this.trace(o);else{var h=new Error(o);throw h.hash=l,h}},"parseError"),parse:c(function(o){var l=this,h=[0],d=[],v=[null],i=[],u=this.table,t="",I=0,D=0,A=2,N=1,W=i.slice.call(arguments,1),V=Object.create(this.lexer),J={yy:{}};for(var ie in this.yy)Object.prototype.hasOwnProperty.call(this.yy,ie)&&(J.yy[ie]=this.yy[ie]);V.setInput(o,J.yy),J.yy.lexer=V,J.yy.parser=this,typeof V.yylloc>"u"&&(V.yylloc={});var ne=V.yylloc;i.push(ne);var fe=V.options&&V.options.ranges;typeof J.yy.parseError=="function"?this.parseError=J.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function he(H){h.length=h.length-2*H,v.length=v.length-H,i.length=i.length-H}c(he,"popStack");function oe(){var H;return H=d.pop()||V.lex()||N,typeof H!="number"&&(H instanceof Array&&(d=H,H=d.pop()),H=l.symbols_[H]||H),H}c(oe,"lex");for(var z,U,B,ae,K={},se,$,Ne,ge;;){if(U=h[h.length-1],this.defaultActions[U]?B=this.defaultActions[U]:((z===null||typeof z>"u")&&(z=oe()),B=u[U]&&u[U][z]),typeof B>"u"||!B.length||!B[0]){var we="";ge=[];for(se in u[U])this.terminals_[se]&&se>A&&ge.push("'"+this.terminals_[se]+"'");V.showPosition?we="Parse error on line "+(I+1)+`:
`+V.showPosition()+`
Expecting `+ge.join(", ")+", got '"+(this.terminals_[z]||z)+"'":we="Parse error on line "+(I+1)+": Unexpected "+(z==N?"end of input":"'"+(this.terminals_[z]||z)+"'"),this.parseError(we,{text:V.match,token:this.terminals_[z]||z,line:V.yylineno,loc:ne,expected:ge})}if(B[0]instanceof Array&&B.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+z);switch(B[0]){case 1:h.push(z),v.push(V.yytext),i.push(V.yylloc),h.push(B[1]),z=null,D=V.yyleng,t=V.yytext,I=V.yylineno,ne=V.yylloc;break;case 2:if($=this.productions_[B[1]][1],K.$=v[v.length-$],K._$={first_line:i[i.length-($||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-($||1)].first_column,last_column:i[i.length-1].last_column},fe&&(K._$.range=[i[i.length-($||1)].range[0],i[i.length-1].range[1]]),ae=this.performAction.apply(K,[t,D,I,J.yy,B[1],v,i].concat(W)),typeof ae<"u")return ae;$&&(h=h.slice(0,-1*$*2),v=v.slice(0,-1*$),i=i.slice(0,-1*$)),h.push(this.productions_[B[1]][0]),v.push(K.$),i.push(K._$),Ne=u[h[h.length-2]][h[h.length-1]],h.push(Ne);break;case 3:return!0}}return!0},"parse")},x=function(){var _={EOF:1,parseError:c(function(l,h){if(this.yy.parser)this.yy.parser.parseError(l,h);else throw new Error(l)},"parseError"),setInput:c(function(o,l){return this.yy=l||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:c(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var l=o.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:c(function(o){var l=o.length,h=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var v=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===d.length?this.yylloc.first_column:0)+d[d.length-h.length].length-h[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[v[0],v[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:c(function(){return this._more=!0,this},"more"),reject:c(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:c(function(o){this.unput(this.match.slice(o))},"less"),pastInput:c(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:c(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:c(function(){var o=this.pastInput(),l=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:c(function(o,l){var h,d,v;if(this.options.backtrack_lexer&&(v={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(v.yylloc.range=this.yylloc.range.slice(0))),d=o[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],h=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var i in v)this[i]=v[i];return!1}return!1},"test_match"),next:c(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,l,h,d;this._more||(this.yytext="",this.match="");for(var v=this._currentRules(),i=0;i<v.length;i++)if(h=this._input.match(this.rules[v[i]]),h&&(!l||h[0].length>l[0].length)){if(l=h,d=i,this.options.backtrack_lexer){if(o=this.test_match(h,v[i]),o!==!1)return o;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(o=this.test_match(l,v[d]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:c(function(){var l=this.next();return l||this.lex()},"lex"),begin:c(function(l){this.conditionStack.push(l)},"begin"),popState:c(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:c(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:c(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:c(function(l){this.begin(l)},"pushState"),stateStackSize:c(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:c(function(l,h,d,v){switch(d){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return _}();b.lexer=x;function k(){this.yy={}}return c(k,"Parser"),k.prototype=b,b.Parser=k,new k}();Se.parser=Se;var Wt=Se,Vt=de(ot()),Z=de(Ke()),Ot=de(Lt()),Pt=de(Yt()),zt=de(Ft());Z.default.extend(Ot.default);Z.default.extend(Pt.default);Z.default.extend(zt.default);var Ze={friday:5,saturday:6},ee="",Ae="",Le=void 0,Ye="",me=[],ke=[],Fe=new Map,We=[],xe=[],ue="",Ve="",$e=["active","done","crit","milestone"],Oe=[],ye=!1,Pe=!1,ze="sunday",_e="saturday",Ce=0,Rt=c(function(){We=[],xe=[],ue="",Oe=[],ve=0,Me=void 0,Te=void 0,R=[],ee="",Ae="",Ve="",Le=void 0,Ye="",me=[],ke=[],ye=!1,Pe=!1,Ce=0,Fe=new Map,mt(),ze="sunday",_e="saturday"},"clear"),Nt=c(function(e){Ae=e},"setAxisFormat"),jt=c(function(){return Ae},"getAxisFormat"),Bt=c(function(e){Le=e},"setTickInterval"),qt=c(function(){return Le},"getTickInterval"),Gt=c(function(e){Ye=e},"setTodayMarker"),Xt=c(function(){return Ye},"getTodayMarker"),Ht=c(function(e){ee=e},"setDateFormat"),Ut=c(function(){ye=!0},"enableInclusiveEndDates"),Zt=c(function(){return ye},"endDatesAreInclusive"),Qt=c(function(){Pe=!0},"enableTopAxis"),Jt=c(function(){return Pe},"topAxisEnabled"),Kt=c(function(e){Ve=e},"setDisplayMode"),$t=c(function(){return Ve},"getDisplayMode"),es=c(function(){return ee},"getDateFormat"),ts=c(function(e){me=e.toLowerCase().split(/[\s,]+/)},"setIncludes"),ss=c(function(){return me},"getIncludes"),as=c(function(e){ke=e.toLowerCase().split(/[\s,]+/)},"setExcludes"),rs=c(function(){return ke},"getExcludes"),is=c(function(){return Fe},"getLinks"),ns=c(function(e){ue=e,We.push(e)},"addSection"),os=c(function(){return We},"getSections"),cs=c(function(){let e=Qe();const s=10;let a=0;for(;!e&&a<s;)e=Qe(),a++;return xe=R,xe},"getTasks"),et=c(function(e,s,a,r){return r.includes(e.format(s.trim()))?!1:a.includes("weekends")&&(e.isoWeekday()===Ze[_e]||e.isoWeekday()===Ze[_e]+1)||a.includes(e.format("dddd").toLowerCase())?!0:a.includes(e.format(s.trim()))},"isInvalidDate"),ls=c(function(e){ze=e},"setWeekday"),us=c(function(){return ze},"getWeekday"),ds=c(function(e){_e=e},"setWeekend"),tt=c(function(e,s,a,r){if(!a.length||e.manualEndTime)return;let n;e.startTime instanceof Date?n=(0,Z.default)(e.startTime):n=(0,Z.default)(e.startTime,s,!0),n=n.add(1,"d");let m;e.endTime instanceof Date?m=(0,Z.default)(e.endTime):m=(0,Z.default)(e.endTime,s,!0);const[f,w]=fs(n,m,s,a,r);e.endTime=f.toDate(),e.renderEndTime=w},"checkTaskDates"),fs=c(function(e,s,a,r,n){let m=!1,f=null;for(;e<=s;)m||(f=s.toDate()),m=et(e,a,r,n),m&&(s=s.add(1,"d")),e=e.add(1,"d");return[s,f]},"fixTaskDates"),Ee=c(function(e,s,a){a=a.trim();const n=/^after\s+(?<ids>[\d\w- ]+)/.exec(a);if(n!==null){let f=null;for(const F of n.groups.ids.split(" ")){let E=re(F);E!==void 0&&(!f||E.endTime>f.endTime)&&(f=E)}if(f)return f.endTime;const w=new Date;return w.setHours(0,0,0,0),w}let m=(0,Z.default)(a,s.trim(),!0);if(m.isValid())return m.toDate();{be.debug("Invalid date:"+a),be.debug("With date format:"+s.trim());const f=new Date(a);if(f===void 0||isNaN(f.getTime())||f.getFullYear()<-1e4||f.getFullYear()>1e4)throw new Error("Invalid date:"+a);return f}},"getStartDate"),st=c(function(e){const s=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(e.trim());return s!==null?[Number.parseFloat(s[1]),s[2]]:[NaN,"ms"]},"parseDuration"),at=c(function(e,s,a,r=!1){a=a.trim();const m=/^until\s+(?<ids>[\d\w- ]+)/.exec(a);if(m!==null){let g=null;for(const O of m.groups.ids.split(" ")){let P=re(O);P!==void 0&&(!g||P.startTime<g.startTime)&&(g=P)}if(g)return g.startTime;const M=new Date;return M.setHours(0,0,0,0),M}let f=(0,Z.default)(a,s.trim(),!0);if(f.isValid())return r&&(f=f.add(1,"d")),f.toDate();let w=(0,Z.default)(e);const[F,E]=st(a);if(!Number.isNaN(F)){const g=w.add(F,E);g.isValid()&&(w=g)}return w.toDate()},"getEndDate"),ve=0,le=c(function(e){return e===void 0?(ve=ve+1,"task"+ve):e},"parseId"),hs=c(function(e,s){let a;s.substr(0,1)===":"?a=s.substr(1,s.length):a=s;const r=a.split(","),n={};Re(r,n,$e);for(let f=0;f<r.length;f++)r[f]=r[f].trim();let m="";switch(r.length){case 1:n.id=le(),n.startTime=e.endTime,m=r[0];break;case 2:n.id=le(),n.startTime=Ee(void 0,ee,r[0]),m=r[1];break;case 3:n.id=le(r[0]),n.startTime=Ee(void 0,ee,r[1]),m=r[2];break}return m&&(n.endTime=at(n.startTime,ee,m,ye),n.manualEndTime=(0,Z.default)(m,"YYYY-MM-DD",!0).isValid(),tt(n,ee,ke,me)),n},"compileData"),ms=c(function(e,s){let a;s.substr(0,1)===":"?a=s.substr(1,s.length):a=s;const r=a.split(","),n={};Re(r,n,$e);for(let m=0;m<r.length;m++)r[m]=r[m].trim();switch(r.length){case 1:n.id=le(),n.startTime={type:"prevTaskEnd",id:e},n.endTime={data:r[0]};break;case 2:n.id=le(),n.startTime={type:"getStartDate",startData:r[0]},n.endTime={data:r[1]};break;case 3:n.id=le(r[0]),n.startTime={type:"getStartDate",startData:r[1]},n.endTime={data:r[2]};break}return n},"parseData"),Me,Te,R=[],rt={},ks=c(function(e,s){const a={section:ue,type:ue,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:s},task:e,classes:[]},r=ms(Te,s);a.raw.startTime=r.startTime,a.raw.endTime=r.endTime,a.id=r.id,a.prevTaskId=Te,a.active=r.active,a.done=r.done,a.crit=r.crit,a.milestone=r.milestone,a.order=Ce,Ce++;const n=R.push(a);Te=a.id,rt[a.id]=n-1},"addTask"),re=c(function(e){const s=rt[e];return R[s]},"findTaskById"),ys=c(function(e,s){const a={section:ue,type:ue,description:e,task:e,classes:[]},r=hs(Me,s);a.startTime=r.startTime,a.endTime=r.endTime,a.id=r.id,a.active=r.active,a.done=r.done,a.crit=r.crit,a.milestone=r.milestone,Me=a,xe.push(a)},"addTaskOrg"),Qe=c(function(){const e=c(function(a){const r=R[a];let n="";switch(R[a].raw.startTime.type){case"prevTaskEnd":{const m=re(r.prevTaskId);r.startTime=m.endTime;break}case"getStartDate":n=Ee(void 0,ee,R[a].raw.startTime.startData),n&&(R[a].startTime=n);break}return R[a].startTime&&(R[a].endTime=at(R[a].startTime,ee,R[a].raw.endTime.data,ye),R[a].endTime&&(R[a].processed=!0,R[a].manualEndTime=(0,Z.default)(R[a].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),tt(R[a],ee,ke,me))),R[a].processed},"compileTask");let s=!0;for(const[a,r]of R.entries())e(a),s=s&&r.processed;return s},"compileTasks"),gs=c(function(e,s){let a=s;ce().securityLevel!=="loose"&&(a=(0,Vt.sanitizeUrl)(s)),e.split(",").forEach(function(r){re(r)!==void 0&&(nt(r,()=>{window.open(a,"_self")}),Fe.set(r,a))}),it(e,"clickable")},"setLink"),it=c(function(e,s){e.split(",").forEach(function(a){let r=re(a);r!==void 0&&r.classes.push(s)})},"setClass"),ps=c(function(e,s,a){if(ce().securityLevel!=="loose"||s===void 0)return;let r=[];if(typeof a=="string"){r=a.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let m=0;m<r.length;m++){let f=r[m].trim();f.startsWith('"')&&f.endsWith('"')&&(f=f.substr(1,f.length-2)),r[m]=f}}r.length===0&&r.push(e),re(e)!==void 0&&nt(e,()=>{wt.runFunc(s,...r)})},"setClickFun"),nt=c(function(e,s){Oe.push(function(){const a=document.querySelector(`[id="${e}"]`);a!==null&&a.addEventListener("click",function(){s()})},function(){const a=document.querySelector(`[id="${e}-text"]`);a!==null&&a.addEventListener("click",function(){s()})})},"pushFun"),vs=c(function(e,s,a){e.split(",").forEach(function(r){ps(r,s,a)}),it(e,"clickable")},"setClickEvent"),Ts=c(function(e){Oe.forEach(function(s){s(e)})},"bindFunctions"),bs={getConfig:c(()=>ce().gantt,"getConfig"),clear:Rt,setDateFormat:Ht,getDateFormat:es,enableInclusiveEndDates:Ut,endDatesAreInclusive:Zt,enableTopAxis:Qt,topAxisEnabled:Jt,setAxisFormat:Nt,getAxisFormat:jt,setTickInterval:Bt,getTickInterval:qt,setTodayMarker:Gt,getTodayMarker:Xt,setAccTitle:ct,getAccTitle:lt,setDiagramTitle:ut,getDiagramTitle:dt,setDisplayMode:Kt,getDisplayMode:$t,setAccDescription:ft,getAccDescription:ht,addSection:ns,getSections:os,getTasks:cs,addTask:ks,findTaskById:re,addTaskOrg:ys,setIncludes:ts,getIncludes:ss,setExcludes:as,getExcludes:rs,setClickEvent:vs,setLink:gs,getLinks:is,bindFunctions:Ts,parseDuration:st,isInvalidDate:et,setWeekday:ls,getWeekday:us,setWeekend:ds};function Re(e,s,a){let r=!0;for(;r;)r=!1,a.forEach(function(n){const m="^\\s*"+n+"\\s*$",f=new RegExp(m);e[0].match(f)&&(s[n]=!0,e.shift(1),r=!0)})}c(Re,"getTaskTags");var De=de(Ke()),xs=c(function(){be.debug("Something is calling, setConf, remove the call")},"setConf"),Je={monday:Dt,tuesday:St,wednesday:Ct,thursday:Et,friday:Mt,saturday:It,sunday:At},_s=c((e,s)=>{let a=[...e].map(()=>-1/0),r=[...e].sort((m,f)=>m.startTime-f.startTime||m.order-f.order),n=0;for(const m of r)for(let f=0;f<a.length;f++)if(m.startTime>=a[f]){a[f]=m.endTime,m.order=f+s,f>n&&(n=f);break}return n},"getMaxIntersections"),te,ws=c(function(e,s,a,r){const n=ce().gantt,m=ce().securityLevel;let f;m==="sandbox"&&(f=pe("#i"+s));const w=m==="sandbox"?pe(f.nodes()[0].contentDocument.body):pe("body"),F=m==="sandbox"?f.nodes()[0].contentDocument:document,E=F.getElementById(s);te=E.parentElement.offsetWidth,te===void 0&&(te=1200),n.useWidth!==void 0&&(te=n.useWidth);const g=r.db.getTasks();let M=[];for(const y of g)M.push(y.type);M=X(M);const O={};let P=2*n.topPadding;if(r.db.getDisplayMode()==="compact"||n.displayMode==="compact"){const y={};for(const b of g)y[b.section]===void 0?y[b.section]=[b]:y[b.section].push(b);let T=0;for(const b of Object.keys(y)){const x=_s(y[b],T)+1;T+=x,P+=x*(n.barHeight+n.barGap),O[b]=x}}else{P+=g.length*(n.barHeight+n.barGap);for(const y of M)O[y]=g.filter(T=>T.type===y).length}E.setAttribute("viewBox","0 0 "+te+" "+P);const j=w.select(`[id="${s}"]`),C=kt().domain([yt(g,function(y){return y.startTime}),gt(g,function(y){return y.endTime})]).rangeRound([0,te-n.leftPadding-n.rightPadding]);function p(y,T){const b=y.startTime,x=T.startTime;let k=0;return b>x?k=1:b<x&&(k=-1),k}c(p,"taskCompare"),g.sort(p),S(g,te,P),pt(j,P,te,n.useMaxWidth),j.append("text").text(r.db.getDiagramTitle()).attr("x",te/2).attr("y",n.titleTopMargin).attr("class","titleText");function S(y,T,b){const x=n.barHeight,k=x+n.barGap,_=n.topPadding,o=n.leftPadding,l=vt().domain([0,M.length]).range(["#00B9FA","#F95002"]).interpolate(Tt);Y(k,_,o,T,b,y,r.db.getExcludes(),r.db.getIncludes()),q(o,_,T,b),L(y,k,_,o,x,l,T),G(k,_),Q(o,_,T,b)}c(S,"makeGantt");function L(y,T,b,x,k,_,o){const h=[...new Set(y.map(u=>u.order))].map(u=>y.find(t=>t.order===u));j.append("g").selectAll("rect").data(h).enter().append("rect").attr("x",0).attr("y",function(u,t){return t=u.order,t*T+b-2}).attr("width",function(){return o-n.rightPadding/2}).attr("height",T).attr("class",function(u){for(const[t,I]of M.entries())if(u.type===I)return"section section"+t%n.numberSectionStyles;return"section section0"});const d=j.append("g").selectAll("rect").data(y).enter(),v=r.db.getLinks();if(d.append("rect").attr("id",function(u){return u.id}).attr("rx",3).attr("ry",3).attr("x",function(u){return u.milestone?C(u.startTime)+x+.5*(C(u.endTime)-C(u.startTime))-.5*k:C(u.startTime)+x}).attr("y",function(u,t){return t=u.order,t*T+b}).attr("width",function(u){return u.milestone?k:C(u.renderEndTime||u.endTime)-C(u.startTime)}).attr("height",k).attr("transform-origin",function(u,t){return t=u.order,(C(u.startTime)+x+.5*(C(u.endTime)-C(u.startTime))).toString()+"px "+(t*T+b+.5*k).toString()+"px"}).attr("class",function(u){const t="task";let I="";u.classes.length>0&&(I=u.classes.join(" "));let D=0;for(const[N,W]of M.entries())u.type===W&&(D=N%n.numberSectionStyles);let A="";return u.active?u.crit?A+=" activeCrit":A=" active":u.done?u.crit?A=" doneCrit":A=" done":u.crit&&(A+=" crit"),A.length===0&&(A=" task"),u.milestone&&(A=" milestone "+A),A+=D,A+=" "+I,t+A}),d.append("text").attr("id",function(u){return u.id+"-text"}).text(function(u){return u.task}).attr("font-size",n.fontSize).attr("x",function(u){let t=C(u.startTime),I=C(u.renderEndTime||u.endTime);u.milestone&&(t+=.5*(C(u.endTime)-C(u.startTime))-.5*k),u.milestone&&(I=t+k);const D=this.getBBox().width;return D>I-t?I+D+1.5*n.leftPadding>o?t+x-5:I+x+5:(I-t)/2+t+x}).attr("y",function(u,t){return t=u.order,t*T+n.barHeight/2+(n.fontSize/2-2)+b}).attr("text-height",k).attr("class",function(u){const t=C(u.startTime);let I=C(u.endTime);u.milestone&&(I=t+k);const D=this.getBBox().width;let A="";u.classes.length>0&&(A=u.classes.join(" "));let N=0;for(const[V,J]of M.entries())u.type===J&&(N=V%n.numberSectionStyles);let W="";return u.active&&(u.crit?W="activeCritText"+N:W="activeText"+N),u.done?u.crit?W=W+" doneCritText"+N:W=W+" doneText"+N:u.crit&&(W=W+" critText"+N),u.milestone&&(W+=" milestoneText"),D>I-t?I+D+1.5*n.leftPadding>o?A+" taskTextOutsideLeft taskTextOutside"+N+" "+W:A+" taskTextOutsideRight taskTextOutside"+N+" "+W+" width-"+D:A+" taskText taskText"+N+" "+W+" width-"+D}),ce().securityLevel==="sandbox"){let u;u=pe("#i"+s);const t=u.nodes()[0].contentDocument;d.filter(function(I){return v.has(I.id)}).each(function(I){var D=t.querySelector("#"+I.id),A=t.querySelector("#"+I.id+"-text");const N=D.parentNode;var W=t.createElement("a");W.setAttribute("xlink:href",v.get(I.id)),W.setAttribute("target","_top"),N.appendChild(W),W.appendChild(D),W.appendChild(A)})}}c(L,"drawRects");function Y(y,T,b,x,k,_,o,l){if(o.length===0&&l.length===0)return;let h,d;for(const{startTime:D,endTime:A}of _)(h===void 0||D<h)&&(h=D),(d===void 0||A>d)&&(d=A);if(!h||!d)return;if((0,De.default)(d).diff((0,De.default)(h),"year")>5){be.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const v=r.db.getDateFormat(),i=[];let u=null,t=(0,De.default)(h);for(;t.valueOf()<=d;)r.db.isInvalidDate(t,v,o,l)?u?u.end=t:u={start:t,end:t}:u&&(i.push(u),u=null),t=t.add(1,"d");j.append("g").selectAll("rect").data(i).enter().append("rect").attr("id",function(D){return"exclude-"+D.start.format("YYYY-MM-DD")}).attr("x",function(D){return C(D.start)+b}).attr("y",n.gridLineStartPadding).attr("width",function(D){const A=D.end.add(1,"day");return C(A)-C(D.start)}).attr("height",k-T-n.gridLineStartPadding).attr("transform-origin",function(D,A){return(C(D.start)+b+.5*(C(D.end)-C(D.start))).toString()+"px "+(A*y+.5*k).toString()+"px"}).attr("class","exclude-range")}c(Y,"drawExcludeDays");function q(y,T,b,x){let k=bt(C).tickSize(-x+T+n.gridLineStartPadding).tickFormat(je(r.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));const o=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||n.tickInterval);if(o!==null){const l=o[1],h=o[2],d=r.db.getWeekday()||n.weekday;switch(h){case"millisecond":k.ticks(Ue.every(l));break;case"second":k.ticks(He.every(l));break;case"minute":k.ticks(Xe.every(l));break;case"hour":k.ticks(Ge.every(l));break;case"day":k.ticks(qe.every(l));break;case"week":k.ticks(Je[d].every(l));break;case"month":k.ticks(Be.every(l));break}}if(j.append("g").attr("class","grid").attr("transform","translate("+y+", "+(x-50)+")").call(k).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||n.topAxis){let l=xt(C).tickSize(-x+T+n.gridLineStartPadding).tickFormat(je(r.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));if(o!==null){const h=o[1],d=o[2],v=r.db.getWeekday()||n.weekday;switch(d){case"millisecond":l.ticks(Ue.every(h));break;case"second":l.ticks(He.every(h));break;case"minute":l.ticks(Xe.every(h));break;case"hour":l.ticks(Ge.every(h));break;case"day":l.ticks(qe.every(h));break;case"week":l.ticks(Je[v].every(h));break;case"month":l.ticks(Be.every(h));break}}j.append("g").attr("class","grid").attr("transform","translate("+y+", "+T+")").call(l).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}c(q,"makeGrid");function G(y,T){let b=0;const x=Object.keys(O).map(k=>[k,O[k]]);j.append("g").selectAll("text").data(x).enter().append(function(k){const _=k[0].split(_t.lineBreakRegex),o=-(_.length-1)/2,l=F.createElementNS("http://www.w3.org/2000/svg","text");l.setAttribute("dy",o+"em");for(const[h,d]of _.entries()){const v=F.createElementNS("http://www.w3.org/2000/svg","tspan");v.setAttribute("alignment-baseline","central"),v.setAttribute("x","10"),h>0&&v.setAttribute("dy","1em"),v.textContent=d,l.appendChild(v)}return l}).attr("x",10).attr("y",function(k,_){if(_>0)for(let o=0;o<_;o++)return b+=x[_-1][1],k[1]*y/2+b*y+T;else return k[1]*y/2+T}).attr("font-size",n.sectionFontSize).attr("class",function(k){for(const[_,o]of M.entries())if(k[0]===o)return"sectionTitle sectionTitle"+_%n.numberSectionStyles;return"sectionTitle"})}c(G,"vertLabels");function Q(y,T,b,x){const k=r.db.getTodayMarker();if(k==="off")return;const _=j.append("g").attr("class","today"),o=new Date,l=_.append("line");l.attr("x1",C(o)+y).attr("x2",C(o)+y).attr("y1",n.titleTopMargin).attr("y2",x-n.titleTopMargin).attr("class","today"),k!==""&&l.attr("style",k.replace(/,/g,";"))}c(Q,"drawToday");function X(y){const T={},b=[];for(let x=0,k=y.length;x<k;++x)Object.prototype.hasOwnProperty.call(T,y[x])||(T[y[x]]=!0,b.push(y[x]));return b}c(X,"checkUnique")},"draw"),Ds={setConf:xs,draw:ws},Ss=c(e=>`
  .mermaid-main-font {
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .exclude-range {
    fill: ${e.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${e.sectionBkgColor};
  }

  .section2 {
    fill: ${e.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${e.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${e.titleColor};
  }

  .sectionTitle1 {
    fill: ${e.titleColor};
  }

  .sectionTitle2 {
    fill: ${e.titleColor};
  }

  .sectionTitle3 {
    fill: ${e.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${e.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${e.fontFamily};
    fill: ${e.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${e.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideRight {
    fill: ${e.taskTextDarkColor};
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideLeft {
    fill: ${e.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${e.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${e.taskBkgColor};
    stroke: ${e.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${e.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${e.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${e.activeTaskBkgColor};
    stroke: ${e.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${e.doneTaskBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.titleColor||e.textColor};
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }
`,"getStyles"),Cs=Ss,Ys={parser:Wt,db:bs,renderer:Ds,styles:Cs};export{Ys as diagram};
