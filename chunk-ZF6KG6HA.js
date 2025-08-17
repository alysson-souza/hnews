import{f as R1,j as H1}from"./chunk-MYNPI5MZ.js";import{a as _1}from"./chunk-V5SWH2BD.js";import{a as E1,b as U1,e as I1,j as O1}from"./chunk-PA3S5SKB.js";import{$b as S,Ab as x1,Bb as S1,Db as N1,Eb as b1,Fb as w1,Hb as y1,Jb as k1,Ka as L1,Kb as i2,Mb as F2,Oa as P,Ob as A1,Pb as P1,Qb as T1,Tb as F1,V as a2,W as M1,Wa as l2,Xa as v1,Xb as B2,Ya as h1,Yb as B1,_ as R,_b as u2,a as p1,b as u1,da as k,ea as A,ia as d1,ib as H,jb as e2,kb as r2,lc as D1,na as P2,ob as T2,pb as V,qb as E,rb as g1,vb as s2,wb as C1,xb as K,zb as b}from"./chunk-VQVH6RQB.js";var W1=class c{STORAGE_KEY="hn_visited_stories";MAX_VISITED=1e3;visitedMap=new Map;constructor(){this.loadVisited()}loadVisited(){try{let l=localStorage.getItem(this.STORAGE_KEY);l&&JSON.parse(l).forEach(e=>this.visitedMap.set(e.storyId,e))}catch(l){console.error("Failed to load visited stories:",l)}}saveVisited(){try{let l=Array.from(this.visitedMap.values()).sort((a,e)=>e.visitedAt-a.visitedAt).slice(0,this.MAX_VISITED);localStorage.setItem(this.STORAGE_KEY,JSON.stringify(l))}catch(l){console.error("Failed to save visited stories:",l)}}markAsVisited(l,a){let e=this.visitedMap.get(l),r={storyId:l,visitedAt:Date.now(),commentCount:a??e?.commentCount};this.visitedMap.set(l,r),this.saveVisited()}isVisited(l){return this.visitedMap.has(l)}getVisitedData(l){return this.visitedMap.get(l)}hasNewComments(l,a){let e=this.visitedMap.get(l);return!e||e.commentCount===void 0?!1:a>e.commentCount}getNewCommentCount(l,a){let e=this.visitedMap.get(l);return!e||e.commentCount===void 0?0:Math.max(0,a-e.commentCount)}clearVisited(){this.visitedMap.clear(),localStorage.removeItem(this.STORAGE_KEY)}static \u0275fac=function(a){return new(a||c)};static \u0275prov=a2({token:c,factory:c.\u0275fac,providedIn:"root"})};function _2(c,l){(l==null||l>c.length)&&(l=c.length);for(var a=0,e=Array(l);a<l;a++)e[a]=c[a];return e}function D3(c){if(Array.isArray(c))return c}function R3(c){if(Array.isArray(c))return _2(c)}function H3(c,l){if(!(c instanceof l))throw new TypeError("Cannot call a class as a function")}function G1(c,l){for(var a=0;a<l.length;a++){var e=l[a];e.enumerable=e.enumerable||!1,e.configurable=!0,"value"in e&&(e.writable=!0),Object.defineProperty(c,x4(e.key),e)}}function E3(c,l,a){return l&&G1(c.prototype,l),a&&G1(c,a),Object.defineProperty(c,"prototype",{writable:!1}),c}function L2(c,l){var a=typeof Symbol<"u"&&c[Symbol.iterator]||c["@@iterator"];if(!a){if(Array.isArray(c)||(a=a1(c))||l&&c&&typeof c.length=="number"){a&&(c=a);var e=0,r=function(){};return{s:r,n:function(){return e>=c.length?{done:!0}:{done:!1,value:c[e++]}},e:function(f){throw f},f:r}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}var s,i=!0,n=!1;return{s:function(){a=a.call(c)},n:function(){var f=a.next();return i=f.done,f},e:function(f){n=!0,s=f},f:function(){try{i||a.return==null||a.return()}finally{if(n)throw s}}}}function d(c,l,a){return(l=x4(l))in c?Object.defineProperty(c,l,{value:a,enumerable:!0,configurable:!0,writable:!0}):c[l]=a,c}function U3(c){if(typeof Symbol<"u"&&c[Symbol.iterator]!=null||c["@@iterator"]!=null)return Array.from(c)}function I3(c,l){var a=c==null?null:typeof Symbol<"u"&&c[Symbol.iterator]||c["@@iterator"];if(a!=null){var e,r,s,i,n=[],f=!0,t=!1;try{if(s=(a=a.call(c)).next,l===0){if(Object(a)!==a)return;f=!1}else for(;!(f=(e=s.call(a)).done)&&(n.push(e.value),n.length!==l);f=!0);}catch(z){t=!0,r=z}finally{try{if(!f&&a.return!=null&&(i=a.return(),Object(i)!==i))return}finally{if(t)throw r}}return n}}function O3(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function _3(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function V1(c,l){var a=Object.keys(c);if(Object.getOwnPropertySymbols){var e=Object.getOwnPropertySymbols(c);l&&(e=e.filter(function(r){return Object.getOwnPropertyDescriptor(c,r).enumerable})),a.push.apply(a,e)}return a}function o(c){for(var l=1;l<arguments.length;l++){var a=arguments[l]!=null?arguments[l]:{};l%2?V1(Object(a),!0).forEach(function(e){d(c,e,a[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(c,Object.getOwnPropertyDescriptors(a)):V1(Object(a)).forEach(function(e){Object.defineProperty(c,e,Object.getOwnPropertyDescriptor(a,e))})}return c}function S2(c,l){return D3(c)||I3(c,l)||a1(c,l)||O3()}function F(c){return R3(c)||U3(c)||a1(c)||_3()}function W3(c,l){if(typeof c!="object"||!c)return c;var a=c[Symbol.toPrimitive];if(a!==void 0){var e=a.call(c,l||"default");if(typeof e!="object")return e;throw new TypeError("@@toPrimitive must return a primitive value.")}return(l==="string"?String:Number)(c)}function x4(c){var l=W3(c,"string");return typeof l=="symbol"?l:l+""}function g2(c){"@babel/helpers - typeof";return g2=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(l){return typeof l}:function(l){return l&&typeof Symbol=="function"&&l.constructor===Symbol&&l!==Symbol.prototype?"symbol":typeof l},g2(c)}function a1(c,l){if(c){if(typeof c=="string")return _2(c,l);var a={}.toString.call(c).slice(8,-1);return a==="Object"&&c.constructor&&(a=c.constructor.name),a==="Map"||a==="Set"?Array.from(c):a==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a)?_2(c,l):void 0}}var j1=function(){},l1={},S4={},N4=null,b4={mark:j1,measure:j1};try{typeof window<"u"&&(l1=window),typeof document<"u"&&(S4=document),typeof MutationObserver<"u"&&(N4=MutationObserver),typeof performance<"u"&&(b4=performance)}catch{}var q3=l1.navigator||{},$1=q3.userAgent,X1=$1===void 0?"":$1,W=l1,v=S4,Y1=N4,M2=b4,s5=!!W.document,O=!!v.documentElement&&!!v.head&&typeof v.addEventListener=="function"&&typeof v.createElement=="function",w4=~X1.indexOf("MSIE")||~X1.indexOf("Trident/"),D2,G3=/fa(k|kd|s|r|l|t|d|dr|dl|dt|b|slr|slpr|wsb|tl|ns|nds|es|jr|jfr|jdr|cr|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/,V3=/Font ?Awesome ?([567 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit|Notdog Duo|Notdog|Chisel|Etch|Thumbprint|Jelly Fill|Jelly Duo|Jelly|Slab Press|Slab|Whiteboard)?.*/i,y4={classic:{fa:"solid",fas:"solid","fa-solid":"solid",far:"regular","fa-regular":"regular",fal:"light","fa-light":"light",fat:"thin","fa-thin":"thin",fab:"brands","fa-brands":"brands"},duotone:{fa:"solid",fad:"solid","fa-solid":"solid","fa-duotone":"solid",fadr:"regular","fa-regular":"regular",fadl:"light","fa-light":"light",fadt:"thin","fa-thin":"thin"},sharp:{fa:"solid",fass:"solid","fa-solid":"solid",fasr:"regular","fa-regular":"regular",fasl:"light","fa-light":"light",fast:"thin","fa-thin":"thin"},"sharp-duotone":{fa:"solid",fasds:"solid","fa-solid":"solid",fasdr:"regular","fa-regular":"regular",fasdl:"light","fa-light":"light",fasdt:"thin","fa-thin":"thin"},slab:{"fa-regular":"regular",faslr:"regular"},"slab-press":{"fa-regular":"regular",faslpr:"regular"},thumbprint:{"fa-light":"light",fatl:"light"},whiteboard:{"fa-semibold":"semibold",fawsb:"semibold"},notdog:{"fa-solid":"solid",fans:"solid"},"notdog-duo":{"fa-solid":"solid",fands:"solid"},etch:{"fa-solid":"solid",faes:"solid"},jelly:{"fa-regular":"regular",fajr:"regular"},"jelly-fill":{"fa-regular":"regular",fajfr:"regular"},"jelly-duo":{"fa-regular":"regular",fajdr:"regular"},chisel:{"fa-regular":"regular",facr:"regular"}},j3={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},k4=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press"],C="classic",m2="duotone",A4="sharp",P4="sharp-duotone",T4="chisel",F4="etch",B4="jelly",D4="jelly-duo",R4="jelly-fill",H4="notdog",E4="notdog-duo",U4="slab",I4="slab-press",O4="thumbprint",_4="whiteboard",$3="Classic",X3="Duotone",Y3="Sharp",K3="Sharp Duotone",Q3="Chisel",J3="Etch",Z3="Jelly",c0="Jelly Duo",a0="Jelly Fill",l0="Notdog",e0="Notdog Duo",r0="Slab",s0="Slab Press",i0="Thumbprint",n0="Whiteboard",W4=[C,m2,A4,P4,T4,F4,B4,D4,R4,H4,E4,U4,I4,O4,_4],i5=(D2={},d(d(d(d(d(d(d(d(d(d(D2,C,$3),m2,X3),A4,Y3),P4,K3),T4,Q3),F4,J3),B4,Z3),D4,c0),R4,a0),H4,l0),d(d(d(d(d(D2,E4,e0),U4,r0),I4,s0),O4,i0),_4,n0)),f0={classic:{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},duotone:{900:"fad",400:"fadr",300:"fadl",100:"fadt"},sharp:{900:"fass",400:"fasr",300:"fasl",100:"fast"},"sharp-duotone":{900:"fasds",400:"fasdr",300:"fasdl",100:"fasdt"},slab:{400:"faslr"},"slab-press":{400:"faslpr"},whiteboard:{600:"fawsb"},thumbprint:{300:"fatl"},notdog:{900:"fans"},"notdog-duo":{900:"fands"},etch:{900:"faes"},chisel:{400:"facr"},jelly:{400:"fajr"},"jelly-fill":{400:"fajfr"},"jelly-duo":{400:"fajdr"}},o0={"Font Awesome 7 Free":{900:"fas",400:"far"},"Font Awesome 7 Pro":{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},"Font Awesome 7 Brands":{400:"fab",normal:"fab"},"Font Awesome 7 Duotone":{900:"fad",400:"fadr",normal:"fadr",300:"fadl",100:"fadt"},"Font Awesome 7 Sharp":{900:"fass",400:"fasr",normal:"fasr",300:"fasl",100:"fast"},"Font Awesome 7 Sharp Duotone":{900:"fasds",400:"fasdr",normal:"fasdr",300:"fasdl",100:"fasdt"},"Font Awesome 7 Jelly":{400:"fajr",normal:"fajr"},"Font Awesome 7 Jelly Fill":{400:"fajfr",normal:"fajfr"},"Font Awesome 7 Jelly Duo":{400:"fajdr",normal:"fajdr"},"Font Awesome 7 Slab":{400:"faslr",normal:"faslr"},"Font Awesome 7 Slab Press":{400:"faslpr",normal:"faslpr"},"Font Awesome 7 Thumbprint":{300:"fatl",normal:"fatl"},"Font Awesome 7 Notdog":{900:"fans",normal:"fans"},"Font Awesome 7 Notdog Duo":{900:"fands",normal:"fands"},"Font Awesome 7 Etch":{900:"faes",normal:"faes"},"Font Awesome 7 Chisel":{400:"facr",normal:"facr"},"Font Awesome 7 Whiteboard":{600:"fawsb",normal:"fawsb"}},t0=new Map([["classic",{defaultShortPrefixId:"fas",defaultStyleId:"solid",styleIds:["solid","regular","light","thin","brands"],futureStyleIds:[],defaultFontWeight:900}],["duotone",{defaultShortPrefixId:"fad",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp",{defaultShortPrefixId:"fass",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp-duotone",{defaultShortPrefixId:"fasds",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["chisel",{defaultShortPrefixId:"facr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["etch",{defaultShortPrefixId:"faes",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["jelly",{defaultShortPrefixId:"fajr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-duo",{defaultShortPrefixId:"fajdr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-fill",{defaultShortPrefixId:"fajfr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["notdog",{defaultShortPrefixId:"fans",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["notdog-duo",{defaultShortPrefixId:"fands",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["slab",{defaultShortPrefixId:"faslr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab-press",{defaultShortPrefixId:"faslpr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["thumbprint",{defaultShortPrefixId:"fatl",defaultStyleId:"light",styleIds:["light"],futureStyleIds:[],defaultFontWeight:300}],["whiteboard",{defaultShortPrefixId:"fawsb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}]]),m0={chisel:{regular:"facr"},classic:{brands:"fab",light:"fal",regular:"far",solid:"fas",thin:"fat"},duotone:{light:"fadl",regular:"fadr",solid:"fad",thin:"fadt"},etch:{solid:"faes"},jelly:{regular:"fajr"},"jelly-duo":{regular:"fajdr"},"jelly-fill":{regular:"fajfr"},notdog:{solid:"fans"},"notdog-duo":{solid:"fands"},sharp:{light:"fasl",regular:"fasr",solid:"fass",thin:"fast"},"sharp-duotone":{light:"fasdl",regular:"fasdr",solid:"fasds",thin:"fasdt"},slab:{regular:"faslr"},"slab-press":{regular:"faslpr"},thumbprint:{light:"fatl"},whiteboard:{semibold:"fawsb"}},q4=["fak","fa-kit","fakd","fa-kit-duotone"],K1={kit:{fak:"kit","fa-kit":"kit"},"kit-duotone":{fakd:"kit-duotone","fa-kit-duotone":"kit-duotone"}},z0=["kit"],p0="kit",u0="kit-duotone",M0="Kit",d0="Kit Duotone",n5=d(d({},p0,M0),u0,d0),L0={kit:{"fa-kit":"fak"},"kit-duotone":{"fa-kit-duotone":"fakd"}},v0={"Font Awesome Kit":{400:"fak",normal:"fak"},"Font Awesome Kit Duotone":{400:"fakd",normal:"fakd"}},h0={kit:{fak:"fa-kit"},"kit-duotone":{fakd:"fa-kit-duotone"}},Q1={kit:{kit:"fak"},"kit-duotone":{"kit-duotone":"fakd"}},R2,d2={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},g0=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press"],C0="classic",x0="duotone",S0="sharp",N0="sharp-duotone",b0="chisel",w0="etch",y0="jelly",k0="jelly-duo",A0="jelly-fill",P0="notdog",T0="notdog-duo",F0="slab",B0="slab-press",D0="thumbprint",R0="whiteboard",H0="Classic",E0="Duotone",U0="Sharp",I0="Sharp Duotone",O0="Chisel",_0="Etch",W0="Jelly",q0="Jelly Duo",G0="Jelly Fill",V0="Notdog",j0="Notdog Duo",$0="Slab",X0="Slab Press",Y0="Thumbprint",K0="Whiteboard",f5=(R2={},d(d(d(d(d(d(d(d(d(d(R2,C0,H0),x0,E0),S0,U0),N0,I0),b0,O0),w0,_0),y0,W0),k0,q0),A0,G0),P0,V0),d(d(d(d(d(R2,T0,j0),F0,$0),B0,X0),D0,Y0),R0,K0)),Q0="kit",J0="kit-duotone",Z0="Kit",c6="Kit Duotone",o5=d(d({},Q0,Z0),J0,c6),a6={classic:{"fa-brands":"fab","fa-duotone":"fad","fa-light":"fal","fa-regular":"far","fa-solid":"fas","fa-thin":"fat"},duotone:{"fa-regular":"fadr","fa-light":"fadl","fa-thin":"fadt"},sharp:{"fa-solid":"fass","fa-regular":"fasr","fa-light":"fasl","fa-thin":"fast"},"sharp-duotone":{"fa-solid":"fasds","fa-regular":"fasdr","fa-light":"fasdl","fa-thin":"fasdt"},slab:{"fa-regular":"faslr"},"slab-press":{"fa-regular":"faslpr"},whiteboard:{"fa-semibold":"fawsb"},thumbprint:{"fa-light":"fatl"},notdog:{"fa-solid":"fans"},"notdog-duo":{"fa-solid":"fands"},etch:{"fa-solid":"faes"},jelly:{"fa-regular":"fajr"},"jelly-fill":{"fa-regular":"fajfr"},"jelly-duo":{"fa-regular":"fajdr"},chisel:{"fa-regular":"facr"}},l6={classic:["fas","far","fal","fat","fad"],duotone:["fadr","fadl","fadt"],sharp:["fass","fasr","fasl","fast"],"sharp-duotone":["fasds","fasdr","fasdl","fasdt"],slab:["faslr"],"slab-press":["faslpr"],whiteboard:["fawsb"],thumbprint:["fatl"],notdog:["fans"],"notdog-duo":["fands"],etch:["faes"],jelly:["fajr"],"jelly-fill":["fajfr"],"jelly-duo":["fajdr"],chisel:["facr"]},W2={classic:{fab:"fa-brands",fad:"fa-duotone",fal:"fa-light",far:"fa-regular",fas:"fa-solid",fat:"fa-thin"},duotone:{fadr:"fa-regular",fadl:"fa-light",fadt:"fa-thin"},sharp:{fass:"fa-solid",fasr:"fa-regular",fasl:"fa-light",fast:"fa-thin"},"sharp-duotone":{fasds:"fa-solid",fasdr:"fa-regular",fasdl:"fa-light",fasdt:"fa-thin"},slab:{faslr:"fa-regular"},"slab-press":{faslpr:"fa-regular"},whiteboard:{fawsb:"fa-semibold"},thumbprint:{fatl:"fa-light"},notdog:{fans:"fa-solid"},"notdog-duo":{fands:"fa-solid"},etch:{faes:"fa-solid"},jelly:{fajr:"fa-regular"},"jelly-fill":{fajfr:"fa-regular"},"jelly-duo":{fajdr:"fa-regular"},chisel:{facr:"fa-regular"}},e6=["fa-solid","fa-regular","fa-light","fa-thin","fa-duotone","fa-brands","fa-semibold"],G4=["fa","fas","far","fal","fat","fad","fadr","fadl","fadt","fab","fass","fasr","fasl","fast","fasds","fasdr","fasdl","fasdt","faslr","faslpr","fawsb","fatl","fans","fands","faes","fajr","fajfr","fajdr","facr"].concat(g0,e6),r6=["solid","regular","light","thin","duotone","brands","semibold"],V4=[1,2,3,4,5,6,7,8,9,10],s6=V4.concat([11,12,13,14,15,16,17,18,19,20]),i6=["aw","fw","pull-left","pull-right"],n6=[].concat(F(Object.keys(l6)),r6,i6,["2xs","xs","sm","lg","xl","2xl","beat","border","fade","beat-fade","bounce","flip-both","flip-horizontal","flip-vertical","flip","inverse","layers","layers-bottom-left","layers-bottom-right","layers-counter","layers-text","layers-top-left","layers-top-right","li","pull-end","pull-start","pulse","rotate-180","rotate-270","rotate-90","rotate-by","shake","spin-pulse","spin-reverse","spin","stack-1x","stack-2x","stack","ul","width-auto","width-fixed",d2.GROUP,d2.SWAP_OPACITY,d2.PRIMARY,d2.SECONDARY]).concat(V4.map(function(c){return"".concat(c,"x")})).concat(s6.map(function(c){return"w-".concat(c)})),f6={"Font Awesome 5 Free":{900:"fas",400:"far"},"Font Awesome 5 Pro":{900:"fas",400:"far",normal:"far",300:"fal"},"Font Awesome 5 Brands":{400:"fab",normal:"fab"},"Font Awesome 5 Duotone":{900:"fad"}},U="___FONT_AWESOME___",q2=16,j4="fa",$4="svg-inline--fa",$="data-fa-i2svg",G2="data-fa-pseudo-element",o6="data-fa-pseudo-element-pending",e1="data-prefix",r1="data-icon",J1="fontawesome-i2svg",t6="async",m6=["HTML","HEAD","STYLE","SCRIPT"],X4=["::before","::after",":before",":after"],Y4=function(){try{return!0}catch{return!1}}();function z2(c){return new Proxy(c,{get:function(a,e){return e in a?a[e]:a[C]}})}var K4=o({},y4);K4[C]=o(o(o(o({},{"fa-duotone":"duotone"}),y4[C]),K1.kit),K1["kit-duotone"]);var z6=z2(K4),V2=o({},m0);V2[C]=o(o(o(o({},{duotone:"fad"}),V2[C]),Q1.kit),Q1["kit-duotone"]);var Z1=z2(V2),j2=o({},W2);j2[C]=o(o({},j2[C]),h0.kit);var Q4=z2(j2),$2=o({},a6);$2[C]=o(o({},$2[C]),L0.kit);var t5=z2($2),p6=G3,J4="fa-layers-text",u6=V3,M6=o({},f0),m5=z2(M6),d6=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],H2=j3,L6=[].concat(F(z0),F(n6)),f2=W.FontAwesomeConfig||{};function v6(c){var l=v.querySelector("script["+c+"]");if(l)return l.getAttribute(c)}function h6(c){return c===""?!0:c==="false"?!1:c==="true"?!0:c}v&&typeof v.querySelector=="function"&&(c4=[["data-family-prefix","familyPrefix"],["data-css-prefix","cssPrefix"],["data-family-default","familyDefault"],["data-style-default","styleDefault"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-search-pseudo-elements","searchPseudoElements"],["data-search-pseudo-elements-warnings","searchPseudoElementsWarnings"],["data-search-pseudo-elements-full-scan","searchPseudoElementsFullScan"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]],c4.forEach(function(c){var l=S2(c,2),a=l[0],e=l[1],r=h6(v6(a));r!=null&&(f2[e]=r)}));var c4,Z4={styleDefault:"solid",familyDefault:C,cssPrefix:j4,replacementClass:$4,autoReplaceSvg:!0,autoAddCss:!0,searchPseudoElements:!1,searchPseudoElementsWarnings:!0,searchPseudoElementsFullScan:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0};f2.familyPrefix&&(f2.cssPrefix=f2.familyPrefix);var Z=o(o({},Z4),f2);Z.autoReplaceSvg||(Z.observeMutations=!1);var p={};Object.keys(Z4).forEach(function(c){Object.defineProperty(p,c,{enumerable:!0,set:function(a){Z[c]=a,o2.forEach(function(e){return e(p)})},get:function(){return Z[c]}})});Object.defineProperty(p,"familyPrefix",{enumerable:!0,set:function(l){Z.cssPrefix=l,o2.forEach(function(a){return a(p)})},get:function(){return Z.cssPrefix}});W.FontAwesomeConfig=p;var o2=[];function g6(c){return o2.push(c),function(){o2.splice(o2.indexOf(c),1)}}var _=q2,B={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function C6(c){if(!(!c||!O)){var l=v.createElement("style");l.setAttribute("type","text/css"),l.innerHTML=c;for(var a=v.head.childNodes,e=null,r=a.length-1;r>-1;r--){var s=a[r],i=(s.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(i)>-1&&(e=s)}return v.head.insertBefore(l,e),c}}var x6="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function a4(){for(var c=12,l="";c-- >0;)l+=x6[Math.random()*62|0];return l}function c2(c){for(var l=[],a=(c||[]).length>>>0;a--;)l[a]=c[a];return l}function s1(c){return c.classList?c2(c.classList):(c.getAttribute("class")||"").split(" ").filter(function(l){return l})}function c3(c){return"".concat(c).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function S6(c){return Object.keys(c||{}).reduce(function(l,a){return l+"".concat(a,'="').concat(c3(c[a]),'" ')},"").trim()}function N2(c){return Object.keys(c||{}).reduce(function(l,a){return l+"".concat(a,": ").concat(c[a].trim(),";")},"")}function i1(c){return c.size!==B.size||c.x!==B.x||c.y!==B.y||c.rotate!==B.rotate||c.flipX||c.flipY}function N6(c){var l=c.transform,a=c.containerWidth,e=c.iconWidth,r={transform:"translate(".concat(a/2," 256)")},s="translate(".concat(l.x*32,", ").concat(l.y*32,") "),i="scale(".concat(l.size/16*(l.flipX?-1:1),", ").concat(l.size/16*(l.flipY?-1:1),") "),n="rotate(".concat(l.rotate," 0 0)"),f={transform:"".concat(s," ").concat(i," ").concat(n)},t={transform:"translate(".concat(e/2*-1," -256)")};return{outer:r,inner:f,path:t}}function b6(c){var l=c.transform,a=c.width,e=a===void 0?q2:a,r=c.height,s=r===void 0?q2:r,i=c.startCentered,n=i===void 0?!1:i,f="";return n&&w4?f+="translate(".concat(l.x/_-e/2,"em, ").concat(l.y/_-s/2,"em) "):n?f+="translate(calc(-50% + ".concat(l.x/_,"em), calc(-50% + ").concat(l.y/_,"em)) "):f+="translate(".concat(l.x/_,"em, ").concat(l.y/_,"em) "),f+="scale(".concat(l.size/_*(l.flipX?-1:1),", ").concat(l.size/_*(l.flipY?-1:1),") "),f+="rotate(".concat(l.rotate,"deg) "),f}var w6=`:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 7 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 7 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 7 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 7 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 7 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 7 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 7 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 7 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 7 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 7 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 7 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 7 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 7 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 7 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 7 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 7 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 7 Sharp Duotone";
  --fa-font-slab-regular: normal 400 1em/1 "Font Awesome 7 Slab";
  --fa-font-slab-press-regular: normal 400 1em/1 "Font Awesome 7 Slab Press";
  --fa-font-whiteboard-semibold: normal 600 1em/1 "Font Awesome 7 Whiteboard";
  --fa-font-thumbprint-light: normal 300 1em/1 "Font Awesome 7 Thumbprint";
  --fa-font-notdog-solid: normal 900 1em/1 "Font Awesome 7 Notdog";
  --fa-font-notdog-duo-solid: normal 900 1em/1 "Font Awesome 7 Notdog Duo";
  --fa-font-etch-solid: normal 900 1em/1 "Font Awesome 7 Etch";
  --fa-font-jelly-regular: normal 400 1em/1 "Font Awesome 7 Jelly";
  --fa-font-jelly-fill-regular: normal 400 1em/1 "Font Awesome 7 Jelly Fill";
  --fa-font-jelly-duo-regular: normal 400 1em/1 "Font Awesome 7 Jelly Duo";
  --fa-font-chisel-regular: normal 400 1em/1 "Font Awesome 7 Chisel";
}

.svg-inline--fa {
  box-sizing: content-box;
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
  width: var(--fa-width, 1.25em);
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285714em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left,
.svg-inline--fa .fa-pull-start {
  float: inline-start;
  margin-inline-end: var(--fa-pull-margin, 0.3em);
}
.svg-inline--fa.fa-pull-right,
.svg-inline--fa .fa-pull-end {
  float: inline-end;
  margin-inline-start: var(--fa-pull-margin, 0.3em);
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));
  inset-block-start: 0.25em; /* syncing vertical alignment with Web Font rendering */
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: var(--fa-width, 1.25em);
}
.fa-layers .svg-inline--fa {
  inset: 0;
  margin: auto;
  position: absolute;
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: calc(10 / 16 * 1em); /* converts a 10px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 10 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 10 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-xs {
  font-size: calc(12 / 16 * 1em); /* converts a 12px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 12 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 12 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-sm {
  font-size: calc(14 / 16 * 1em); /* converts a 14px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 14 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 14 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-lg {
  font-size: calc(20 / 16 * 1em); /* converts a 20px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 20 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 20 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-xl {
  font-size: calc(24 / 16 * 1em); /* converts a 24px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 24 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 24 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-2xl {
  font-size: calc(32 / 16 * 1em); /* converts a 32px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 32 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 32 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-width-auto {
  --fa-width: auto;
}

.fa-fw,
.fa-width-fixed {
  --fa-width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-inline-start: var(--fa-li-margin, 2.5em);
  padding-inline-start: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

/* Heads Up: Bordered Icons will not be supported in the future!
  - This feature will be deprecated in the next major release of Font Awesome (v8)!
  - You may continue to use it in this version *v7), but it will not be supported in Font Awesome v8.
*/
/* Notes:
* --@{v.$css-prefix}-border-width = 1/16 by default (to render as ~1px based on a 16px default font-size)
* --@{v.$css-prefix}-border-padding =
  ** 3/16 for vertical padding (to give ~2px of vertical whitespace around an icon considering it's vertical alignment)
  ** 4/16 for horizontal padding (to give ~4px of horizontal whitespace around an icon)
*/
.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.0625em);
  box-sizing: var(--fa-border-box-sizing, content-box);
  padding: var(--fa-border-padding, 0.1875em 0.25em);
}

.fa-pull-left,
.fa-pull-start {
  float: inline-start;
  margin-inline-end: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right,
.fa-pull-end {
  float: inline-end;
  margin-inline-start: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
  .fa-bounce,
  .fa-fade,
  .fa-beat-fade,
  .fa-flip,
  .fa-pulse,
  .fa-shake,
  .fa-spin,
  .fa-spin-pulse {
    animation: none !important;
    transition: none !important;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}

.svg-inline--fa.fa-inverse {
  fill: var(--fa-inverse, #fff);
}

.fa-stack {
  display: inline-block;
  height: 2em;
  line-height: 2em;
  position: relative;
  vertical-align: middle;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}`;function a3(){var c=j4,l=$4,a=p.cssPrefix,e=p.replacementClass,r=w6;if(a!==c||e!==l){var s=new RegExp("\\.".concat(c,"\\-"),"g"),i=new RegExp("\\--".concat(c,"\\-"),"g"),n=new RegExp("\\.".concat(l),"g");r=r.replace(s,".".concat(a,"-")).replace(i,"--".concat(a,"-")).replace(n,".".concat(e))}return r}var l4=!1;function E2(){p.autoAddCss&&!l4&&(C6(a3()),l4=!0)}var y6={mixout:function(){return{dom:{css:a3,insertCss:E2}}},hooks:function(){return{beforeDOMElementCreation:function(){E2()},beforeI2svg:function(){E2()}}}},I=W||{};I[U]||(I[U]={});I[U].styles||(I[U].styles={});I[U].hooks||(I[U].hooks={});I[U].shims||(I[U].shims=[]);var T=I[U],l3=[],e3=function(){v.removeEventListener("DOMContentLoaded",e3),C2=1,l3.map(function(l){return l()})},C2=!1;O&&(C2=(v.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(v.readyState),C2||v.addEventListener("DOMContentLoaded",e3));function k6(c){O&&(C2?setTimeout(c,0):l3.push(c))}function p2(c){var l=c.tag,a=c.attributes,e=a===void 0?{}:a,r=c.children,s=r===void 0?[]:r;return typeof c=="string"?c3(c):"<".concat(l," ").concat(S6(e),">").concat(s.map(p2).join(""),"</").concat(l,">")}function e4(c,l,a){if(c&&c[l]&&c[l][a])return{prefix:l,iconName:a,icon:c[l][a]}}var A6=function(l,a){return function(e,r,s,i){return l.call(a,e,r,s,i)}},U2=function(l,a,e,r){var s=Object.keys(l),i=s.length,n=r!==void 0?A6(a,r):a,f,t,z;for(e===void 0?(f=1,z=l[s[0]]):(f=0,z=e);f<i;f++)t=s[f],z=n(z,l[t],t,l);return z};function r3(c){return F(c).length!==1?null:c.codePointAt(0).toString(16)}function r4(c){return Object.keys(c).reduce(function(l,a){var e=c[a],r=!!e.icon;return r?l[e.iconName]=e.icon:l[a]=e,l},{})}function s3(c,l){var a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},e=a.skipHooks,r=e===void 0?!1:e,s=r4(l);typeof T.hooks.addPack=="function"&&!r?T.hooks.addPack(c,r4(l)):T.styles[c]=o(o({},T.styles[c]||{}),s),c==="fas"&&s3("fa",l)}var t2=T.styles,P6=T.shims,i3=Object.keys(Q4),T6=i3.reduce(function(c,l){return c[l]=Object.keys(Q4[l]),c},{}),n1=null,n3={},f3={},o3={},t3={},m3={};function F6(c){return~L6.indexOf(c)}function B6(c,l){var a=l.split("-"),e=a[0],r=a.slice(1).join("-");return e===c&&r!==""&&!F6(r)?r:null}var z3=function(){var l=function(s){return U2(t2,function(i,n,f){return i[f]=U2(n,s,{}),i},{})};n3=l(function(r,s,i){if(s[3]&&(r[s[3]]=i),s[2]){var n=s[2].filter(function(f){return typeof f=="number"});n.forEach(function(f){r[f.toString(16)]=i})}return r}),f3=l(function(r,s,i){if(r[i]=i,s[2]){var n=s[2].filter(function(f){return typeof f=="string"});n.forEach(function(f){r[f]=i})}return r}),m3=l(function(r,s,i){var n=s[2];return r[i]=i,n.forEach(function(f){r[f]=i}),r});var a="far"in t2||p.autoFetchSvg,e=U2(P6,function(r,s){var i=s[0],n=s[1],f=s[2];return n==="far"&&!a&&(n="fas"),typeof i=="string"&&(r.names[i]={prefix:n,iconName:f}),typeof i=="number"&&(r.unicodes[i.toString(16)]={prefix:n,iconName:f}),r},{names:{},unicodes:{}});o3=e.names,t3=e.unicodes,n1=b2(p.styleDefault,{family:p.familyDefault})};g6(function(c){n1=b2(c.styleDefault,{family:p.familyDefault})});z3();function f1(c,l){return(n3[c]||{})[l]}function D6(c,l){return(f3[c]||{})[l]}function j(c,l){return(m3[c]||{})[l]}function p3(c){return o3[c]||{prefix:null,iconName:null}}function R6(c){var l=t3[c],a=f1("fas",c);return l||(a?{prefix:"fas",iconName:a}:null)||{prefix:null,iconName:null}}function q(){return n1}var u3=function(){return{prefix:null,iconName:null,rest:[]}};function H6(c){var l=C,a=i3.reduce(function(e,r){return e[r]="".concat(p.cssPrefix,"-").concat(r),e},{});return W4.forEach(function(e){(c.includes(a[e])||c.some(function(r){return T6[e].includes(r)}))&&(l=e)}),l}function b2(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},a=l.family,e=a===void 0?C:a,r=z6[e][c];if(e===m2&&!c)return"fad";var s=Z1[e][c]||Z1[e][r],i=c in T.styles?c:null,n=s||i||null;return n}function E6(c){var l=[],a=null;return c.forEach(function(e){var r=B6(p.cssPrefix,e);r?a=r:e&&l.push(e)}),{iconName:a,rest:l}}function s4(c){return c.sort().filter(function(l,a,e){return e.indexOf(l)===a})}var i4=G4.concat(q4);function w2(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},a=l.skipLookups,e=a===void 0?!1:a,r=null,s=s4(c.filter(function(u){return i4.includes(u)})),i=s4(c.filter(function(u){return!i4.includes(u)})),n=s.filter(function(u){return r=u,!k4.includes(u)}),f=S2(n,1),t=f[0],z=t===void 0?null:t,m=H6(s),M=o(o({},E6(i)),{},{prefix:b2(z,{family:m})});return o(o(o({},M),_6({values:c,family:m,styles:t2,config:p,canonical:M,givenPrefix:r})),U6(e,r,M))}function U6(c,l,a){var e=a.prefix,r=a.iconName;if(c||!e||!r)return{prefix:e,iconName:r};var s=l==="fa"?p3(r):{},i=j(e,r);return r=s.iconName||i||r,e=s.prefix||e,e==="far"&&!t2.far&&t2.fas&&!p.autoFetchSvg&&(e="fas"),{prefix:e,iconName:r}}var I6=W4.filter(function(c){return c!==C||c!==m2}),O6=Object.keys(W2).filter(function(c){return c!==C}).map(function(c){return Object.keys(W2[c])}).flat();function _6(c){var l=c.values,a=c.family,e=c.canonical,r=c.givenPrefix,s=r===void 0?"":r,i=c.styles,n=i===void 0?{}:i,f=c.config,t=f===void 0?{}:f,z=a===m2,m=l.includes("fa-duotone")||l.includes("fad"),M=t.familyDefault==="duotone",u=e.prefix==="fad"||e.prefix==="fa-duotone";if(!z&&(m||M||u)&&(e.prefix="fad"),(l.includes("fa-brands")||l.includes("fab"))&&(e.prefix="fab"),!e.prefix&&I6.includes(a)){var h=Object.keys(n).find(function(x){return O6.includes(x)});if(h||t.autoFetchSvg){var L=t0.get(a).defaultShortPrefixId;e.prefix=L,e.iconName=j(e.prefix,e.iconName)||e.iconName}}return(e.prefix==="fa"||s==="fa")&&(e.prefix=q()||"fas"),e}var W6=function(){function c(){H3(this,c),this.definitions={}}return E3(c,[{key:"add",value:function(){for(var a=this,e=arguments.length,r=new Array(e),s=0;s<e;s++)r[s]=arguments[s];var i=r.reduce(this._pullDefinitions,{});Object.keys(i).forEach(function(n){a.definitions[n]=o(o({},a.definitions[n]||{}),i[n]),s3(n,i[n]),z3()})}},{key:"reset",value:function(){this.definitions={}}},{key:"_pullDefinitions",value:function(a,e){var r=e.prefix&&e.iconName&&e.icon?{0:e}:e;return Object.keys(r).map(function(s){var i=r[s],n=i.prefix,f=i.iconName,t=i.icon,z=t[2];a[n]||(a[n]={}),z.length>0&&z.forEach(function(m){typeof m=="string"&&(a[n][m]=t)}),a[n][f]=t}),a}}])}(),n4=[],Q={},J={},q6=Object.keys(J);function G6(c,l){var a=l.mixoutsTo;return n4=c,Q={},Object.keys(J).forEach(function(e){q6.indexOf(e)===-1&&delete J[e]}),n4.forEach(function(e){var r=e.mixout?e.mixout():{};if(Object.keys(r).forEach(function(i){typeof r[i]=="function"&&(a[i]=r[i]),g2(r[i])==="object"&&Object.keys(r[i]).forEach(function(n){a[i]||(a[i]={}),a[i][n]=r[i][n]})}),e.hooks){var s=e.hooks();Object.keys(s).forEach(function(i){Q[i]||(Q[i]=[]),Q[i].push(s[i])})}e.provides&&e.provides(J)}),a}function X2(c,l){for(var a=arguments.length,e=new Array(a>2?a-2:0),r=2;r<a;r++)e[r-2]=arguments[r];var s=Q[c]||[];return s.forEach(function(i){l=i.apply(null,[l].concat(e))}),l}function X(c){for(var l=arguments.length,a=new Array(l>1?l-1:0),e=1;e<l;e++)a[e-1]=arguments[e];var r=Q[c]||[];r.forEach(function(s){s.apply(null,a)})}function G(){var c=arguments[0],l=Array.prototype.slice.call(arguments,1);return J[c]?J[c].apply(null,l):void 0}function Y2(c){c.prefix==="fa"&&(c.prefix="fas");var l=c.iconName,a=c.prefix||q();if(l)return l=j(a,l)||l,e4(M3.definitions,a,l)||e4(T.styles,a,l)}var M3=new W6,V6=function(){p.autoReplaceSvg=!1,p.observeMutations=!1,X("noAuto")},j6={i2svg:function(){var l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return O?(X("beforeI2svg",l),G("pseudoElements2svg",l),G("i2svg",l)):Promise.reject(new Error("Operation requires a DOM of some kind."))},watch:function(){var l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},a=l.autoReplaceSvgRoot;p.autoReplaceSvg===!1&&(p.autoReplaceSvg=!0),p.observeMutations=!0,k6(function(){X6({autoReplaceSvgRoot:a}),X("watch",l)})}},$6={icon:function(l){if(l===null)return null;if(g2(l)==="object"&&l.prefix&&l.iconName)return{prefix:l.prefix,iconName:j(l.prefix,l.iconName)||l.iconName};if(Array.isArray(l)&&l.length===2){var a=l[1].indexOf("fa-")===0?l[1].slice(3):l[1],e=b2(l[0]);return{prefix:e,iconName:j(e,a)||a}}if(typeof l=="string"&&(l.indexOf("".concat(p.cssPrefix,"-"))>-1||l.match(p6))){var r=w2(l.split(" "),{skipLookups:!0});return{prefix:r.prefix||q(),iconName:j(r.prefix,r.iconName)||r.iconName}}if(typeof l=="string"){var s=q();return{prefix:s,iconName:j(s,l)||l}}}},w={noAuto:V6,config:p,dom:j6,parse:$6,library:M3,findIconDefinition:Y2,toHtml:p2},X6=function(){var l=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},a=l.autoReplaceSvgRoot,e=a===void 0?v:a;(Object.keys(T.styles).length>0||p.autoFetchSvg)&&O&&p.autoReplaceSvg&&w.dom.i2svg({node:e})};function y2(c,l){return Object.defineProperty(c,"abstract",{get:l}),Object.defineProperty(c,"html",{get:function(){return c.abstract.map(function(e){return p2(e)})}}),Object.defineProperty(c,"node",{get:function(){if(O){var e=v.createElement("div");return e.innerHTML=c.html,e.children}}}),c}function Y6(c){var l=c.children,a=c.main,e=c.mask,r=c.attributes,s=c.styles,i=c.transform;if(i1(i)&&a.found&&!e.found){var n=a.width,f=a.height,t={x:n/f/2,y:.5};r.style=N2(o(o({},s),{},{"transform-origin":"".concat(t.x+i.x/16,"em ").concat(t.y+i.y/16,"em")}))}return[{tag:"svg",attributes:r,children:l}]}function K6(c){var l=c.prefix,a=c.iconName,e=c.children,r=c.attributes,s=c.symbol,i=s===!0?"".concat(l,"-").concat(p.cssPrefix,"-").concat(a):s;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:o(o({},r),{},{id:i}),children:e}]}]}function Q6(c){var l=["aria-label","aria-labelledby","title","role"];return l.some(function(a){return a in c})}function o1(c){var l=c.icons,a=l.main,e=l.mask,r=c.prefix,s=c.iconName,i=c.transform,n=c.symbol,f=c.maskId,t=c.extra,z=c.watchable,m=z===void 0?!1:z,M=e.found?e:a,u=M.width,h=M.height,L=[p.replacementClass,s?"".concat(p.cssPrefix,"-").concat(s):""].filter(function(D){return t.classes.indexOf(D)===-1}).filter(function(D){return D!==""||!!D}).concat(t.classes).join(" "),x={children:[],attributes:o(o({},t.attributes),{},{"data-prefix":r,"data-icon":s,class:L,role:t.attributes.role||"img",viewBox:"0 0 ".concat(u," ").concat(h)})};!Q6(t.attributes)&&!t.attributes["aria-hidden"]&&(x.attributes["aria-hidden"]="true"),m&&(x.attributes[$]="");var g=o(o({},x),{},{prefix:r,iconName:s,main:a,mask:e,maskId:f,transform:i,symbol:n,styles:o({},t.styles)}),N=e.found&&a.found?G("generateAbstractMask",g)||{children:[],attributes:{}}:G("generateAbstractIcon",g)||{children:[],attributes:{}},y=N.children,Y=N.attributes;return g.children=y,g.attributes=Y,n?K6(g):Y6(g)}function f4(c){var l=c.content,a=c.width,e=c.height,r=c.transform,s=c.extra,i=c.watchable,n=i===void 0?!1:i,f=o(o({},s.attributes),{},{class:s.classes.join(" ")});n&&(f[$]="");var t=o({},s.styles);i1(r)&&(t.transform=b6({transform:r,startCentered:!0,width:a,height:e}),t["-webkit-transform"]=t.transform);var z=N2(t);z.length>0&&(f.style=z);var m=[];return m.push({tag:"span",attributes:f,children:[l]}),m}function J6(c){var l=c.content,a=c.extra,e=o(o({},a.attributes),{},{class:a.classes.join(" ")}),r=N2(a.styles);r.length>0&&(e.style=r);var s=[];return s.push({tag:"span",attributes:e,children:[l]}),s}var I2=T.styles;function K2(c){var l=c[0],a=c[1],e=c.slice(4),r=S2(e,1),s=r[0],i=null;return Array.isArray(s)?i={tag:"g",attributes:{class:"".concat(p.cssPrefix,"-").concat(H2.GROUP)},children:[{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(H2.SECONDARY),fill:"currentColor",d:s[0]}},{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(H2.PRIMARY),fill:"currentColor",d:s[1]}}]}:i={tag:"path",attributes:{fill:"currentColor",d:s}},{found:!0,width:l,height:a,icon:i}}var Z6={found:!1,width:512,height:512};function c8(c,l){!Y4&&!p.showMissingIcons&&c&&console.error('Icon with name "'.concat(c,'" and prefix "').concat(l,'" is missing.'))}function Q2(c,l){var a=l;return l==="fa"&&p.styleDefault!==null&&(l=q()),new Promise(function(e,r){if(a==="fa"){var s=p3(c)||{};c=s.iconName||c,l=s.prefix||l}if(c&&l&&I2[l]&&I2[l][c]){var i=I2[l][c];return e(K2(i))}c8(c,l),e(o(o({},Z6),{},{icon:p.showMissingIcons&&c?G("missingIconAbstract")||{}:{}}))})}var o4=function(){},J2=p.measurePerformance&&M2&&M2.mark&&M2.measure?M2:{mark:o4,measure:o4},n2='FA "7.0.0"',a8=function(l){return J2.mark("".concat(n2," ").concat(l," begins")),function(){return d3(l)}},d3=function(l){J2.mark("".concat(n2," ").concat(l," ends")),J2.measure("".concat(n2," ").concat(l),"".concat(n2," ").concat(l," begins"),"".concat(n2," ").concat(l," ends"))},t1={begin:a8,end:d3},v2=function(){};function t4(c){var l=c.getAttribute?c.getAttribute($):null;return typeof l=="string"}function l8(c){var l=c.getAttribute?c.getAttribute(e1):null,a=c.getAttribute?c.getAttribute(r1):null;return l&&a}function e8(c){return c&&c.classList&&c.classList.contains&&c.classList.contains(p.replacementClass)}function r8(){if(p.autoReplaceSvg===!0)return h2.replace;var c=h2[p.autoReplaceSvg];return c||h2.replace}function s8(c){return v.createElementNS("http://www.w3.org/2000/svg",c)}function i8(c){return v.createElement(c)}function L3(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},a=l.ceFn,e=a===void 0?c.tag==="svg"?s8:i8:a;if(typeof c=="string")return v.createTextNode(c);var r=e(c.tag);Object.keys(c.attributes||[]).forEach(function(i){r.setAttribute(i,c.attributes[i])});var s=c.children||[];return s.forEach(function(i){r.appendChild(L3(i,{ceFn:e}))}),r}function n8(c){var l=" ".concat(c.outerHTML," ");return l="".concat(l,"Font Awesome fontawesome.com "),l}var h2={replace:function(l){var a=l[0];if(a.parentNode)if(l[1].forEach(function(r){a.parentNode.insertBefore(L3(r),a)}),a.getAttribute($)===null&&p.keepOriginalSource){var e=v.createComment(n8(a));a.parentNode.replaceChild(e,a)}else a.remove()},nest:function(l){var a=l[0],e=l[1];if(~s1(a).indexOf(p.replacementClass))return h2.replace(l);var r=new RegExp("".concat(p.cssPrefix,"-.*"));if(delete e[0].attributes.id,e[0].attributes.class){var s=e[0].attributes.class.split(" ").reduce(function(n,f){return f===p.replacementClass||f.match(r)?n.toSvg.push(f):n.toNode.push(f),n},{toNode:[],toSvg:[]});e[0].attributes.class=s.toSvg.join(" "),s.toNode.length===0?a.removeAttribute("class"):a.setAttribute("class",s.toNode.join(" "))}var i=e.map(function(n){return p2(n)}).join(`
`);a.setAttribute($,""),a.innerHTML=i}};function m4(c){c()}function v3(c,l){var a=typeof l=="function"?l:v2;if(c.length===0)a();else{var e=m4;p.mutateApproach===t6&&(e=W.requestAnimationFrame||m4),e(function(){var r=r8(),s=t1.begin("mutate");c.map(r),s(),a()})}}var m1=!1;function h3(){m1=!0}function Z2(){m1=!1}var x2=null;function z4(c){if(Y1&&p.observeMutations){var l=c.treeCallback,a=l===void 0?v2:l,e=c.nodeCallback,r=e===void 0?v2:e,s=c.pseudoElementsCallback,i=s===void 0?v2:s,n=c.observeMutationsRoot,f=n===void 0?v:n;x2=new Y1(function(t){if(!m1){var z=q();c2(t).forEach(function(m){if(m.type==="childList"&&m.addedNodes.length>0&&!t4(m.addedNodes[0])&&(p.searchPseudoElements&&i(m.target),a(m.target)),m.type==="attributes"&&m.target.parentNode&&p.searchPseudoElements&&i([m.target],!0),m.type==="attributes"&&t4(m.target)&&~d6.indexOf(m.attributeName))if(m.attributeName==="class"&&l8(m.target)){var M=w2(s1(m.target)),u=M.prefix,h=M.iconName;m.target.setAttribute(e1,u||z),h&&m.target.setAttribute(r1,h)}else e8(m.target)&&r(m.target)})}}),O&&x2.observe(f,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}}function f8(){x2&&x2.disconnect()}function o8(c){var l=c.getAttribute("style"),a=[];return l&&(a=l.split(";").reduce(function(e,r){var s=r.split(":"),i=s[0],n=s.slice(1);return i&&n.length>0&&(e[i]=n.join(":").trim()),e},{})),a}function t8(c){var l=c.getAttribute("data-prefix"),a=c.getAttribute("data-icon"),e=c.innerText!==void 0?c.innerText.trim():"",r=w2(s1(c));return r.prefix||(r.prefix=q()),l&&a&&(r.prefix=l,r.iconName=a),r.iconName&&r.prefix||(r.prefix&&e.length>0&&(r.iconName=D6(r.prefix,c.innerText)||f1(r.prefix,r3(c.innerText))),!r.iconName&&p.autoFetchSvg&&c.firstChild&&c.firstChild.nodeType===Node.TEXT_NODE&&(r.iconName=c.firstChild.data)),r}function m8(c){var l=c2(c.attributes).reduce(function(a,e){return a.name!=="class"&&a.name!=="style"&&(a[e.name]=e.value),a},{});return l}function z8(){return{iconName:null,prefix:null,transform:B,symbol:!1,mask:{iconName:null,prefix:null,rest:[]},maskId:null,extra:{classes:[],styles:{},attributes:{}}}}function p4(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{styleParser:!0},a=t8(c),e=a.iconName,r=a.prefix,s=a.rest,i=m8(c),n=X2("parseNodeAttributes",{},c),f=l.styleParser?o8(c):[];return o({iconName:e,prefix:r,transform:B,mask:{iconName:null,prefix:null,rest:[]},maskId:null,symbol:!1,extra:{classes:s,styles:f,attributes:i}},n)}var p8=T.styles;function g3(c){var l=p.autoReplaceSvg==="nest"?p4(c,{styleParser:!1}):p4(c);return~l.extra.classes.indexOf(J4)?G("generateLayersText",c,l):G("generateSvgReplacementMutation",c,l)}function u8(){return[].concat(F(q4),F(G4))}function u4(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!O)return Promise.resolve();var a=v.documentElement.classList,e=function(m){return a.add("".concat(J1,"-").concat(m))},r=function(m){return a.remove("".concat(J1,"-").concat(m))},s=p.autoFetchSvg?u8():k4.concat(Object.keys(p8));s.includes("fa")||s.push("fa");var i=[".".concat(J4,":not([").concat($,"])")].concat(s.map(function(z){return".".concat(z,":not([").concat($,"])")})).join(", ");if(i.length===0)return Promise.resolve();var n=[];try{n=c2(c.querySelectorAll(i))}catch{}if(n.length>0)e("pending"),r("complete");else return Promise.resolve();var f=t1.begin("onTree"),t=n.reduce(function(z,m){try{var M=g3(m);M&&z.push(M)}catch(u){Y4||u.name==="MissingIcon"&&console.error(u)}return z},[]);return new Promise(function(z,m){Promise.all(t).then(function(M){v3(M,function(){e("active"),e("complete"),r("pending"),typeof l=="function"&&l(),f(),z()})}).catch(function(M){f(),m(M)})})}function M8(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;g3(c).then(function(a){a&&v3([a],l)})}function d8(c){return function(l){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=(l||{}).icon?l:Y2(l||{}),r=a.mask;return r&&(r=(r||{}).icon?r:Y2(r||{})),c(e,o(o({},a),{},{mask:r}))}}var L8=function(l){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=a.transform,r=e===void 0?B:e,s=a.symbol,i=s===void 0?!1:s,n=a.mask,f=n===void 0?null:n,t=a.maskId,z=t===void 0?null:t,m=a.classes,M=m===void 0?[]:m,u=a.attributes,h=u===void 0?{}:u,L=a.styles,x=L===void 0?{}:L;if(l){var g=l.prefix,N=l.iconName,y=l.icon;return y2(o({type:"icon"},l),function(){return X("beforeDOMElementCreation",{iconDefinition:l,params:a}),o1({icons:{main:K2(y),mask:f?K2(f.icon):{found:!1,width:null,height:null,icon:{}}},prefix:g,iconName:N,transform:o(o({},B),r),symbol:i,maskId:z,extra:{attributes:h,styles:x,classes:M}})})}},v8={mixout:function(){return{icon:d8(L8)}},hooks:function(){return{mutationObserverCallbacks:function(a){return a.treeCallback=u4,a.nodeCallback=M8,a}}},provides:function(l){l.i2svg=function(a){var e=a.node,r=e===void 0?v:e,s=a.callback,i=s===void 0?function(){}:s;return u4(r,i)},l.generateSvgReplacementMutation=function(a,e){var r=e.iconName,s=e.prefix,i=e.transform,n=e.symbol,f=e.mask,t=e.maskId,z=e.extra;return new Promise(function(m,M){Promise.all([Q2(r,s),f.iconName?Q2(f.iconName,f.prefix):Promise.resolve({found:!1,width:512,height:512,icon:{}})]).then(function(u){var h=S2(u,2),L=h[0],x=h[1];m([a,o1({icons:{main:L,mask:x},prefix:s,iconName:r,transform:i,symbol:n,maskId:t,extra:z,watchable:!0})])}).catch(M)})},l.generateAbstractIcon=function(a){var e=a.children,r=a.attributes,s=a.main,i=a.transform,n=a.styles,f=N2(n);f.length>0&&(r.style=f);var t;return i1(i)&&(t=G("generateAbstractTransformGrouping",{main:s,transform:i,containerWidth:s.width,iconWidth:s.width})),e.push(t||s.icon),{children:e,attributes:r}}}},h8={mixout:function(){return{layer:function(a){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.classes,s=r===void 0?[]:r;return y2({type:"layer"},function(){X("beforeDOMElementCreation",{assembler:a,params:e});var i=[];return a(function(n){Array.isArray(n)?n.map(function(f){i=i.concat(f.abstract)}):i=i.concat(n.abstract)}),[{tag:"span",attributes:{class:["".concat(p.cssPrefix,"-layers")].concat(F(s)).join(" ")},children:i}]})}}}},g8={mixout:function(){return{counter:function(a){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.title,s=r===void 0?null:r,i=e.classes,n=i===void 0?[]:i,f=e.attributes,t=f===void 0?{}:f,z=e.styles,m=z===void 0?{}:z;return y2({type:"counter",content:a},function(){return X("beforeDOMElementCreation",{content:a,params:e}),J6({content:a.toString(),title:s,extra:{attributes:t,styles:m,classes:["".concat(p.cssPrefix,"-layers-counter")].concat(F(n))}})})}}}},C8={mixout:function(){return{text:function(a){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.transform,s=r===void 0?B:r,i=e.classes,n=i===void 0?[]:i,f=e.attributes,t=f===void 0?{}:f,z=e.styles,m=z===void 0?{}:z;return y2({type:"text",content:a},function(){return X("beforeDOMElementCreation",{content:a,params:e}),f4({content:a,transform:o(o({},B),s),extra:{attributes:t,styles:m,classes:["".concat(p.cssPrefix,"-layers-text")].concat(F(n))}})})}}},provides:function(l){l.generateLayersText=function(a,e){var r=e.transform,s=e.extra,i=null,n=null;if(w4){var f=parseInt(getComputedStyle(a).fontSize,10),t=a.getBoundingClientRect();i=t.width/f,n=t.height/f}return Promise.resolve([a,f4({content:a.innerHTML,width:i,height:n,transform:r,extra:s,watchable:!0})])}}},C3=new RegExp('"',"ug"),M4=[1105920,1112319],d4=o(o(o(o({},{FontAwesome:{normal:"fas",400:"fas"}}),o0),f6),v0),c1=Object.keys(d4).reduce(function(c,l){return c[l.toLowerCase()]=d4[l],c},{}),x8=Object.keys(c1).reduce(function(c,l){var a=c1[l];return c[l]=a[900]||F(Object.entries(a))[0][1],c},{});function S8(c){var l=c.replace(C3,"");return r3(F(l)[0]||"")}function N8(c){var l=c.getPropertyValue("font-feature-settings").includes("ss01"),a=c.getPropertyValue("content"),e=a.replace(C3,""),r=e.codePointAt(0),s=r>=M4[0]&&r<=M4[1],i=e.length===2?e[0]===e[1]:!1;return s||i||l}function b8(c,l){var a=c.replace(/^['"]|['"]$/g,"").toLowerCase(),e=parseInt(l),r=isNaN(e)?"normal":e;return(c1[a]||{})[r]||x8[a]}function L4(c,l){var a="".concat(o6).concat(l.replace(":","-"));return new Promise(function(e,r){if(c.getAttribute(a)!==null)return e();var s=c2(c.children),i=s.filter(function(k2){return k2.getAttribute(G2)===l})[0],n=W.getComputedStyle(c,l),f=n.getPropertyValue("font-family"),t=f.match(u6),z=n.getPropertyValue("font-weight"),m=n.getPropertyValue("content");if(i&&!t)return c.removeChild(i),e();if(t&&m!=="none"&&m!==""){var M=n.getPropertyValue("content"),u=b8(f,z),h=S8(M),L=t[0].startsWith("FontAwesome"),x=N8(n),g=f1(u,h),N=g;if(L){var y=R6(h);y.iconName&&y.prefix&&(g=y.iconName,u=y.prefix)}if(g&&!x&&(!i||i.getAttribute(e1)!==u||i.getAttribute(r1)!==N)){c.setAttribute(a,N),i&&c.removeChild(i);var Y=z8(),D=Y.extra;D.attributes[G2]=l,Q2(g,u).then(function(k2){var F3=o1(o(o({},Y),{},{icons:{main:k2,mask:u3()},prefix:u,iconName:N,extra:D,watchable:!0})),A2=v.createElementNS("http://www.w3.org/2000/svg","svg");l==="::before"?c.insertBefore(A2,c.firstChild):c.appendChild(A2),A2.outerHTML=F3.map(function(B3){return p2(B3)}).join(`
`),c.removeAttribute(a),e()}).catch(r)}else e()}else e()})}function w8(c){return Promise.all([L4(c,"::before"),L4(c,"::after")])}function y8(c){return c.parentNode!==document.head&&!~m6.indexOf(c.tagName.toUpperCase())&&!c.getAttribute(G2)&&(!c.parentNode||c.parentNode.tagName!=="svg")}var k8=function(l){return!!l&&X4.some(function(a){return l.includes(a)})},A8=function(l){if(!l)return[];for(var a=new Set,e=[l],r=[/(?=\s:)/,new RegExp("(?<=\\)\\)?[^,]*,)")],s=function(){var u=n[i];e=e.flatMap(function(h){return h.split(u).map(function(L){return L.replace(/,\s*$/,"").trim()})})},i=0,n=r;i<n.length;i++)s();e=e.flatMap(function(M){return M.includes("(")?M:M.split(",").map(function(u){return u.trim()})});var f=L2(e),t;try{for(f.s();!(t=f.n()).done;){var z=t.value;if(k8(z)){var m=X4.reduce(function(M,u){return M.replace(u,"")},z);m!==""&&m!=="*"&&a.add(m)}}}catch(M){f.e(M)}finally{f.f()}return a};function v4(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(O){var a;if(l)a=c;else if(p.searchPseudoElementsFullScan)a=c.querySelectorAll("*");else{var e=new Set,r=L2(document.styleSheets),s;try{for(r.s();!(s=r.n()).done;){var i=s.value;try{var n=L2(i.cssRules),f;try{for(n.s();!(f=n.n()).done;){var t=f.value,z=A8(t.selectorText),m=L2(z),M;try{for(m.s();!(M=m.n()).done;){var u=M.value;e.add(u)}}catch(L){m.e(L)}finally{m.f()}}}catch(L){n.e(L)}finally{n.f()}}catch(L){p.searchPseudoElementsWarnings&&console.warn("Font Awesome: cannot parse stylesheet: ".concat(i.href," (").concat(L.message,`)
If it declares any Font Awesome CSS pseudo-elements, they will not be rendered as SVG icons. Add crossorigin="anonymous" to the <link>, enable searchPseudoElementsFullScan for slower but more thorough DOM parsing, or suppress this warning by setting searchPseudoElementsWarnings to false.`))}}}catch(L){r.e(L)}finally{r.f()}if(!e.size)return;var h=Array.from(e).join(", ");try{a=c.querySelectorAll(h)}catch{}}return new Promise(function(L,x){var g=c2(a).filter(y8).map(w8),N=t1.begin("searchPseudoElements");h3(),Promise.all(g).then(function(){N(),Z2(),L()}).catch(function(){N(),Z2(),x()})})}}var P8={hooks:function(){return{mutationObserverCallbacks:function(a){return a.pseudoElementsCallback=v4,a}}},provides:function(l){l.pseudoElements2svg=function(a){var e=a.node,r=e===void 0?v:e;p.searchPseudoElements&&v4(r)}}},h4=!1,T8={mixout:function(){return{dom:{unwatch:function(){h3(),h4=!0}}}},hooks:function(){return{bootstrap:function(){z4(X2("mutationObserverCallbacks",{}))},noAuto:function(){f8()},watch:function(a){var e=a.observeMutationsRoot;h4?Z2():z4(X2("mutationObserverCallbacks",{observeMutationsRoot:e}))}}}},g4=function(l){var a={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return l.toLowerCase().split(" ").reduce(function(e,r){var s=r.toLowerCase().split("-"),i=s[0],n=s.slice(1).join("-");if(i&&n==="h")return e.flipX=!0,e;if(i&&n==="v")return e.flipY=!0,e;if(n=parseFloat(n),isNaN(n))return e;switch(i){case"grow":e.size=e.size+n;break;case"shrink":e.size=e.size-n;break;case"left":e.x=e.x-n;break;case"right":e.x=e.x+n;break;case"up":e.y=e.y-n;break;case"down":e.y=e.y+n;break;case"rotate":e.rotate=e.rotate+n;break}return e},a)},F8={mixout:function(){return{parse:{transform:function(a){return g4(a)}}}},hooks:function(){return{parseNodeAttributes:function(a,e){var r=e.getAttribute("data-fa-transform");return r&&(a.transform=g4(r)),a}}},provides:function(l){l.generateAbstractTransformGrouping=function(a){var e=a.main,r=a.transform,s=a.containerWidth,i=a.iconWidth,n={transform:"translate(".concat(s/2," 256)")},f="translate(".concat(r.x*32,", ").concat(r.y*32,") "),t="scale(".concat(r.size/16*(r.flipX?-1:1),", ").concat(r.size/16*(r.flipY?-1:1),") "),z="rotate(".concat(r.rotate," 0 0)"),m={transform:"".concat(f," ").concat(t," ").concat(z)},M={transform:"translate(".concat(i/2*-1," -256)")},u={outer:n,inner:m,path:M};return{tag:"g",attributes:o({},u.outer),children:[{tag:"g",attributes:o({},u.inner),children:[{tag:e.icon.tag,children:e.icon.children,attributes:o(o({},e.icon.attributes),u.path)}]}]}}}},O2={x:0,y:0,width:"100%",height:"100%"};function C4(c){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return c.attributes&&(c.attributes.fill||l)&&(c.attributes.fill="black"),c}function B8(c){return c.tag==="g"?c.children:[c]}var D8={hooks:function(){return{parseNodeAttributes:function(a,e){var r=e.getAttribute("data-fa-mask"),s=r?w2(r.split(" ").map(function(i){return i.trim()})):u3();return s.prefix||(s.prefix=q()),a.mask=s,a.maskId=e.getAttribute("data-fa-mask-id"),a}}},provides:function(l){l.generateAbstractMask=function(a){var e=a.children,r=a.attributes,s=a.main,i=a.mask,n=a.maskId,f=a.transform,t=s.width,z=s.icon,m=i.width,M=i.icon,u=N6({transform:f,containerWidth:m,iconWidth:t}),h={tag:"rect",attributes:o(o({},O2),{},{fill:"white"})},L=z.children?{children:z.children.map(C4)}:{},x={tag:"g",attributes:o({},u.inner),children:[C4(o({tag:z.tag,attributes:o(o({},z.attributes),u.path)},L))]},g={tag:"g",attributes:o({},u.outer),children:[x]},N="mask-".concat(n||a4()),y="clip-".concat(n||a4()),Y={tag:"mask",attributes:o(o({},O2),{},{id:N,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[h,g]},D={tag:"defs",children:[{tag:"clipPath",attributes:{id:y},children:B8(M)},Y]};return e.push(D,{tag:"rect",attributes:o({fill:"currentColor","clip-path":"url(#".concat(y,")"),mask:"url(#".concat(N,")")},O2)}),{children:e,attributes:r}}}},R8={provides:function(l){var a=!1;W.matchMedia&&(a=W.matchMedia("(prefers-reduced-motion: reduce)").matches),l.missingIconAbstract=function(){var e=[],r={fill:"currentColor"},s={attributeType:"XML",repeatCount:"indefinite",dur:"2s"};e.push({tag:"path",attributes:o(o({},r),{},{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})});var i=o(o({},s),{},{attributeName:"opacity"}),n={tag:"circle",attributes:o(o({},r),{},{cx:"256",cy:"364",r:"28"}),children:[]};return a||n.children.push({tag:"animate",attributes:o(o({},s),{},{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:o(o({},i),{},{values:"1;0;1;1;0;1;"})}),e.push(n),e.push({tag:"path",attributes:o(o({},r),{},{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:a?[]:[{tag:"animate",attributes:o(o({},i),{},{values:"1;0;0;0;0;1;"})}]}),a||e.push({tag:"path",attributes:o(o({},r),{},{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:o(o({},i),{},{values:"0;0;1;1;0;0;"})}]}),{tag:"g",attributes:{class:"missing"},children:e}}}},H8={hooks:function(){return{parseNodeAttributes:function(a,e){var r=e.getAttribute("data-fa-symbol"),s=r===null?!1:r===""?!0:r;return a.symbol=s,a}}}},E8=[y6,v8,h8,g8,C8,P8,T8,F8,D8,R8,H8];G6(E8,{mixoutsTo:w});var z5=w.noAuto,x3=w.config,p5=w.library,S3=w.dom,N3=w.parse,u5=w.findIconDefinition,M5=w.toHtml,b3=w.icon,d5=w.layer,U8=w.text,I8=w.counter;var O8=["*"],_8=(()=>{class c{defaultPrefix="fas";fallbackIcon=null;fixedWidth;set autoAddCss(a){x3.autoAddCss=a,this._autoAddCss=a}get autoAddCss(){return this._autoAddCss}_autoAddCss=!0;static \u0275fac=function(e){return new(e||c)};static \u0275prov=a2({token:c,factory:c.\u0275fac,providedIn:"root"})}return c})(),W8=(()=>{class c{definitions={};addIcons(...a){for(let e of a){e.prefix in this.definitions||(this.definitions[e.prefix]={}),this.definitions[e.prefix][e.iconName]=e;for(let r of e.icon[2])typeof r=="string"&&(this.definitions[e.prefix][r]=e)}}addIconPacks(...a){for(let e of a){let r=Object.keys(e).map(s=>e[s]);this.addIcons(...r)}}getIconDefinition(a,e){return a in this.definitions&&e in this.definitions[a]?this.definitions[a][e]:null}static \u0275fac=function(e){return new(e||c)};static \u0275prov=a2({token:c,factory:c.\u0275fac,providedIn:"root"})}return c})(),q8=c=>{throw new Error(`Could not find icon with iconName=${c.iconName} and prefix=${c.prefix} in the icon library.`)},G8=()=>{throw new Error("Property `icon` is required for `fa-icon`/`fa-duotone-icon` components.")},y3=c=>c!=null&&(c===90||c===180||c===270||c==="90"||c==="180"||c==="270"),V8=c=>{let l=y3(c.rotate),a={[`fa-${c.animation}`]:c.animation!=null&&!c.animation.startsWith("spin"),"fa-spin":c.animation==="spin"||c.animation==="spin-reverse","fa-spin-pulse":c.animation==="spin-pulse"||c.animation==="spin-pulse-reverse","fa-spin-reverse":c.animation==="spin-reverse"||c.animation==="spin-pulse-reverse","fa-pulse":c.animation==="spin-pulse"||c.animation==="spin-pulse-reverse","fa-fw":c.fixedWidth,"fa-border":c.border,"fa-inverse":c.inverse,"fa-layers-counter":c.counter,"fa-flip-horizontal":c.flip==="horizontal"||c.flip==="both","fa-flip-vertical":c.flip==="vertical"||c.flip==="both",[`fa-${c.size}`]:c.size!==null,[`fa-rotate-${c.rotate}`]:l,"fa-rotate-by":c.rotate!=null&&!l,[`fa-pull-${c.pull}`]:c.pull!==null,[`fa-stack-${c.stackItemSize}`]:c.stackItemSize!=null};return Object.keys(a).map(e=>a[e]?e:null).filter(e=>e!=null)},z1=new WeakSet,w3="fa-auto-css";function j8(c,l){if(!l.autoAddCss||z1.has(c))return;if(c.getElementById(w3)!=null){l.autoAddCss=!1,z1.add(c);return}let a=c.createElement("style");a.setAttribute("type","text/css"),a.setAttribute("id",w3),a.innerHTML=S3.css();let e=c.head.childNodes,r=null;for(let s=e.length-1;s>-1;s--){let i=e[s],n=i.nodeName.toUpperCase();["STYLE","LINK"].indexOf(n)>-1&&(r=i)}c.head.insertBefore(a,r),l.autoAddCss=!1,z1.add(c)}var $8=c=>c.prefix!==void 0&&c.iconName!==void 0,X8=(c,l)=>$8(c)?c:Array.isArray(c)&&c.length===2?{prefix:c[0],iconName:c[1]}:{prefix:l,iconName:c},Y8=(()=>{class c{stackItemSize=u2("1x");size=u2();_effect=B1(()=>{if(this.size())throw new Error('fa-icon is not allowed to customize size when used inside fa-stack. Set size on the enclosing fa-stack instead: <fa-stack size="4x">...</fa-stack>.')});static \u0275fac=function(e){return new(e||c)};static \u0275dir=h1({type:c,selectors:[["fa-icon","stackItemSize",""],["fa-duotone-icon","stackItemSize",""]],inputs:{stackItemSize:[1,"stackItemSize"],size:[1,"size"]}})}return c})(),K8=(()=>{class c{size=u2();classes=B2(()=>{let a=this.size(),e=a?{[`fa-${a}`]:!0}:{};return u1(p1({},e),{"fa-stack":!0})});static \u0275fac=function(e){return new(e||c)};static \u0275cmp=l2({type:c,selectors:[["fa-stack"]],hostVars:2,hostBindings:function(e,r){e&2&&k1(r.classes())},inputs:{size:[1,"size"]},ngContentSelectors:O8,decls:1,vars:0,template:function(e,r){e&1&&(x1(),S1(0))},encapsulation:2,changeDetection:0})}return c})(),k3=(()=>{class c{icon=S();title=S();animation=S();mask=S();flip=S();size=S();pull=S();border=S();inverse=S();symbol=S();rotate=S();fixedWidth=S();transform=S();a11yRole=S();renderedIconHTML=B2(()=>{let a=this.icon()??this.config.fallbackIcon;if(!a)return G8(),"";let e=this.findIconDefinition(a);if(!e)return"";let r=this.buildParams();j8(this.document,this.config);let s=b3(e,r);return this.sanitizer.bypassSecurityTrustHtml(s.html.join(`
`))});document=R(d1);sanitizer=R(R1);config=R(_8);iconLibrary=R(W8);stackItem=R(Y8,{optional:!0});stack=R(K8,{optional:!0});constructor(){this.stack!=null&&this.stackItem==null&&console.error('FontAwesome: fa-icon and fa-duotone-icon elements must specify stackItemSize attribute when wrapped into fa-stack. Example: <fa-icon stackItemSize="2x" />.')}findIconDefinition(a){let e=X8(a,this.config.defaultPrefix);if("icon"in e)return e;let r=this.iconLibrary.getIconDefinition(e.prefix,e.iconName);return r??(q8(e),null)}buildParams(){let a=this.fixedWidth(),e={flip:this.flip(),animation:this.animation(),border:this.border(),inverse:this.inverse(),size:this.size(),pull:this.pull(),rotate:this.rotate(),fixedWidth:typeof a=="boolean"?a:this.config.fixedWidth,stackItemSize:this.stackItem!=null?this.stackItem.stackItemSize():void 0},r=this.transform(),s=typeof r=="string"?N3.transform(r):r,i=this.mask(),n=i!=null?this.findIconDefinition(i):null,f={},t=this.a11yRole();t!=null&&(f.role=t);let z={};return e.rotate!=null&&!y3(e.rotate)&&(z["--fa-rotate-angle"]=`${e.rotate}`),{title:this.title(),transform:s,classes:V8(e),mask:n??void 0,symbol:this.symbol(),attributes:f,styles:z}}static \u0275fac=function(e){return new(e||c)};static \u0275cmp=l2({type:c,selectors:[["fa-icon"]],hostAttrs:[1,"ng-fa-icon"],hostVars:2,hostBindings:function(e,r){e&2&&(C1("innerHTML",r.renderedIconHTML(),L1),H("title",r.title()??void 0))},inputs:{icon:[1,"icon"],title:[1,"title"],animation:[1,"animation"],mask:[1,"mask"],flip:[1,"flip"],size:[1,"size"],pull:[1,"pull"],border:[1,"border"],inverse:[1,"inverse"],symbol:[1,"symbol"],rotate:[1,"rotate"],fixedWidth:[1,"fixedWidth"],transform:[1,"transform"],a11yRole:[1,"a11yRole"]},outputs:{icon:"iconChange",title:"titleChange",animation:"animationChange",mask:"maskChange",flip:"flipChange",size:"sizeChange",pull:"pullChange",border:"borderChange",inverse:"inverseChange",symbol:"symbolChange",rotate:"rotateChange",fixedWidth:"fixedWidthChange",transform:"transformChange",a11yRole:"a11yRoleChange"},decls:0,vars:0,template:function(e,r){},encapsulation:2,changeDetection:0})}return c})();var A3=(()=>{class c{static \u0275fac=function(e){return new(e||c)};static \u0275mod=v1({type:c});static \u0275inj=M1({})}return c})();var A5={prefix:"fas",iconName:"ellipsis-vertical",icon:[128,512,["ellipsis-v"],"f142","M64 144a56 56 0 1 1 0-112 56 56 0 1 1 0 112zm0 224c30.9 0 56 25.1 56 56s-25.1 56-56 56-56-25.1-56-56 25.1-56 56-56zm56-112c0 30.9-25.1 56-56 56s-56-25.1-56-56 25.1-56 56-56 56 25.1 56 56z"]};var P5={prefix:"fas",iconName:"circle-half-stroke",icon:[512,512,[9680,"adjust"],"f042","M448 256c0-106-86-192-192-192l0 384c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"]};var T5={prefix:"fas",iconName:"sun",icon:[576,512,[9728],"f185","M178.2-10.1c7.4-3.1 15.8-2.2 22.5 2.2l87.8 58.2 87.8-58.2c6.7-4.4 15.1-5.2 22.5-2.2S411.4-.5 413 7.3l20.9 103.2 103.2 20.9c7.8 1.6 14.4 7 17.4 14.3s2.2 15.8-2.2 22.5l-58.2 87.8 58.2 87.8c4.4 6.7 5.2 15.1 2.2 22.5s-9.6 12.8-17.4 14.3L433.8 401.4 413 504.7c-1.6 7.8-7 14.4-14.3 17.4s-15.8 2.2-22.5-2.2l-87.8-58.2-87.8 58.2c-6.7 4.4-15.1 5.2-22.5 2.2s-12.8-9.6-14.3-17.4L143 401.4 39.7 380.5c-7.8-1.6-14.4-7-17.4-14.3s-2.2-15.8 2.2-22.5L82.7 256 24.5 168.2c-4.4-6.7-5.2-15.1-2.2-22.5s9.6-12.8 17.4-14.3L143 110.6 163.9 7.3c1.6-7.8 7-14.4 14.3-17.4zM207.6 256a80.4 80.4 0 1 1 160.8 0 80.4 80.4 0 1 1 -160.8 0zm208.8 0a128.4 128.4 0 1 0 -256.8 0 128.4 128.4 0 1 0 256.8 0z"]};var P3={prefix:"fas",iconName:"user-tag",icon:[640,512,[],"f507","M256.1 8a120 120 0 1 1 0 240 120 120 0 1 1 0-240zM226.4 304l59.4 0c6.7 0 13.2 .4 19.7 1.1-.9 4.9-1.4 9.9-1.4 15l0 92.1c0 25.5 10.1 49.9 28.1 67.9l31.9 31.9-286.3 0c-16.4 0-29.7-13.3-29.7-29.7 0-98.5 79.8-178.3 178.3-178.3zM352.1 412.2l0-92.1c0-17.7 14.3-32 32-32l92.1 0c12.7 0 24.9 5.1 33.9 14.1l96 96c18.7 18.7 18.7 49.1 0 67.9l-76.1 76.1c-18.7 18.7-49.1 18.7-67.9 0l-96-96c-9-9-14.1-21.2-14.1-33.9zm104-44.2a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"]};var F5={prefix:"fas",iconName:"moon",icon:[512,512,[127769,9214],"f186","M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"]};var J8=["tagInput"],Z8=c=>["/user",c];function c5(c,l){if(c&1){let a=s2();V(0,"button",6),K("click",function(r){k(a);let s=b();return A(s.startEdit(r))})("keyup.enter",function(r){k(a);let s=b();return A(s.startEdit(r))})("keyup.space",function(r){k(a);let s=b();return A(s.startEdit(r))}),i2(1),E()}if(c&2){let a=b();y1("background-color",a.tag().color),H("aria-label","Tag: "+a.tag().tag),P(),F2(" ",a.tag().tag," ")}}function a5(c,l){if(c&1){let a=s2();V(0,"button",7),K("click",function(r){k(a);let s=b();return A(s.startEdit(r))}),g1(1,"fa-icon",8),E()}if(c&2){let a=b();H("aria-label","Add Tag For "+a.username),P(),T2("icon",a.faUserTag)}}function l5(c,l){if(c&1){let a=s2();V(0,"button",12),K("click",function(){k(a);let r=b(2);return A(r.removeTag())}),i2(1," \u2717 "),E()}c&2&&H("aria-label","Remove Tag")}function e5(c,l){if(c&1){let a=s2();V(0,"div",5)(1,"input",9,0),T1("ngModelChange",function(r){k(a);let s=b();return P1(s.editValue,r)||(s.editValue=r),A(r)}),K("keyup.enter",function(){k(a);let r=b();return A(r.saveTag())})("keyup.escape",function(){k(a);let r=b();return A(r.cancelEdit())})("blur",function(){k(a);let r=b();return A(r.onInputBlur())}),E(),V(3,"button",10),K("mousedown",function(){k(a);let r=b();return A(r.saveTag())}),i2(4,"\u2713"),E(),e2(5,l5,2,1,"button",11),E()}if(c&2){let a=b();P(),A1("ngModel",a.editValue),H("aria-label","Enter Tag For "+a.username),P(2),H("aria-label","Save Tag"),P(2),r2(a.tag()?5:-1)}}var T3=class c{_username="";set username(l){this._username=l,this.tag.set(this.tagsService.getTag(l))}get username(){return this._username}tagsService=R(_1);tag=P2(void 0);editing=P2(!1);editValue="";faUserTag=P3;tagInput;startEdit(l){l.preventDefault(),l.stopPropagation(),this.editing.set(!0),this.editValue=this.tag()?.tag||"",setTimeout(()=>{let a=this.tagInput?.nativeElement;a?.focus(),a?.select()},0)}saveTag(){let l=this.editValue.trim();l?(this.tagsService.setTag(this.username,l),this.tag.set(this.tagsService.getTag(this.username))):this.tag()&&(this.tagsService.removeTag(this.username),this.tag.set(void 0)),this.editing.set(!1),this.editValue=""}removeTag(){this.tagsService.removeTag(this.username),this.tag.set(void 0),this.editing.set(!1),this.editValue=""}onInputBlur(){setTimeout(()=>{this.editing()&&this.cancelEdit()},100)}cancelEdit(){this.editing.set(!1),this.editValue=""}static \u0275fac=function(a){return new(a||c)};static \u0275cmp=l2({type:c,selectors:[["app-user-tag"]],viewQuery:function(a,e){if(a&1&&N1(J8,5),a&2){let r;b1(r=w1())&&(e.tagInput=r.first)}},inputs:{username:"username"},decls:6,vars:8,consts:[["tagInput",""],[1,"user-tag"],[1,"username-link",3,"routerLink"],["type","button",1,"tag-chip",3,"background-color"],[1,"add-btn"],[1,"editor"],["type","button",1,"tag-chip",3,"click","keyup.enter","keyup.space"],[1,"add-btn",3,"click"],[1,"icon",3,"icon"],["type","text","placeholder","Tag...",1,"tag-input",3,"ngModelChange","keyup.enter","keyup.escape","blur","ngModel"],[1,"save-btn",3,"mousedown"],[1,"remove-btn"],[1,"remove-btn",3,"click"]],template:function(a,e){a&1&&(V(0,"span",1)(1,"a",2),i2(2),E(),e2(3,c5,2,4,"button",3),e2(4,a5,2,2,"button",4),e2(5,e5,6,4,"div",5),E()),a&2&&(P(),T2("routerLink",F1(6,Z8,e.username)),H("aria-label","View Profile Of "+e.username),P(),F2(" ",e.username," "),P(),r2(e.tag()&&!e.editing()?3:-1),P(),r2(!e.tag()&&!e.editing()?4:-1),P(),r2(e.editing()?5:-1))},dependencies:[D1,O1,E1,U1,I1,H1,A3,k3],styles:[`@layer properties;.user-tag[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:calc(var(--spacing, .25rem) * 1)}.username-link[_ngcontent-%COMP%]{cursor:pointer;color:var(--color-blue-600, oklch(54.6% .245 262.881));border-radius:.25rem}@media (hover: hover){.username-link[_ngcontent-%COMP%]:hover{text-decoration-line:underline}}.username-link[_ngcontent-%COMP%]:where(.dark,.dark *){color:var(--color-blue-300, oklch(80.9% .105 251.813))}.username-link[_ngcontent-%COMP%]:focus-visible{--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.username-link[_ngcontent-%COMP%]:focus-visible{--tw-ring-color: var(--color-blue-500, oklch(62.3% .214 259.815))}.username-link[_ngcontent-%COMP%]:focus-visible{--tw-outline-style: none;outline-style:none}.tag-chip[_ngcontent-%COMP%]{cursor:pointer;border-radius:.25rem;padding-inline:calc(var(--spacing, .25rem) * 1.5);padding-block:calc(var(--spacing, .25rem) * .5);font-size:var(--text-xs, .75rem);line-height:var(--tw-leading, var(--text-xs--line-height, calc(1 / .75)));color:var(--color-white, #fff)}.add-btn[_ngcontent-%COMP%]{cursor:pointer;font-size:var(--text-xs, .75rem);line-height:var(--tw-leading, var(--text-xs--line-height, calc(1 / .75)));color:var(--color-gray-400, oklch(70.7% .022 261.325));border-radius:.25rem;padding-inline:calc(var(--spacing, .25rem) * 1)}@media (hover: hover){.add-btn[_ngcontent-%COMP%]:hover{color:var(--color-gray-600, oklch(44.6% .03 256.802))}}.add-btn[_ngcontent-%COMP%]:focus-visible{--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.add-btn[_ngcontent-%COMP%]:focus-visible{--tw-ring-color: var(--color-blue-500, oklch(62.3% .214 259.815))}.add-btn[_ngcontent-%COMP%]:focus-visible{--tw-outline-style: none;outline-style:none}.icon[_ngcontent-%COMP%]{vertical-align:-2px}.editor[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:calc(var(--spacing, .25rem) * 1)}.tag-input[_ngcontent-%COMP%]{width:calc(var(--spacing, .25rem) * 20);border-radius:.25rem;border-style:var(--tw-border-style);border-width:1px;border-color:var(--color-gray-300, oklch(87.2% .01 258.338));padding-inline:calc(var(--spacing, .25rem) * 1);padding-block:calc(var(--spacing, .25rem) * 0);font-size:var(--text-xs, .75rem);line-height:var(--tw-leading, var(--text-xs--line-height, calc(1 / .75)))}.tag-input[_ngcontent-%COMP%]:focus{--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.tag-input[_ngcontent-%COMP%]:focus{--tw-ring-color: var(--color-blue-500, oklch(62.3% .214 259.815))}.tag-input[_ngcontent-%COMP%]:focus{--tw-outline-style: none;outline-style:none}.save-btn[_ngcontent-%COMP%]{cursor:pointer;font-size:var(--text-xs, .75rem);line-height:var(--tw-leading, var(--text-xs--line-height, calc(1 / .75)));color:var(--color-green-600, oklch(62.7% .194 149.214))}@media (hover: hover){.save-btn[_ngcontent-%COMP%]:hover{color:var(--color-green-800, oklch(44.8% .119 151.328))}}.remove-btn[_ngcontent-%COMP%]{cursor:pointer;font-size:var(--text-xs, .75rem);line-height:var(--tw-leading, var(--text-xs--line-height, calc(1 / .75)));color:var(--color-red-600, oklch(57.7% .245 27.325))}@media (hover: hover){.remove-btn[_ngcontent-%COMP%]:hover{color:var(--color-red-800, oklch(44.4% .177 26.899))}}@property --tw-shadow{syntax: "*"; inherits: false; initial-value: 0 0 #0000;}@property --tw-shadow-color{syntax: "*"; inherits: false;}@property --tw-shadow-alpha{syntax: "<percentage>"; inherits: false; initial-value: 100%;}@property --tw-inset-shadow{syntax: "*"; inherits: false; initial-value: 0 0 #0000;}@property --tw-inset-shadow-color{syntax: "*"; inherits: false;}@property --tw-inset-shadow-alpha{syntax: "<percentage>"; inherits: false; initial-value: 100%;}@property --tw-ring-color{syntax: "*"; inherits: false;}@property --tw-ring-shadow{syntax: "*"; inherits: false; initial-value: 0 0 #0000;}@property --tw-inset-ring-color{syntax: "*"; inherits: false;}@property --tw-inset-ring-shadow{syntax: "*"; inherits: false; initial-value: 0 0 #0000;}@property --tw-ring-inset{syntax: "*"; inherits: false;}@property --tw-ring-offset-width{syntax: "<length>"; inherits: false; initial-value: 0px;}@property --tw-ring-offset-color{syntax: "*"; inherits: false; initial-value: #fff;}@property --tw-ring-offset-shadow{syntax: "*"; inherits: false; initial-value: 0 0 #0000;}@property --tw-border-style{syntax: "*"; inherits: false; initial-value: solid;}@layer properties{@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))){*[_ngcontent-%COMP%], [_ngcontent-%COMP%]:before, [_ngcontent-%COMP%]:after, [_ngcontent-%COMP%]::backdrop{--tw-shadow: 0 0 #0000;--tw-shadow-color: initial;--tw-shadow-alpha: 100%;--tw-inset-shadow: 0 0 #0000;--tw-inset-shadow-color: initial;--tw-inset-shadow-alpha: 100%;--tw-ring-color: initial;--tw-ring-shadow: 0 0 #0000;--tw-inset-ring-color: initial;--tw-inset-ring-shadow: 0 0 #0000;--tw-ring-inset: initial;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-offset-shadow: 0 0 #0000;--tw-border-style: solid}}}

`],changeDetection:0})};export{k3 as a,A3 as b,A5 as c,P5 as d,T5 as e,F5 as f,T3 as g,W1 as h};
