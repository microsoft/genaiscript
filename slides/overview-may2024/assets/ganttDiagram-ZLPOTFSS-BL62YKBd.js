import{a as c,b as de,r as ot,aw as Ke,ax as Ie,f as ce,s as ct,g as lt,t as ut,u as dt,e as ft,d as ht,y as mt,m as be,l as pe,ay as kt,az as yt,aA as gt,n as pt,aB as vt,aC as Tt,aD as bt,aE as Be,aF as je,aG as qe,aH as Ge,aI as He,aJ as Xe,aK as Ue,aL as xt,h as wt,x as _t,aM as Dt,aN as St,aO as Ct,aP as Et,aQ as Mt,aR as It,aS as At}from"./Mermaid.vue_vue_type_script_setup_true_lang-CR-Hl8SJ.js";import"./modules/vue-TuCpE50H.js";import"./index-D-CkApLV.js";import"./modules/shiki-Bx8F58s8.js";import"./modules/file-saver-LUhfcczZ.js";var Lt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/isoWeek.js"(e,a){(function(s,r){typeof e=="object"&&typeof a<"u"?a.exports=r():typeof define=="function"&&define.amd?define(r):(s=typeof globalThis<"u"?globalThis:s||self).dayjs_plugin_isoWeek=r()})(e,function(){var s="day";return function(r,n,m){var f=c(function(E){return E.add(4-E.isoWeekday(),s)},"a"),_=n.prototype;_.isoWeekYear=function(){return f(this).year()},_.isoWeek=function(E){if(!this.$utils().u(E))return this.add(7*(E-this.isoWeek()),s);var g,M,V,P,B=f(this),C=(g=this.isoWeekYear(),M=this.$u,V=(M?m.utc:m)().year(g).startOf("year"),P=4-V.isoWeekday(),V.isoWeekday()>4&&(P+=7),V.add(P,s));return B.diff(C,"week")+1},_.isoWeekday=function(E){return this.$utils().u(E)?this.day()||7:this.day(this.day()%7?E:E-7)};var F=_.startOf;_.startOf=function(E,g){var M=this.$utils(),V=!!M.u(g)||g;return M.p(E)==="isoweek"?V?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):F.bind(this)(E,g)}}})}}),Yt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/customParseFormat.js"(e,a){(function(s,r){typeof e=="object"&&typeof a<"u"?a.exports=r():typeof define=="function"&&define.amd?define(r):(s=typeof globalThis<"u"?globalThis:s||self).dayjs_plugin_customParseFormat=r()})(e,function(){var s={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},r=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d/,m=/\d\d/,f=/\d\d?/,_=/\d*[^-_:/,()\s\d]+/,F={},E=c(function(p){return(p=+p)+(p>68?1900:2e3)},"a"),g=c(function(p){return function(S){this[p]=+S}},"f"),M=[/[+-]\d\d:?(\d\d)?|Z/,function(p){(this.zone||(this.zone={})).offset=function(S){if(!S||S==="Z")return 0;var L=S.match(/([+-]|\d\d)/g),Y=60*L[1]+(+L[2]||0);return Y===0?0:L[0]==="+"?-Y:Y}(p)}],V=c(function(p){var S=F[p];return S&&(S.indexOf?S:S.s.concat(S.f))},"u"),P=c(function(p,S){var L,Y=F.meridiem;if(Y){for(var q=1;q<=24;q+=1)if(p.indexOf(Y(q,0,S))>-1){L=q>12;break}}else L=p===(S?"pm":"PM");return L},"d"),B={A:[_,function(p){this.afternoon=P(p,!1)}],a:[_,function(p){this.afternoon=P(p,!0)}],Q:[n,function(p){this.month=3*(p-1)+1}],S:[n,function(p){this.milliseconds=100*+p}],SS:[m,function(p){this.milliseconds=10*+p}],SSS:[/\d{3}/,function(p){this.milliseconds=+p}],s:[f,g("seconds")],ss:[f,g("seconds")],m:[f,g("minutes")],mm:[f,g("minutes")],H:[f,g("hours")],h:[f,g("hours")],HH:[f,g("hours")],hh:[f,g("hours")],D:[f,g("day")],DD:[m,g("day")],Do:[_,function(p){var S=F.ordinal,L=p.match(/\d+/);if(this.day=L[0],S)for(var Y=1;Y<=31;Y+=1)S(Y).replace(/\[|\]/g,"")===p&&(this.day=Y)}],w:[f,g("week")],ww:[m,g("week")],M:[f,g("month")],MM:[m,g("month")],MMM:[_,function(p){var S=V("months"),L=(V("monthsShort")||S.map(function(Y){return Y.slice(0,3)})).indexOf(p)+1;if(L<1)throw new Error;this.month=L%12||L}],MMMM:[_,function(p){var S=V("months").indexOf(p)+1;if(S<1)throw new Error;this.month=S%12||S}],Y:[/[+-]?\d+/,g("year")],YY:[m,function(p){this.year=E(p)}],YYYY:[/\d{4}/,g("year")],Z:M,ZZ:M};function C(p){var S,L;S=p,L=F&&F.formats;for(var Y=(p=S.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(b,x,k){var w=k&&k.toUpperCase();return x||L[k]||s[k]||L[w].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(o,l,h){return l||h.slice(1)})})).match(r),q=Y.length,G=0;G<q;G+=1){var Q=Y[G],H=B[Q],y=H&&H[0],T=H&&H[1];Y[G]=T?{regex:y,parser:T}:Q.replace(/^\[|\]$/g,"")}return function(b){for(var x={},k=0,w=0;k<q;k+=1){var o=Y[k];if(typeof o=="string")w+=o.length;else{var l=o.regex,h=o.parser,d=b.slice(w),v=l.exec(d)[0];h.call(x,v),b=b.replace(v,"")}}return function(i){var u=i.afternoon;if(u!==void 0){var t=i.hours;u?t<12&&(i.hours+=12):t===12&&(i.hours=0),delete i.afternoon}}(x),x}}return c(C,"l"),function(p,S,L){L.p.customParseFormat=!0,p&&p.parseTwoDigitYear&&(E=p.parseTwoDigitYear);var Y=S.prototype,q=Y.parse;Y.parse=function(G){var Q=G.date,H=G.utc,y=G.args;this.$u=H;var T=y[1];if(typeof T=="string"){var b=y[2]===!0,x=y[3]===!0,k=b||x,w=y[2];x&&(w=y[2]),F=this.$locale(),!b&&w&&(F=L.Ls[w]),this.$d=function(d,v,i,u){try{if(["x","X"].indexOf(v)>-1)return new Date((v==="X"?1e3:1)*d);var t=C(v)(d),I=t.year,D=t.month,A=t.day,N=t.hours,W=t.minutes,O=t.seconds,J=t.milliseconds,ie=t.zone,ne=t.week,fe=new Date,he=A||(I||D?1:fe.getDate()),oe=I||fe.getFullYear(),z=0;I&&!D||(z=D>0?D-1:fe.getMonth());var U,j=N||0,se=W||0,K=O||0,ae=J||0;return ie?new Date(Date.UTC(oe,z,he,j,se,K,ae+60*ie.offset*1e3)):i?new Date(Date.UTC(oe,z,he,j,se,K,ae)):(U=new Date(oe,z,he,j,se,K,ae),ne&&(U=u(U).week(ne).toDate()),U)}catch{return new Date("")}}(Q,T,H,L),this.init(),w&&w!==!0&&(this.$L=this.locale(w).$L),k&&Q!=this.format(T)&&(this.$d=new Date("")),F={}}else if(T instanceof Array)for(var o=T.length,l=1;l<=o;l+=1){y[1]=T[l-1];var h=L.apply(this,y);if(h.isValid()){this.$d=h.$d,this.$L=h.$L,this.init();break}l===o&&(this.$d=new Date(""))}else q.call(this,G)}}})}}),Ft=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/advancedFormat.js"(e,a){(function(s,r){typeof e=="object"&&typeof a<"u"?a.exports=r():typeof define=="function"&&define.amd?define(r):(s=typeof globalThis<"u"?globalThis:s||self).dayjs_plugin_advancedFormat=r()})(e,function(){return function(s,r){var n=r.prototype,m=n.format;n.format=function(f){var _=this,F=this.$locale();if(!this.isValid())return m.bind(this)(f);var E=this.$utils(),g=(f||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(M){switch(M){case"Q":return Math.ceil((_.$M+1)/3);case"Do":return F.ordinal(_.$D);case"gggg":return _.weekYear();case"GGGG":return _.isoWeekYear();case"wo":return F.ordinal(_.week(),"W");case"w":case"ww":return E.s(_.week(),M==="w"?1:2,"0");case"W":case"WW":return E.s(_.isoWeek(),M==="W"?1:2,"0");case"k":case"kk":return E.s(String(_.$H===0?24:_.$H),M==="k"?1:2,"0");case"X":return Math.floor(_.$d.getTime()/1e3);case"x":return _.$d.getTime();case"z":return"["+_.offsetName()+"]";case"zzz":return"["+_.offsetName("long")+"]";default:return M}});return m.bind(this)(g)}}})}}),Se=function(){var e=c(function(w,o,l,h){for(l=l||{},h=w.length;h--;l[w[h]]=o);return l},"o"),a=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],s=[1,26],r=[1,27],n=[1,28],m=[1,29],f=[1,30],_=[1,31],F=[1,32],E=[1,33],g=[1,34],M=[1,9],V=[1,10],P=[1,11],B=[1,12],C=[1,13],p=[1,14],S=[1,15],L=[1,16],Y=[1,19],q=[1,20],G=[1,21],Q=[1,22],H=[1,23],y=[1,25],T=[1,35],b={trace:c(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:c(function(o,l,h,d,v,i,u){var t=i.length-1;switch(v){case 1:return i[t-1];case 2:this.$=[];break;case 3:i[t-1].push(i[t]),this.$=i[t-1];break;case 4:case 5:this.$=i[t];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(i[t].substr(11)),this.$=i[t].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=i[t].substr(18);break;case 19:d.TopAxis(),this.$=i[t].substr(8);break;case 20:d.setAxisFormat(i[t].substr(11)),this.$=i[t].substr(11);break;case 21:d.setTickInterval(i[t].substr(13)),this.$=i[t].substr(13);break;case 22:d.setExcludes(i[t].substr(9)),this.$=i[t].substr(9);break;case 23:d.setIncludes(i[t].substr(9)),this.$=i[t].substr(9);break;case 24:d.setTodayMarker(i[t].substr(12)),this.$=i[t].substr(12);break;case 27:d.setDiagramTitle(i[t].substr(6)),this.$=i[t].substr(6);break;case 28:this.$=i[t].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=i[t].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(i[t].substr(8)),this.$=i[t].substr(8);break;case 33:d.addTask(i[t-1],i[t]),this.$="task";break;case 34:this.$=i[t-1],d.setClickEvent(i[t-1],i[t],null);break;case 35:this.$=i[t-2],d.setClickEvent(i[t-2],i[t-1],i[t]);break;case 36:this.$=i[t-2],d.setClickEvent(i[t-2],i[t-1],null),d.setLink(i[t-2],i[t]);break;case 37:this.$=i[t-3],d.setClickEvent(i[t-3],i[t-2],i[t-1]),d.setLink(i[t-3],i[t]);break;case 38:this.$=i[t-2],d.setClickEvent(i[t-2],i[t],null),d.setLink(i[t-2],i[t-1]);break;case 39:this.$=i[t-3],d.setClickEvent(i[t-3],i[t-1],i[t]),d.setLink(i[t-3],i[t-2]);break;case 40:this.$=i[t-1],d.setLink(i[t-1],i[t]);break;case 41:case 47:this.$=i[t-1]+" "+i[t];break;case 42:case 43:case 45:this.$=i[t-2]+" "+i[t-1]+" "+i[t];break;case 44:case 46:this.$=i[t-3]+" "+i[t-2]+" "+i[t-1]+" "+i[t];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(a,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:s,13:r,14:n,15:m,16:f,17:_,18:F,19:18,20:E,21:g,22:M,23:V,24:P,25:B,26:C,27:p,28:S,29:L,30:Y,31:q,33:G,35:Q,36:H,37:24,38:y,40:T},e(a,[2,7],{1:[2,1]}),e(a,[2,3]),{9:36,11:17,12:s,13:r,14:n,15:m,16:f,17:_,18:F,19:18,20:E,21:g,22:M,23:V,24:P,25:B,26:C,27:p,28:S,29:L,30:Y,31:q,33:G,35:Q,36:H,37:24,38:y,40:T},e(a,[2,5]),e(a,[2,6]),e(a,[2,17]),e(a,[2,18]),e(a,[2,19]),e(a,[2,20]),e(a,[2,21]),e(a,[2,22]),e(a,[2,23]),e(a,[2,24]),e(a,[2,25]),e(a,[2,26]),e(a,[2,27]),{32:[1,37]},{34:[1,38]},e(a,[2,30]),e(a,[2,31]),e(a,[2,32]),{39:[1,39]},e(a,[2,8]),e(a,[2,9]),e(a,[2,10]),e(a,[2,11]),e(a,[2,12]),e(a,[2,13]),e(a,[2,14]),e(a,[2,15]),e(a,[2,16]),{41:[1,40],43:[1,41]},e(a,[2,4]),e(a,[2,28]),e(a,[2,29]),e(a,[2,33]),e(a,[2,34],{42:[1,42],43:[1,43]}),e(a,[2,40],{41:[1,44]}),e(a,[2,35],{43:[1,45]}),e(a,[2,36]),e(a,[2,38],{42:[1,46]}),e(a,[2,37]),e(a,[2,39])],defaultActions:{},parseError:c(function(o,l){if(l.recoverable)this.trace(o);else{var h=new Error(o);throw h.hash=l,h}},"parseError"),parse:c(function(o){var l=this,h=[0],d=[],v=[null],i=[],u=this.table,t="",I=0,D=0,A=2,N=1,W=i.slice.call(arguments,1),O=Object.create(this.lexer),J={yy:{}};for(var ie in this.yy)Object.prototype.hasOwnProperty.call(this.yy,ie)&&(J.yy[ie]=this.yy[ie]);O.setInput(o,J.yy),J.yy.lexer=O,J.yy.parser=this,typeof O.yylloc>"u"&&(O.yylloc={});var ne=O.yylloc;i.push(ne);var fe=O.options&&O.options.ranges;typeof J.yy.parseError=="function"?this.parseError=J.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function he(X){h.length=h.length-2*X,v.length=v.length-X,i.length=i.length-X}c(he,"popStack");function oe(){var X;return X=d.pop()||O.lex()||N,typeof X!="number"&&(X instanceof Array&&(d=X,X=d.pop()),X=l.symbols_[X]||X),X}c(oe,"lex");for(var z,U,j,se,K={},ae,$,Ne,ge;;){if(U=h[h.length-1],this.defaultActions[U]?j=this.defaultActions[U]:((z===null||typeof z>"u")&&(z=oe()),j=u[U]&&u[U][z]),typeof j>"u"||!j.length||!j[0]){var _e="";ge=[];for(ae in u[U])this.terminals_[ae]&&ae>A&&ge.push("'"+this.terminals_[ae]+"'");O.showPosition?_e="Parse error on line "+(I+1)+`:
`+O.showPosition()+`
Expecting `+ge.join(", ")+", got '"+(this.terminals_[z]||z)+"'":_e="Parse error on line "+(I+1)+": Unexpected "+(z==N?"end of input":"'"+(this.terminals_[z]||z)+"'"),this.parseError(_e,{text:O.match,token:this.terminals_[z]||z,line:O.yylineno,loc:ne,expected:ge})}if(j[0]instanceof Array&&j.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+z);switch(j[0]){case 1:h.push(z),v.push(O.yytext),i.push(O.yylloc),h.push(j[1]),z=null,D=O.yyleng,t=O.yytext,I=O.yylineno,ne=O.yylloc;break;case 2:if($=this.productions_[j[1]][1],K.$=v[v.length-$],K._$={first_line:i[i.length-($||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-($||1)].first_column,last_column:i[i.length-1].last_column},fe&&(K._$.range=[i[i.length-($||1)].range[0],i[i.length-1].range[1]]),se=this.performAction.apply(K,[t,D,I,J.yy,j[1],v,i].concat(W)),typeof se<"u")return se;$&&(h=h.slice(0,-1*$*2),v=v.slice(0,-1*$),i=i.slice(0,-1*$)),h.push(this.productions_[j[1]][0]),v.push(K.$),i.push(K._$),Ne=u[h[h.length-2]][h[h.length-1]],h.push(Ne);break;case 3:return!0}}return!0},"parse")},x=function(){var w={EOF:1,parseError:c(function(l,h){if(this.yy.parser)this.yy.parser.parseError(l,h);else throw new Error(l)},"parseError"),setInput:c(function(o,l){return this.yy=l||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:c(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var l=o.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:c(function(o){var l=o.length,h=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var v=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===d.length?this.yylloc.first_column:0)+d[d.length-h.length].length-h[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[v[0],v[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:c(function(){return this._more=!0,this},"more"),reject:c(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:c(function(o){this.unput(this.match.slice(o))},"less"),pastInput:c(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:c(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:c(function(){var o=this.pastInput(),l=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:c(function(o,l){var h,d,v;if(this.options.backtrack_lexer&&(v={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(v.yylloc.range=this.yylloc.range.slice(0))),d=o[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],h=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var i in v)this[i]=v[i];return!1}return!1},"test_match"),next:c(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,l,h,d;this._more||(this.yytext="",this.match="");for(var v=this._currentRules(),i=0;i<v.length;i++)if(h=this._input.match(this.rules[v[i]]),h&&(!l||h[0].length>l[0].length)){if(l=h,d=i,this.options.backtrack_lexer){if(o=this.test_match(h,v[i]),o!==!1)return o;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(o=this.test_match(l,v[d]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:c(function(){var l=this.next();return l||this.lex()},"lex"),begin:c(function(l){this.conditionStack.push(l)},"begin"),popState:c(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:c(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:c(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:c(function(l){this.begin(l)},"pushState"),stateStackSize:c(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:c(function(l,h,d,v){switch(d){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return w}();b.lexer=x;function k(){this.yy={}}return c(k,"Parser"),k.prototype=b,b.Parser=k,new k}();Se.parser=Se;var Wt=Se,Ot=de(ot()),Z=de(Ke()),Vt=de(Lt()),Pt=de(Yt()),zt=de(Ft());Z.default.extend(Vt.default);Z.default.extend(Pt.default);Z.default.extend(zt.default);var Ze={friday:5,saturday:6},ee="",Ae="",Le=void 0,Ye="",me=[],ke=[],Fe=new Map,We=[],xe=[],ue="",Oe="",$e=["active","done","crit","milestone"],Ve=[],ye=!1,Pe=!1,ze="sunday",we="saturday",Ce=0,Rt=c(function(){We=[],xe=[],ue="",Ve=[],ve=0,Me=void 0,Te=void 0,R=[],ee="",Ae="",Oe="",Le=void 0,Ye="",me=[],ke=[],ye=!1,Pe=!1,Ce=0,Fe=new Map,mt(),ze="sunday",we="saturday"},"clear"),Nt=c(function(e){Ae=e},"setAxisFormat"),Bt=c(function(){return Ae},"getAxisFormat"),jt=c(function(e){Le=e},"setTickInterval"),qt=c(function(){return Le},"getTickInterval"),Gt=c(function(e){Ye=e},"setTodayMarker"),Ht=c(function(){return Ye},"getTodayMarker"),Xt=c(function(e){ee=e},"setDateFormat"),Ut=c(function(){ye=!0},"enableInclusiveEndDates"),Zt=c(function(){return ye},"endDatesAreInclusive"),Qt=c(function(){Pe=!0},"enableTopAxis"),Jt=c(function(){return Pe},"topAxisEnabled"),Kt=c(function(e){Oe=e},"setDisplayMode"),$t=c(function(){return Oe},"getDisplayMode"),ea=c(function(){return ee},"getDateFormat"),ta=c(function(e){me=e.toLowerCase().split(/[\s,]+/)},"setIncludes"),aa=c(function(){return me},"getIncludes"),sa=c(function(e){ke=e.toLowerCase().split(/[\s,]+/)},"setExcludes"),ra=c(function(){return ke},"getExcludes"),ia=c(function(){return Fe},"getLinks"),na=c(function(e){ue=e,We.push(e)},"addSection"),oa=c(function(){return We},"getSections"),ca=c(function(){let e=Qe();const a=10;let s=0;for(;!e&&s<a;)e=Qe(),s++;return xe=R,xe},"getTasks"),et=c(function(e,a,s,r){return r.includes(e.format(a.trim()))?!1:s.includes("weekends")&&(e.isoWeekday()===Ze[we]||e.isoWeekday()===Ze[we]+1)||s.includes(e.format("dddd").toLowerCase())?!0:s.includes(e.format(a.trim()))},"isInvalidDate"),la=c(function(e){ze=e},"setWeekday"),ua=c(function(){return ze},"getWeekday"),da=c(function(e){we=e},"setWeekend"),tt=c(function(e,a,s,r){if(!s.length||e.manualEndTime)return;let n;e.startTime instanceof Date?n=(0,Z.default)(e.startTime):n=(0,Z.default)(e.startTime,a,!0),n=n.add(1,"d");let m;e.endTime instanceof Date?m=(0,Z.default)(e.endTime):m=(0,Z.default)(e.endTime,a,!0);const[f,_]=fa(n,m,a,s,r);e.endTime=f.toDate(),e.renderEndTime=_},"checkTaskDates"),fa=c(function(e,a,s,r,n){let m=!1,f=null;for(;e<=a;)m||(f=a.toDate()),m=et(e,s,r,n),m&&(a=a.add(1,"d")),e=e.add(1,"d");return[a,f]},"fixTaskDates"),Ee=c(function(e,a,s){s=s.trim();const n=/^after\s+(?<ids>[\d\w- ]+)/.exec(s);if(n!==null){let f=null;for(const F of n.groups.ids.split(" ")){let E=re(F);E!==void 0&&(!f||E.endTime>f.endTime)&&(f=E)}if(f)return f.endTime;const _=new Date;return _.setHours(0,0,0,0),_}let m=(0,Z.default)(s,a.trim(),!0);if(m.isValid())return m.toDate();{be.debug("Invalid date:"+s),be.debug("With date format:"+a.trim());const f=new Date(s);if(f===void 0||isNaN(f.getTime())||f.getFullYear()<-1e4||f.getFullYear()>1e4)throw new Error("Invalid date:"+s);return f}},"getStartDate"),at=c(function(e){const a=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(e.trim());return a!==null?[Number.parseFloat(a[1]),a[2]]:[NaN,"ms"]},"parseDuration"),st=c(function(e,a,s,r=!1){s=s.trim();const m=/^until\s+(?<ids>[\d\w- ]+)/.exec(s);if(m!==null){let g=null;for(const V of m.groups.ids.split(" ")){let P=re(V);P!==void 0&&(!g||P.startTime<g.startTime)&&(g=P)}if(g)return g.startTime;const M=new Date;return M.setHours(0,0,0,0),M}let f=(0,Z.default)(s,a.trim(),!0);if(f.isValid())return r&&(f=f.add(1,"d")),f.toDate();let _=(0,Z.default)(e);const[F,E]=at(s);if(!Number.isNaN(F)){const g=_.add(F,E);g.isValid()&&(_=g)}return _.toDate()},"getEndDate"),ve=0,le=c(function(e){return e===void 0?(ve=ve+1,"task"+ve):e},"parseId"),ha=c(function(e,a){let s;a.substr(0,1)===":"?s=a.substr(1,a.length):s=a;const r=s.split(","),n={};Re(r,n,$e);for(let f=0;f<r.length;f++)r[f]=r[f].trim();let m="";switch(r.length){case 1:n.id=le(),n.startTime=e.endTime,m=r[0];break;case 2:n.id=le(),n.startTime=Ee(void 0,ee,r[0]),m=r[1];break;case 3:n.id=le(r[0]),n.startTime=Ee(void 0,ee,r[1]),m=r[2];break}return m&&(n.endTime=st(n.startTime,ee,m,ye),n.manualEndTime=(0,Z.default)(m,"YYYY-MM-DD",!0).isValid(),tt(n,ee,ke,me)),n},"compileData"),ma=c(function(e,a){let s;a.substr(0,1)===":"?s=a.substr(1,a.length):s=a;const r=s.split(","),n={};Re(r,n,$e);for(let m=0;m<r.length;m++)r[m]=r[m].trim();switch(r.length){case 1:n.id=le(),n.startTime={type:"prevTaskEnd",id:e},n.endTime={data:r[0]};break;case 2:n.id=le(),n.startTime={type:"getStartDate",startData:r[0]},n.endTime={data:r[1]};break;case 3:n.id=le(r[0]),n.startTime={type:"getStartDate",startData:r[1]},n.endTime={data:r[2]};break}return n},"parseData"),Me,Te,R=[],rt={},ka=c(function(e,a){const s={section:ue,type:ue,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:a},task:e,classes:[]},r=ma(Te,a);s.raw.startTime=r.startTime,s.raw.endTime=r.endTime,s.id=r.id,s.prevTaskId=Te,s.active=r.active,s.done=r.done,s.crit=r.crit,s.milestone=r.milestone,s.order=Ce,Ce++;const n=R.push(s);Te=s.id,rt[s.id]=n-1},"addTask"),re=c(function(e){const a=rt[e];return R[a]},"findTaskById"),ya=c(function(e,a){const s={section:ue,type:ue,description:e,task:e,classes:[]},r=ha(Me,a);s.startTime=r.startTime,s.endTime=r.endTime,s.id=r.id,s.active=r.active,s.done=r.done,s.crit=r.crit,s.milestone=r.milestone,Me=s,xe.push(s)},"addTaskOrg"),Qe=c(function(){const e=c(function(s){const r=R[s];let n="";switch(R[s].raw.startTime.type){case"prevTaskEnd":{const m=re(r.prevTaskId);r.startTime=m.endTime;break}case"getStartDate":n=Ee(void 0,ee,R[s].raw.startTime.startData),n&&(R[s].startTime=n);break}return R[s].startTime&&(R[s].endTime=st(R[s].startTime,ee,R[s].raw.endTime.data,ye),R[s].endTime&&(R[s].processed=!0,R[s].manualEndTime=(0,Z.default)(R[s].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),tt(R[s],ee,ke,me))),R[s].processed},"compileTask");let a=!0;for(const[s,r]of R.entries())e(s),a=a&&r.processed;return a},"compileTasks"),ga=c(function(e,a){let s=a;ce().securityLevel!=="loose"&&(s=(0,Ot.sanitizeUrl)(a)),e.split(",").forEach(function(r){re(r)!==void 0&&(nt(r,()=>{window.open(s,"_self")}),Fe.set(r,s))}),it(e,"clickable")},"setLink"),it=c(function(e,a){e.split(",").forEach(function(s){let r=re(s);r!==void 0&&r.classes.push(a)})},"setClass"),pa=c(function(e,a,s){if(ce().securityLevel!=="loose"||a===void 0)return;let r=[];if(typeof s=="string"){r=s.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let m=0;m<r.length;m++){let f=r[m].trim();f.startsWith('"')&&f.endsWith('"')&&(f=f.substr(1,f.length-2)),r[m]=f}}r.length===0&&r.push(e),re(e)!==void 0&&nt(e,()=>{_t.runFunc(a,...r)})},"setClickFun"),nt=c(function(e,a){Ve.push(function(){const s=document.querySelector(`[id="${e}"]`);s!==null&&s.addEventListener("click",function(){a()})},function(){const s=document.querySelector(`[id="${e}-text"]`);s!==null&&s.addEventListener("click",function(){a()})})},"pushFun"),va=c(function(e,a,s){e.split(",").forEach(function(r){pa(r,a,s)}),it(e,"clickable")},"setClickEvent"),Ta=c(function(e){Ve.forEach(function(a){a(e)})},"bindFunctions"),ba={getConfig:c(()=>ce().gantt,"getConfig"),clear:Rt,setDateFormat:Xt,getDateFormat:ea,enableInclusiveEndDates:Ut,endDatesAreInclusive:Zt,enableTopAxis:Qt,topAxisEnabled:Jt,setAxisFormat:Nt,getAxisFormat:Bt,setTickInterval:jt,getTickInterval:qt,setTodayMarker:Gt,getTodayMarker:Ht,setAccTitle:ct,getAccTitle:lt,setDiagramTitle:ut,getDiagramTitle:dt,setDisplayMode:Kt,getDisplayMode:$t,setAccDescription:ft,getAccDescription:ht,addSection:na,getSections:oa,getTasks:ca,addTask:ka,findTaskById:re,addTaskOrg:ya,setIncludes:ta,getIncludes:aa,setExcludes:sa,getExcludes:ra,setClickEvent:va,setLink:ga,getLinks:ia,bindFunctions:Ta,parseDuration:at,isInvalidDate:et,setWeekday:la,getWeekday:ua,setWeekend:da};function Re(e,a,s){let r=!0;for(;r;)r=!1,s.forEach(function(n){const m="^\\s*"+n+"\\s*$",f=new RegExp(m);e[0].match(f)&&(a[n]=!0,e.shift(1),r=!0)})}c(Re,"getTaskTags");var De=de(Ke()),xa=c(function(){be.debug("Something is calling, setConf, remove the call")},"setConf"),Je={monday:Dt,tuesday:St,wednesday:Ct,thursday:Et,friday:Mt,saturday:It,sunday:At},wa=c((e,a)=>{let s=[...e].map(()=>-1/0),r=[...e].sort((m,f)=>m.startTime-f.startTime||m.order-f.order),n=0;for(const m of r)for(let f=0;f<s.length;f++)if(m.startTime>=s[f]){s[f]=m.endTime,m.order=f+a,f>n&&(n=f);break}return n},"getMaxIntersections"),te,_a=c(function(e,a,s,r){const n=ce().gantt,m=ce().securityLevel;let f;m==="sandbox"&&(f=pe("#i"+a));const _=m==="sandbox"?pe(f.nodes()[0].contentDocument.body):pe("body"),F=m==="sandbox"?f.nodes()[0].contentDocument:document,E=F.getElementById(a);te=E.parentElement.offsetWidth,te===void 0&&(te=1200),n.useWidth!==void 0&&(te=n.useWidth);const g=r.db.getTasks();let M=[];for(const y of g)M.push(y.type);M=H(M);const V={};let P=2*n.topPadding;if(r.db.getDisplayMode()==="compact"||n.displayMode==="compact"){const y={};for(const b of g)y[b.section]===void 0?y[b.section]=[b]:y[b.section].push(b);let T=0;for(const b of Object.keys(y)){const x=wa(y[b],T)+1;T+=x,P+=x*(n.barHeight+n.barGap),V[b]=x}}else{P+=g.length*(n.barHeight+n.barGap);for(const y of M)V[y]=g.filter(T=>T.type===y).length}E.setAttribute("viewBox","0 0 "+te+" "+P);const B=_.select(`[id="${a}"]`),C=kt().domain([yt(g,function(y){return y.startTime}),gt(g,function(y){return y.endTime})]).rangeRound([0,te-n.leftPadding-n.rightPadding]);function p(y,T){const b=y.startTime,x=T.startTime;let k=0;return b>x?k=1:b<x&&(k=-1),k}c(p,"taskCompare"),g.sort(p),S(g,te,P),pt(B,P,te,n.useMaxWidth),B.append("text").text(r.db.getDiagramTitle()).attr("x",te/2).attr("y",n.titleTopMargin).attr("class","titleText");function S(y,T,b){const x=n.barHeight,k=x+n.barGap,w=n.topPadding,o=n.leftPadding,l=vt().domain([0,M.length]).range(["#00B9FA","#F95002"]).interpolate(Tt);Y(k,w,o,T,b,y,r.db.getExcludes(),r.db.getIncludes()),q(o,w,T,b),L(y,k,w,o,x,l,T),G(k,w),Q(o,w,T,b)}c(S,"makeGantt");function L(y,T,b,x,k,w,o){const h=[...new Set(y.map(u=>u.order))].map(u=>y.find(t=>t.order===u));B.append("g").selectAll("rect").data(h).enter().append("rect").attr("x",0).attr("y",function(u,t){return t=u.order,t*T+b-2}).attr("width",function(){return o-n.rightPadding/2}).attr("height",T).attr("class",function(u){for(const[t,I]of M.entries())if(u.type===I)return"section section"+t%n.numberSectionStyles;return"section section0"});const d=B.append("g").selectAll("rect").data(y).enter(),v=r.db.getLinks();if(d.append("rect").attr("id",function(u){return u.id}).attr("rx",3).attr("ry",3).attr("x",function(u){return u.milestone?C(u.startTime)+x+.5*(C(u.endTime)-C(u.startTime))-.5*k:C(u.startTime)+x}).attr("y",function(u,t){return t=u.order,t*T+b}).attr("width",function(u){return u.milestone?k:C(u.renderEndTime||u.endTime)-C(u.startTime)}).attr("height",k).attr("transform-origin",function(u,t){return t=u.order,(C(u.startTime)+x+.5*(C(u.endTime)-C(u.startTime))).toString()+"px "+(t*T+b+.5*k).toString()+"px"}).attr("class",function(u){const t="task";let I="";u.classes.length>0&&(I=u.classes.join(" "));let D=0;for(const[N,W]of M.entries())u.type===W&&(D=N%n.numberSectionStyles);let A="";return u.active?u.crit?A+=" activeCrit":A=" active":u.done?u.crit?A=" doneCrit":A=" done":u.crit&&(A+=" crit"),A.length===0&&(A=" task"),u.milestone&&(A=" milestone "+A),A+=D,A+=" "+I,t+A}),d.append("text").attr("id",function(u){return u.id+"-text"}).text(function(u){return u.task}).attr("font-size",n.fontSize).attr("x",function(u){let t=C(u.startTime),I=C(u.renderEndTime||u.endTime);u.milestone&&(t+=.5*(C(u.endTime)-C(u.startTime))-.5*k),u.milestone&&(I=t+k);const D=this.getBBox().width;return D>I-t?I+D+1.5*n.leftPadding>o?t+x-5:I+x+5:(I-t)/2+t+x}).attr("y",function(u,t){return t=u.order,t*T+n.barHeight/2+(n.fontSize/2-2)+b}).attr("text-height",k).attr("class",function(u){const t=C(u.startTime);let I=C(u.endTime);u.milestone&&(I=t+k);const D=this.getBBox().width;let A="";u.classes.length>0&&(A=u.classes.join(" "));let N=0;for(const[O,J]of M.entries())u.type===J&&(N=O%n.numberSectionStyles);let W="";return u.active&&(u.crit?W="activeCritText"+N:W="activeText"+N),u.done?u.crit?W=W+" doneCritText"+N:W=W+" doneText"+N:u.crit&&(W=W+" critText"+N),u.milestone&&(W+=" milestoneText"),D>I-t?I+D+1.5*n.leftPadding>o?A+" taskTextOutsideLeft taskTextOutside"+N+" "+W:A+" taskTextOutsideRight taskTextOutside"+N+" "+W+" width-"+D:A+" taskText taskText"+N+" "+W+" width-"+D}),ce().securityLevel==="sandbox"){let u;u=pe("#i"+a);const t=u.nodes()[0].contentDocument;d.filter(function(I){return v.has(I.id)}).each(function(I){var D=t.querySelector("#"+I.id),A=t.querySelector("#"+I.id+"-text");const N=D.parentNode;var W=t.createElement("a");W.setAttribute("xlink:href",v.get(I.id)),W.setAttribute("target","_top"),N.appendChild(W),W.appendChild(D),W.appendChild(A)})}}c(L,"drawRects");function Y(y,T,b,x,k,w,o,l){if(o.length===0&&l.length===0)return;let h,d;for(const{startTime:D,endTime:A}of w)(h===void 0||D<h)&&(h=D),(d===void 0||A>d)&&(d=A);if(!h||!d)return;if((0,De.default)(d).diff((0,De.default)(h),"year")>5){be.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const v=r.db.getDateFormat(),i=[];let u=null,t=(0,De.default)(h);for(;t.valueOf()<=d;)r.db.isInvalidDate(t,v,o,l)?u?u.end=t:u={start:t,end:t}:u&&(i.push(u),u=null),t=t.add(1,"d");B.append("g").selectAll("rect").data(i).enter().append("rect").attr("id",function(D){return"exclude-"+D.start.format("YYYY-MM-DD")}).attr("x",function(D){return C(D.start)+b}).attr("y",n.gridLineStartPadding).attr("width",function(D){const A=D.end.add(1,"day");return C(A)-C(D.start)}).attr("height",k-T-n.gridLineStartPadding).attr("transform-origin",function(D,A){return(C(D.start)+b+.5*(C(D.end)-C(D.start))).toString()+"px "+(A*y+.5*k).toString()+"px"}).attr("class","exclude-range")}c(Y,"drawExcludeDays");function q(y,T,b,x){let k=bt(C).tickSize(-x+T+n.gridLineStartPadding).tickFormat(Be(r.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));const o=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||n.tickInterval);if(o!==null){const l=o[1],h=o[2],d=r.db.getWeekday()||n.weekday;switch(h){case"millisecond":k.ticks(Ue.every(l));break;case"second":k.ticks(Xe.every(l));break;case"minute":k.ticks(He.every(l));break;case"hour":k.ticks(Ge.every(l));break;case"day":k.ticks(qe.every(l));break;case"week":k.ticks(Je[d].every(l));break;case"month":k.ticks(je.every(l));break}}if(B.append("g").attr("class","grid").attr("transform","translate("+y+", "+(x-50)+")").call(k).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||n.topAxis){let l=xt(C).tickSize(-x+T+n.gridLineStartPadding).tickFormat(Be(r.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));if(o!==null){const h=o[1],d=o[2],v=r.db.getWeekday()||n.weekday;switch(d){case"millisecond":l.ticks(Ue.every(h));break;case"second":l.ticks(Xe.every(h));break;case"minute":l.ticks(He.every(h));break;case"hour":l.ticks(Ge.every(h));break;case"day":l.ticks(qe.every(h));break;case"week":l.ticks(Je[v].every(h));break;case"month":l.ticks(je.every(h));break}}B.append("g").attr("class","grid").attr("transform","translate("+y+", "+T+")").call(l).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}c(q,"makeGrid");function G(y,T){let b=0;const x=Object.keys(V).map(k=>[k,V[k]]);B.append("g").selectAll("text").data(x).enter().append(function(k){const w=k[0].split(wt.lineBreakRegex),o=-(w.length-1)/2,l=F.createElementNS("http://www.w3.org/2000/svg","text");l.setAttribute("dy",o+"em");for(const[h,d]of w.entries()){const v=F.createElementNS("http://www.w3.org/2000/svg","tspan");v.setAttribute("alignment-baseline","central"),v.setAttribute("x","10"),h>0&&v.setAttribute("dy","1em"),v.textContent=d,l.appendChild(v)}return l}).attr("x",10).attr("y",function(k,w){if(w>0)for(let o=0;o<w;o++)return b+=x[w-1][1],k[1]*y/2+b*y+T;else return k[1]*y/2+T}).attr("font-size",n.sectionFontSize).attr("class",function(k){for(const[w,o]of M.entries())if(k[0]===o)return"sectionTitle sectionTitle"+w%n.numberSectionStyles;return"sectionTitle"})}c(G,"vertLabels");function Q(y,T,b,x){const k=r.db.getTodayMarker();if(k==="off")return;const w=B.append("g").attr("class","today"),o=new Date,l=w.append("line");l.attr("x1",C(o)+y).attr("x2",C(o)+y).attr("y1",n.titleTopMargin).attr("y2",x-n.titleTopMargin).attr("class","today"),k!==""&&l.attr("style",k.replace(/,/g,";"))}c(Q,"drawToday");function H(y){const T={},b=[];for(let x=0,k=y.length;x<k;++x)Object.prototype.hasOwnProperty.call(T,y[x])||(T[y[x]]=!0,b.push(y[x]));return b}c(H,"checkUnique")},"draw"),Da={setConf:xa,draw:_a},Sa=c(e=>`
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
`,"getStyles"),Ca=Sa,Ya={parser:Wt,db:ba,renderer:Da,styles:Ca};export{Ya as diagram};
