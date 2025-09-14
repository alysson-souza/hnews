import{Ba as h2,Bb as e2,Ca as r1,Cb as S,Da as s1,Ma as i1,Rb as z1,U as $,V as c1,Z as U,_a as f1,a as a2,b as l2,cb as n1,db as o1,ga as a1,ka as l1,lb as t1,qa as e1,yb as g2,zb as m1}from"./chunk-Y6BECINB.js";var p1=class c{STORAGE_KEY="hn_user_tags";tagsMap=l1(new Map);DEFAULT_COLORS=["#EF4444","#F97316","#EAB308","#22C55E","#14B8A6","#3B82F6","#8B5CF6","#EC4899","#6B7280"];constructor(){this.loadTags()}loadTags(){try{let a=localStorage.getItem(this.STORAGE_KEY);if(a){let l=JSON.parse(a),e=new Map;l.forEach(r=>e.set(r.username,r)),this.tagsMap.set(e)}}catch(a){console.error("Failed to load user tags:",a)}}saveTags(){try{let a=Array.from(this.tagsMap().values());localStorage.setItem(this.STORAGE_KEY,JSON.stringify(a))}catch(a){console.error("Failed to save user tags:",a)}}setTag(a,l,e){let r=Date.now(),s=this.tagsMap().get(a),i={username:a,tag:l,color:e||this.getRandomColor(),createdAt:s?.createdAt||r,updatedAt:r},f=new Map(this.tagsMap());f.set(a,i),this.tagsMap.set(f),this.saveTags()}getTag(a){return this.tagsMap().get(a)}removeTag(a){let l=new Map(this.tagsMap());l.delete(a),this.tagsMap.set(l),this.saveTags()}getAllTags(){return Array.from(this.tagsMap().values())}getRandomColor(){return this.DEFAULT_COLORS[Math.floor(Math.random()*this.DEFAULT_COLORS.length)]}exportTags(){let a=this.getAllTags();return JSON.stringify(a,null,2)}importTags(a){try{let l=JSON.parse(a);if(!Array.isArray(l))throw new Error("Invalid format: expected an array");for(let r of l)if(!r.username||!r.tag)throw new Error("Invalid tag format");let e=new Map(this.tagsMap());return l.forEach(r=>{e.set(r.username,l2(a2({},r),{createdAt:r.createdAt||Date.now(),updatedAt:r.updatedAt||Date.now(),color:r.color||this.getRandomColor()}))}),this.tagsMap.set(e),this.saveTags(),!0}catch(l){return console.error("Failed to import tags:",l),!1}}clearAllTags(){this.tagsMap.set(new Map),localStorage.removeItem(this.STORAGE_KEY)}static \u0275fac=function(l){return new(l||c)};static \u0275prov=$({token:c,factory:c.\u0275fac,providedIn:"root"})};function k2(c,a){(a==null||a>c.length)&&(a=c.length);for(var l=0,e=Array(a);l<a;l++)e[l]=c[l];return e}function a3(c){if(Array.isArray(c))return c}function l3(c){if(Array.isArray(c))return k2(c)}function e3(c,a){if(!(c instanceof a))throw new TypeError("Cannot call a class as a function")}function M1(c,a){for(var l=0;l<a.length;l++){var e=a[l];e.enumerable=e.enumerable||!1,e.configurable=!0,"value"in e&&(e.writable=!0),Object.defineProperty(c,_1(e.key),e)}}function r3(c,a,l){return a&&M1(c.prototype,a),l&&M1(c,l),Object.defineProperty(c,"prototype",{writable:!1}),c}function i2(c,a){var l=typeof Symbol<"u"&&c[Symbol.iterator]||c["@@iterator"];if(!l){if(Array.isArray(c)||(l=q2(c))||a&&c&&typeof c.length=="number"){l&&(c=l);var e=0,r=function(){};return{s:r,n:function(){return e>=c.length?{done:!0}:{done:!1,value:c[e++]}},e:function(n){throw n},f:r}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}var s,i=!0,f=!1;return{s:function(){l=l.call(c)},n:function(){var n=l.next();return i=n.done,n},e:function(n){f=!0,s=n},f:function(){try{i||l.return==null||l.return()}finally{if(f)throw s}}}}function L(c,a,l){return(a=_1(a))in c?Object.defineProperty(c,a,{value:l,enumerable:!0,configurable:!0,writable:!0}):c[a]=l,c}function s3(c){if(typeof Symbol<"u"&&c[Symbol.iterator]!=null||c["@@iterator"]!=null)return Array.from(c)}function i3(c,a){var l=c==null?null:typeof Symbol<"u"&&c[Symbol.iterator]||c["@@iterator"];if(l!=null){var e,r,s,i,f=[],n=!0,t=!1;try{if(s=(l=l.call(c)).next,a===0){if(Object(l)!==l)return;n=!1}else for(;!(n=(e=s.call(l)).done)&&(f.push(e.value),f.length!==a);n=!0);}catch(z){t=!0,r=z}finally{try{if(!n&&l.return!=null&&(i=l.return(),Object(i)!==i))return}finally{if(t)throw r}}return f}}function f3(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function n3(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function u1(c,a){var l=Object.keys(c);if(Object.getOwnPropertySymbols){var e=Object.getOwnPropertySymbols(c);a&&(e=e.filter(function(r){return Object.getOwnPropertyDescriptor(c,r).enumerable})),l.push.apply(l,e)}return l}function o(c){for(var a=1;a<arguments.length;a++){var l=arguments[a]!=null?arguments[a]:{};a%2?u1(Object(l),!0).forEach(function(e){L(c,e,l[e])}):Object.getOwnPropertyDescriptors?Object.defineProperties(c,Object.getOwnPropertyDescriptors(l)):u1(Object(l)).forEach(function(e){Object.defineProperty(c,e,Object.getOwnPropertyDescriptor(l,e))})}return c}function z2(c,a){return a3(c)||i3(c,a)||q2(c,a)||f3()}function k(c){return l3(c)||s3(c)||q2(c)||n3()}function o3(c,a){if(typeof c!="object"||!c)return c;var l=c[Symbol.toPrimitive];if(l!==void 0){var e=l.call(c,a||"default");if(typeof e!="object")return e;throw new TypeError("@@toPrimitive must return a primitive value.")}return(a==="string"?String:Number)(c)}function _1(c){var a=o3(c,"string");return typeof a=="symbol"?a:a+""}function o2(c){"@babel/helpers - typeof";return o2=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(a){return typeof a}:function(a){return a&&typeof Symbol=="function"&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},o2(c)}function q2(c,a){if(c){if(typeof c=="string")return k2(c,a);var l={}.toString.call(c).slice(8,-1);return l==="Object"&&c.constructor&&(l=c.constructor.name),l==="Map"||l==="Set"?Array.from(c):l==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(l)?k2(c,a):void 0}}var L1=function(){},G2={},$1={},X1=null,Y1={mark:L1,measure:L1};try{typeof window<"u"&&(G2=window),typeof document<"u"&&($1=document),typeof MutationObserver<"u"&&(X1=MutationObserver),typeof performance<"u"&&(Y1=performance)}catch{}var t3=G2.navigator||{},d1=t3.userAgent,v1=d1===void 0?"":d1,R=G2,v=$1,h1=X1,r2=Y1,x8=!!R.document,B=!!v.documentElement&&!!v.head&&typeof v.addEventListener=="function"&&typeof v.createElement=="function",K1=~v1.indexOf("MSIE")||~v1.indexOf("Trident/"),C2,m3=/fa(k|kd|s|r|l|t|d|dr|dl|dt|b|slr|slpr|wsb|tl|ns|nds|es|jr|jfr|jdr|cr|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/,z3=/Font ?Awesome ?([567 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit|Notdog Duo|Notdog|Chisel|Etch|Thumbprint|Jelly Fill|Jelly Duo|Jelly|Slab Press|Slab|Whiteboard)?.*/i,Q1={classic:{fa:"solid",fas:"solid","fa-solid":"solid",far:"regular","fa-regular":"regular",fal:"light","fa-light":"light",fat:"thin","fa-thin":"thin",fab:"brands","fa-brands":"brands"},duotone:{fa:"solid",fad:"solid","fa-solid":"solid","fa-duotone":"solid",fadr:"regular","fa-regular":"regular",fadl:"light","fa-light":"light",fadt:"thin","fa-thin":"thin"},sharp:{fa:"solid",fass:"solid","fa-solid":"solid",fasr:"regular","fa-regular":"regular",fasl:"light","fa-light":"light",fast:"thin","fa-thin":"thin"},"sharp-duotone":{fa:"solid",fasds:"solid","fa-solid":"solid",fasdr:"regular","fa-regular":"regular",fasdl:"light","fa-light":"light",fasdt:"thin","fa-thin":"thin"},slab:{"fa-regular":"regular",faslr:"regular"},"slab-press":{"fa-regular":"regular",faslpr:"regular"},thumbprint:{"fa-light":"light",fatl:"light"},whiteboard:{"fa-semibold":"semibold",fawsb:"semibold"},notdog:{"fa-solid":"solid",fans:"solid"},"notdog-duo":{"fa-solid":"solid",fands:"solid"},etch:{"fa-solid":"solid",faes:"solid"},jelly:{"fa-regular":"regular",fajr:"regular"},"jelly-fill":{"fa-regular":"regular",fajfr:"regular"},"jelly-duo":{"fa-regular":"regular",fajdr:"regular"},chisel:{"fa-regular":"regular",facr:"regular"}},p3={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},J1=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press"],C="classic",J="duotone",Z1="sharp",c4="sharp-duotone",a4="chisel",l4="etch",e4="jelly",r4="jelly-duo",s4="jelly-fill",i4="notdog",f4="notdog-duo",n4="slab",o4="slab-press",t4="thumbprint",m4="whiteboard",M3="Classic",u3="Duotone",L3="Sharp",d3="Sharp Duotone",v3="Chisel",h3="Etch",g3="Jelly",C3="Jelly Duo",x3="Jelly Fill",S3="Notdog",N3="Notdog Duo",b3="Slab",y3="Slab Press",w3="Thumbprint",k3="Whiteboard",z4=[C,J,Z1,c4,a4,l4,e4,r4,s4,i4,f4,n4,o4,t4,m4],S8=(C2={},L(L(L(L(L(L(L(L(L(L(C2,C,M3),J,u3),Z1,L3),c4,d3),a4,v3),l4,h3),e4,g3),r4,C3),s4,x3),i4,S3),L(L(L(L(L(C2,f4,N3),n4,b3),o4,y3),t4,w3),m4,k3)),A3={classic:{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},duotone:{900:"fad",400:"fadr",300:"fadl",100:"fadt"},sharp:{900:"fass",400:"fasr",300:"fasl",100:"fast"},"sharp-duotone":{900:"fasds",400:"fasdr",300:"fasdl",100:"fasdt"},slab:{400:"faslr"},"slab-press":{400:"faslpr"},whiteboard:{600:"fawsb"},thumbprint:{300:"fatl"},notdog:{900:"fans"},"notdog-duo":{900:"fands"},etch:{900:"faes"},chisel:{400:"facr"},jelly:{400:"fajr"},"jelly-fill":{400:"fajfr"},"jelly-duo":{400:"fajdr"}},P3={"Font Awesome 7 Free":{900:"fas",400:"far"},"Font Awesome 7 Pro":{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},"Font Awesome 7 Brands":{400:"fab",normal:"fab"},"Font Awesome 7 Duotone":{900:"fad",400:"fadr",normal:"fadr",300:"fadl",100:"fadt"},"Font Awesome 7 Sharp":{900:"fass",400:"fasr",normal:"fasr",300:"fasl",100:"fast"},"Font Awesome 7 Sharp Duotone":{900:"fasds",400:"fasdr",normal:"fasdr",300:"fasdl",100:"fasdt"},"Font Awesome 7 Jelly":{400:"fajr",normal:"fajr"},"Font Awesome 7 Jelly Fill":{400:"fajfr",normal:"fajfr"},"Font Awesome 7 Jelly Duo":{400:"fajdr",normal:"fajdr"},"Font Awesome 7 Slab":{400:"faslr",normal:"faslr"},"Font Awesome 7 Slab Press":{400:"faslpr",normal:"faslpr"},"Font Awesome 7 Thumbprint":{300:"fatl",normal:"fatl"},"Font Awesome 7 Notdog":{900:"fans",normal:"fans"},"Font Awesome 7 Notdog Duo":{900:"fands",normal:"fands"},"Font Awesome 7 Etch":{900:"faes",normal:"faes"},"Font Awesome 7 Chisel":{400:"facr",normal:"facr"},"Font Awesome 7 Whiteboard":{600:"fawsb",normal:"fawsb"}},T3=new Map([["classic",{defaultShortPrefixId:"fas",defaultStyleId:"solid",styleIds:["solid","regular","light","thin","brands"],futureStyleIds:[],defaultFontWeight:900}],["duotone",{defaultShortPrefixId:"fad",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp",{defaultShortPrefixId:"fass",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp-duotone",{defaultShortPrefixId:"fasds",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["chisel",{defaultShortPrefixId:"facr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["etch",{defaultShortPrefixId:"faes",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["jelly",{defaultShortPrefixId:"fajr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-duo",{defaultShortPrefixId:"fajdr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-fill",{defaultShortPrefixId:"fajfr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["notdog",{defaultShortPrefixId:"fans",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["notdog-duo",{defaultShortPrefixId:"fands",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["slab",{defaultShortPrefixId:"faslr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab-press",{defaultShortPrefixId:"faslpr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["thumbprint",{defaultShortPrefixId:"fatl",defaultStyleId:"light",styleIds:["light"],futureStyleIds:[],defaultFontWeight:300}],["whiteboard",{defaultShortPrefixId:"fawsb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}]]),F3={chisel:{regular:"facr"},classic:{brands:"fab",light:"fal",regular:"far",solid:"fas",thin:"fat"},duotone:{light:"fadl",regular:"fadr",solid:"fad",thin:"fadt"},etch:{solid:"faes"},jelly:{regular:"fajr"},"jelly-duo":{regular:"fajdr"},"jelly-fill":{regular:"fajfr"},notdog:{solid:"fans"},"notdog-duo":{solid:"fands"},sharp:{light:"fasl",regular:"fasr",solid:"fass",thin:"fast"},"sharp-duotone":{light:"fasdl",regular:"fasdr",solid:"fasds",thin:"fasdt"},slab:{regular:"faslr"},"slab-press":{regular:"faslpr"},thumbprint:{light:"fatl"},whiteboard:{semibold:"fawsb"}},p4=["fak","fa-kit","fakd","fa-kit-duotone"],g1={kit:{fak:"kit","fa-kit":"kit"},"kit-duotone":{fakd:"kit-duotone","fa-kit-duotone":"kit-duotone"}},B3=["kit"],D3="kit",R3="kit-duotone",H3="Kit",E3="Kit Duotone",N8=L(L({},D3,H3),R3,E3),U3={kit:{"fa-kit":"fak"},"kit-duotone":{"fa-kit-duotone":"fakd"}},I3={"Font Awesome Kit":{400:"fak",normal:"fak"},"Font Awesome Kit Duotone":{400:"fakd",normal:"fakd"}},O3={kit:{fak:"fa-kit"},"kit-duotone":{fakd:"fa-kit-duotone"}},C1={kit:{kit:"fak"},"kit-duotone":{"kit-duotone":"fakd"}},x2,s2={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},W3=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press"],q3="classic",G3="duotone",j3="sharp",V3="sharp-duotone",_3="chisel",$3="etch",X3="jelly",Y3="jelly-duo",K3="jelly-fill",Q3="notdog",J3="notdog-duo",Z3="slab",c0="slab-press",a0="thumbprint",l0="whiteboard",e0="Classic",r0="Duotone",s0="Sharp",i0="Sharp Duotone",f0="Chisel",n0="Etch",o0="Jelly",t0="Jelly Duo",m0="Jelly Fill",z0="Notdog",p0="Notdog Duo",M0="Slab",u0="Slab Press",L0="Thumbprint",d0="Whiteboard",b8=(x2={},L(L(L(L(L(L(L(L(L(L(x2,q3,e0),G3,r0),j3,s0),V3,i0),_3,f0),$3,n0),X3,o0),Y3,t0),K3,m0),Q3,z0),L(L(L(L(L(x2,J3,p0),Z3,M0),c0,u0),a0,L0),l0,d0)),v0="kit",h0="kit-duotone",g0="Kit",C0="Kit Duotone",y8=L(L({},v0,g0),h0,C0),x0={classic:{"fa-brands":"fab","fa-duotone":"fad","fa-light":"fal","fa-regular":"far","fa-solid":"fas","fa-thin":"fat"},duotone:{"fa-regular":"fadr","fa-light":"fadl","fa-thin":"fadt"},sharp:{"fa-solid":"fass","fa-regular":"fasr","fa-light":"fasl","fa-thin":"fast"},"sharp-duotone":{"fa-solid":"fasds","fa-regular":"fasdr","fa-light":"fasdl","fa-thin":"fasdt"},slab:{"fa-regular":"faslr"},"slab-press":{"fa-regular":"faslpr"},whiteboard:{"fa-semibold":"fawsb"},thumbprint:{"fa-light":"fatl"},notdog:{"fa-solid":"fans"},"notdog-duo":{"fa-solid":"fands"},etch:{"fa-solid":"faes"},jelly:{"fa-regular":"fajr"},"jelly-fill":{"fa-regular":"fajfr"},"jelly-duo":{"fa-regular":"fajdr"},chisel:{"fa-regular":"facr"}},S0={classic:["fas","far","fal","fat","fad"],duotone:["fadr","fadl","fadt"],sharp:["fass","fasr","fasl","fast"],"sharp-duotone":["fasds","fasdr","fasdl","fasdt"],slab:["faslr"],"slab-press":["faslpr"],whiteboard:["fawsb"],thumbprint:["fatl"],notdog:["fans"],"notdog-duo":["fands"],etch:["faes"],jelly:["fajr"],"jelly-fill":["fajfr"],"jelly-duo":["fajdr"],chisel:["facr"]},A2={classic:{fab:"fa-brands",fad:"fa-duotone",fal:"fa-light",far:"fa-regular",fas:"fa-solid",fat:"fa-thin"},duotone:{fadr:"fa-regular",fadl:"fa-light",fadt:"fa-thin"},sharp:{fass:"fa-solid",fasr:"fa-regular",fasl:"fa-light",fast:"fa-thin"},"sharp-duotone":{fasds:"fa-solid",fasdr:"fa-regular",fasdl:"fa-light",fasdt:"fa-thin"},slab:{faslr:"fa-regular"},"slab-press":{faslpr:"fa-regular"},whiteboard:{fawsb:"fa-semibold"},thumbprint:{fatl:"fa-light"},notdog:{fans:"fa-solid"},"notdog-duo":{fands:"fa-solid"},etch:{faes:"fa-solid"},jelly:{fajr:"fa-regular"},"jelly-fill":{fajfr:"fa-regular"},"jelly-duo":{fajdr:"fa-regular"},chisel:{facr:"fa-regular"}},N0=["fa-solid","fa-regular","fa-light","fa-thin","fa-duotone","fa-brands","fa-semibold"],M4=["fa","fas","far","fal","fat","fad","fadr","fadl","fadt","fab","fass","fasr","fasl","fast","fasds","fasdr","fasdl","fasdt","faslr","faslpr","fawsb","fatl","fans","fands","faes","fajr","fajfr","fajdr","facr"].concat(W3,N0),b0=["solid","regular","light","thin","duotone","brands","semibold"],u4=[1,2,3,4,5,6,7,8,9,10],y0=u4.concat([11,12,13,14,15,16,17,18,19,20]),w0=["aw","fw","pull-left","pull-right"],k0=[].concat(k(Object.keys(S0)),b0,w0,["2xs","xs","sm","lg","xl","2xl","beat","border","fade","beat-fade","bounce","flip-both","flip-horizontal","flip-vertical","flip","inverse","layers","layers-bottom-left","layers-bottom-right","layers-counter","layers-text","layers-top-left","layers-top-right","li","pull-end","pull-start","pulse","rotate-180","rotate-270","rotate-90","rotate-by","shake","spin-pulse","spin-reverse","spin","stack-1x","stack-2x","stack","ul","width-auto","width-fixed",s2.GROUP,s2.SWAP_OPACITY,s2.PRIMARY,s2.SECONDARY]).concat(u4.map(function(c){return"".concat(c,"x")})).concat(y0.map(function(c){return"w-".concat(c)})),A0={"Font Awesome 5 Free":{900:"fas",400:"far"},"Font Awesome 5 Pro":{900:"fas",400:"far",normal:"far",300:"fal"},"Font Awesome 5 Brands":{400:"fab",normal:"fab"},"Font Awesome 5 Duotone":{900:"fad"}},T="___FONT_AWESOME___",P2=16,L4="fa",d4="svg-inline--fa",O="data-fa-i2svg",T2="data-fa-pseudo-element",P0="data-fa-pseudo-element-pending",j2="data-prefix",V2="data-icon",x1="fontawesome-i2svg",T0="async",F0=["HTML","HEAD","STYLE","SCRIPT"],v4=["::before","::after",":before",":after"],h4=function(){try{return!0}catch{return!1}}();function Z(c){return new Proxy(c,{get:function(l,e){return e in l?l[e]:l[C]}})}var g4=o({},Q1);g4[C]=o(o(o(o({},{"fa-duotone":"duotone"}),Q1[C]),g1.kit),g1["kit-duotone"]);var B0=Z(g4),F2=o({},F3);F2[C]=o(o(o(o({},{duotone:"fad"}),F2[C]),C1.kit),C1["kit-duotone"]);var S1=Z(F2),B2=o({},A2);B2[C]=o(o({},B2[C]),O3.kit);var C4=Z(B2),D2=o({},x0);D2[C]=o(o({},D2[C]),U3.kit);var w8=Z(D2),D0=m3,x4="fa-layers-text",R0=z3,H0=o({},A3),k8=Z(H0),E0=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],S2=p3,U0=[].concat(k(B3),k(k0)),Y=R.FontAwesomeConfig||{};function I0(c){var a=v.querySelector("script["+c+"]");if(a)return a.getAttribute(c)}function O0(c){return c===""?!0:c==="false"?!1:c==="true"?!0:c}v&&typeof v.querySelector=="function"&&(N1=[["data-family-prefix","familyPrefix"],["data-css-prefix","cssPrefix"],["data-family-default","familyDefault"],["data-style-default","styleDefault"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-search-pseudo-elements","searchPseudoElements"],["data-search-pseudo-elements-warnings","searchPseudoElementsWarnings"],["data-search-pseudo-elements-full-scan","searchPseudoElementsFullScan"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]],N1.forEach(function(c){var a=z2(c,2),l=a[0],e=a[1],r=O0(I0(l));r!=null&&(Y[e]=r)}));var N1,S4={styleDefault:"solid",familyDefault:C,cssPrefix:L4,replacementClass:d4,autoReplaceSvg:!0,autoAddCss:!0,searchPseudoElements:!1,searchPseudoElementsWarnings:!0,searchPseudoElementsFullScan:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0};Y.familyPrefix&&(Y.cssPrefix=Y.familyPrefix);var V=o(o({},S4),Y);V.autoReplaceSvg||(V.observeMutations=!1);var p={};Object.keys(S4).forEach(function(c){Object.defineProperty(p,c,{enumerable:!0,set:function(l){V[c]=l,K.forEach(function(e){return e(p)})},get:function(){return V[c]}})});Object.defineProperty(p,"familyPrefix",{enumerable:!0,set:function(a){V.cssPrefix=a,K.forEach(function(l){return l(p)})},get:function(){return V.cssPrefix}});R.FontAwesomeConfig=p;var K=[];function W0(c){return K.push(c),function(){K.splice(K.indexOf(c),1)}}var D=P2,A={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function q0(c){if(!(!c||!B)){var a=v.createElement("style");a.setAttribute("type","text/css"),a.innerHTML=c;for(var l=v.head.childNodes,e=null,r=l.length-1;r>-1;r--){var s=l[r],i=(s.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(i)>-1&&(e=s)}return v.head.insertBefore(a,e),c}}var G0="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function b1(){for(var c=12,a="";c-- >0;)a+=G0[Math.random()*62|0];return a}function _(c){for(var a=[],l=(c||[]).length>>>0;l--;)a[l]=c[l];return a}function _2(c){return c.classList?_(c.classList):(c.getAttribute("class")||"").split(" ").filter(function(a){return a})}function N4(c){return"".concat(c).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function j0(c){return Object.keys(c||{}).reduce(function(a,l){return a+"".concat(l,'="').concat(N4(c[l]),'" ')},"").trim()}function p2(c){return Object.keys(c||{}).reduce(function(a,l){return a+"".concat(l,": ").concat(c[l].trim(),";")},"")}function $2(c){return c.size!==A.size||c.x!==A.x||c.y!==A.y||c.rotate!==A.rotate||c.flipX||c.flipY}function V0(c){var a=c.transform,l=c.containerWidth,e=c.iconWidth,r={transform:"translate(".concat(l/2," 256)")},s="translate(".concat(a.x*32,", ").concat(a.y*32,") "),i="scale(".concat(a.size/16*(a.flipX?-1:1),", ").concat(a.size/16*(a.flipY?-1:1),") "),f="rotate(".concat(a.rotate," 0 0)"),n={transform:"".concat(s," ").concat(i," ").concat(f)},t={transform:"translate(".concat(e/2*-1," -256)")};return{outer:r,inner:n,path:t}}function _0(c){var a=c.transform,l=c.width,e=l===void 0?P2:l,r=c.height,s=r===void 0?P2:r,i=c.startCentered,f=i===void 0?!1:i,n="";return f&&K1?n+="translate(".concat(a.x/D-e/2,"em, ").concat(a.y/D-s/2,"em) "):f?n+="translate(calc(-50% + ".concat(a.x/D,"em), calc(-50% + ").concat(a.y/D,"em)) "):n+="translate(".concat(a.x/D,"em, ").concat(a.y/D,"em) "),n+="scale(".concat(a.size/D*(a.flipX?-1:1),", ").concat(a.size/D*(a.flipY?-1:1),") "),n+="rotate(".concat(a.rotate,"deg) "),n}var $0=`:root, :host {
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
}`;function b4(){var c=L4,a=d4,l=p.cssPrefix,e=p.replacementClass,r=$0;if(l!==c||e!==a){var s=new RegExp("\\.".concat(c,"\\-"),"g"),i=new RegExp("\\--".concat(c,"\\-"),"g"),f=new RegExp("\\.".concat(a),"g");r=r.replace(s,".".concat(l,"-")).replace(i,"--".concat(l,"-")).replace(f,".".concat(e))}return r}var y1=!1;function N2(){p.autoAddCss&&!y1&&(q0(b4()),y1=!0)}var X0={mixout:function(){return{dom:{css:b4,insertCss:N2}}},hooks:function(){return{beforeDOMElementCreation:function(){N2()},beforeI2svg:function(){N2()}}}},F=R||{};F[T]||(F[T]={});F[T].styles||(F[T].styles={});F[T].hooks||(F[T].hooks={});F[T].shims||(F[T].shims=[]);var w=F[T],y4=[],w4=function(){v.removeEventListener("DOMContentLoaded",w4),t2=1,y4.map(function(a){return a()})},t2=!1;B&&(t2=(v.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(v.readyState),t2||v.addEventListener("DOMContentLoaded",w4));function Y0(c){B&&(t2?setTimeout(c,0):y4.push(c))}function c2(c){var a=c.tag,l=c.attributes,e=l===void 0?{}:l,r=c.children,s=r===void 0?[]:r;return typeof c=="string"?N4(c):"<".concat(a," ").concat(j0(e),">").concat(s.map(c2).join(""),"</").concat(a,">")}function w1(c,a,l){if(c&&c[a]&&c[a][l])return{prefix:a,iconName:l,icon:c[a][l]}}var K0=function(a,l){return function(e,r,s,i){return a.call(l,e,r,s,i)}},b2=function(a,l,e,r){var s=Object.keys(a),i=s.length,f=r!==void 0?K0(l,r):l,n,t,z;for(e===void 0?(n=1,z=a[s[0]]):(n=0,z=e);n<i;n++)t=s[n],z=f(z,a[t],t,a);return z};function k4(c){return k(c).length!==1?null:c.codePointAt(0).toString(16)}function k1(c){return Object.keys(c).reduce(function(a,l){var e=c[l],r=!!e.icon;return r?a[e.iconName]=e.icon:a[l]=e,a},{})}function A4(c,a){var l=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},e=l.skipHooks,r=e===void 0?!1:e,s=k1(a);typeof w.hooks.addPack=="function"&&!r?w.hooks.addPack(c,k1(a)):w.styles[c]=o(o({},w.styles[c]||{}),s),c==="fas"&&A4("fa",a)}var Q=w.styles,Q0=w.shims,P4=Object.keys(C4),J0=P4.reduce(function(c,a){return c[a]=Object.keys(C4[a]),c},{}),X2=null,T4={},F4={},B4={},D4={},R4={};function Z0(c){return~U0.indexOf(c)}function c6(c,a){var l=a.split("-"),e=l[0],r=l.slice(1).join("-");return e===c&&r!==""&&!Z0(r)?r:null}var H4=function(){var a=function(s){return b2(Q,function(i,f,n){return i[n]=b2(f,s,{}),i},{})};T4=a(function(r,s,i){if(s[3]&&(r[s[3]]=i),s[2]){var f=s[2].filter(function(n){return typeof n=="number"});f.forEach(function(n){r[n.toString(16)]=i})}return r}),F4=a(function(r,s,i){if(r[i]=i,s[2]){var f=s[2].filter(function(n){return typeof n=="string"});f.forEach(function(n){r[n]=i})}return r}),R4=a(function(r,s,i){var f=s[2];return r[i]=i,f.forEach(function(n){r[n]=i}),r});var l="far"in Q||p.autoFetchSvg,e=b2(Q0,function(r,s){var i=s[0],f=s[1],n=s[2];return f==="far"&&!l&&(f="fas"),typeof i=="string"&&(r.names[i]={prefix:f,iconName:n}),typeof i=="number"&&(r.unicodes[i.toString(16)]={prefix:f,iconName:n}),r},{names:{},unicodes:{}});B4=e.names,D4=e.unicodes,X2=M2(p.styleDefault,{family:p.familyDefault})};W0(function(c){X2=M2(c.styleDefault,{family:p.familyDefault})});H4();function Y2(c,a){return(T4[c]||{})[a]}function a6(c,a){return(F4[c]||{})[a]}function I(c,a){return(R4[c]||{})[a]}function E4(c){return B4[c]||{prefix:null,iconName:null}}function l6(c){var a=D4[c],l=Y2("fas",c);return a||(l?{prefix:"fas",iconName:l}:null)||{prefix:null,iconName:null}}function H(){return X2}var U4=function(){return{prefix:null,iconName:null,rest:[]}};function e6(c){var a=C,l=P4.reduce(function(e,r){return e[r]="".concat(p.cssPrefix,"-").concat(r),e},{});return z4.forEach(function(e){(c.includes(l[e])||c.some(function(r){return J0[e].includes(r)}))&&(a=e)}),a}function M2(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=a.family,e=l===void 0?C:l,r=B0[e][c];if(e===J&&!c)return"fad";var s=S1[e][c]||S1[e][r],i=c in w.styles?c:null,f=s||i||null;return f}function r6(c){var a=[],l=null;return c.forEach(function(e){var r=c6(p.cssPrefix,e);r?l=r:e&&a.push(e)}),{iconName:l,rest:a}}function A1(c){return c.sort().filter(function(a,l,e){return e.indexOf(a)===l})}var P1=M4.concat(p4);function u2(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=a.skipLookups,e=l===void 0?!1:l,r=null,s=A1(c.filter(function(M){return P1.includes(M)})),i=A1(c.filter(function(M){return!P1.includes(M)})),f=s.filter(function(M){return r=M,!J1.includes(M)}),n=z2(f,1),t=n[0],z=t===void 0?null:t,m=e6(s),u=o(o({},r6(i)),{},{prefix:M2(z,{family:m})});return o(o(o({},u),n6({values:c,family:m,styles:Q,config:p,canonical:u,givenPrefix:r})),s6(e,r,u))}function s6(c,a,l){var e=l.prefix,r=l.iconName;if(c||!e||!r)return{prefix:e,iconName:r};var s=a==="fa"?E4(r):{},i=I(e,r);return r=s.iconName||i||r,e=s.prefix||e,e==="far"&&!Q.far&&Q.fas&&!p.autoFetchSvg&&(e="fas"),{prefix:e,iconName:r}}var i6=z4.filter(function(c){return c!==C||c!==J}),f6=Object.keys(A2).filter(function(c){return c!==C}).map(function(c){return Object.keys(A2[c])}).flat();function n6(c){var a=c.values,l=c.family,e=c.canonical,r=c.givenPrefix,s=r===void 0?"":r,i=c.styles,f=i===void 0?{}:i,n=c.config,t=n===void 0?{}:n,z=l===J,m=a.includes("fa-duotone")||a.includes("fad"),u=t.familyDefault==="duotone",M=e.prefix==="fad"||e.prefix==="fa-duotone";if(!z&&(m||u||M)&&(e.prefix="fad"),(a.includes("fa-brands")||a.includes("fab"))&&(e.prefix="fab"),!e.prefix&&i6.includes(l)){var h=Object.keys(f).find(function(x){return f6.includes(x)});if(h||t.autoFetchSvg){var d=T3.get(l).defaultShortPrefixId;e.prefix=d,e.iconName=I(e.prefix,e.iconName)||e.iconName}}return(e.prefix==="fa"||s==="fa")&&(e.prefix=H()||"fas"),e}var o6=function(){function c(){e3(this,c),this.definitions={}}return r3(c,[{key:"add",value:function(){for(var l=this,e=arguments.length,r=new Array(e),s=0;s<e;s++)r[s]=arguments[s];var i=r.reduce(this._pullDefinitions,{});Object.keys(i).forEach(function(f){l.definitions[f]=o(o({},l.definitions[f]||{}),i[f]),A4(f,i[f]),H4()})}},{key:"reset",value:function(){this.definitions={}}},{key:"_pullDefinitions",value:function(l,e){var r=e.prefix&&e.iconName&&e.icon?{0:e}:e;return Object.keys(r).map(function(s){var i=r[s],f=i.prefix,n=i.iconName,t=i.icon,z=t[2];l[f]||(l[f]={}),z.length>0&&z.forEach(function(m){typeof m=="string"&&(l[f][m]=t)}),l[f][n]=t}),l}}])}(),T1=[],G={},j={},t6=Object.keys(j);function m6(c,a){var l=a.mixoutsTo;return T1=c,G={},Object.keys(j).forEach(function(e){t6.indexOf(e)===-1&&delete j[e]}),T1.forEach(function(e){var r=e.mixout?e.mixout():{};if(Object.keys(r).forEach(function(i){typeof r[i]=="function"&&(l[i]=r[i]),o2(r[i])==="object"&&Object.keys(r[i]).forEach(function(f){l[i]||(l[i]={}),l[i][f]=r[i][f]})}),e.hooks){var s=e.hooks();Object.keys(s).forEach(function(i){G[i]||(G[i]=[]),G[i].push(s[i])})}e.provides&&e.provides(j)}),l}function R2(c,a){for(var l=arguments.length,e=new Array(l>2?l-2:0),r=2;r<l;r++)e[r-2]=arguments[r];var s=G[c]||[];return s.forEach(function(i){a=i.apply(null,[a].concat(e))}),a}function W(c){for(var a=arguments.length,l=new Array(a>1?a-1:0),e=1;e<a;e++)l[e-1]=arguments[e];var r=G[c]||[];r.forEach(function(s){s.apply(null,l)})}function E(){var c=arguments[0],a=Array.prototype.slice.call(arguments,1);return j[c]?j[c].apply(null,a):void 0}function H2(c){c.prefix==="fa"&&(c.prefix="fas");var a=c.iconName,l=c.prefix||H();if(a)return a=I(l,a)||a,w1(I4.definitions,l,a)||w1(w.styles,l,a)}var I4=new o6,z6=function(){p.autoReplaceSvg=!1,p.observeMutations=!1,W("noAuto")},p6={i2svg:function(){var a=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return B?(W("beforeI2svg",a),E("pseudoElements2svg",a),E("i2svg",a)):Promise.reject(new Error("Operation requires a DOM of some kind."))},watch:function(){var a=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},l=a.autoReplaceSvgRoot;p.autoReplaceSvg===!1&&(p.autoReplaceSvg=!0),p.observeMutations=!0,Y0(function(){u6({autoReplaceSvgRoot:l}),W("watch",a)})}},M6={icon:function(a){if(a===null)return null;if(o2(a)==="object"&&a.prefix&&a.iconName)return{prefix:a.prefix,iconName:I(a.prefix,a.iconName)||a.iconName};if(Array.isArray(a)&&a.length===2){var l=a[1].indexOf("fa-")===0?a[1].slice(3):a[1],e=M2(a[0]);return{prefix:e,iconName:I(e,l)||l}}if(typeof a=="string"&&(a.indexOf("".concat(p.cssPrefix,"-"))>-1||a.match(D0))){var r=u2(a.split(" "),{skipLookups:!0});return{prefix:r.prefix||H(),iconName:I(r.prefix,r.iconName)||r.iconName}}if(typeof a=="string"){var s=H();return{prefix:s,iconName:I(s,a)||a}}}},b={noAuto:z6,config:p,dom:p6,parse:M6,library:I4,findIconDefinition:H2,toHtml:c2},u6=function(){var a=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},l=a.autoReplaceSvgRoot,e=l===void 0?v:l;(Object.keys(w.styles).length>0||p.autoFetchSvg)&&B&&p.autoReplaceSvg&&b.dom.i2svg({node:e})};function L2(c,a){return Object.defineProperty(c,"abstract",{get:a}),Object.defineProperty(c,"html",{get:function(){return c.abstract.map(function(e){return c2(e)})}}),Object.defineProperty(c,"node",{get:function(){if(B){var e=v.createElement("div");return e.innerHTML=c.html,e.children}}}),c}function L6(c){var a=c.children,l=c.main,e=c.mask,r=c.attributes,s=c.styles,i=c.transform;if($2(i)&&l.found&&!e.found){var f=l.width,n=l.height,t={x:f/n/2,y:.5};r.style=p2(o(o({},s),{},{"transform-origin":"".concat(t.x+i.x/16,"em ").concat(t.y+i.y/16,"em")}))}return[{tag:"svg",attributes:r,children:a}]}function d6(c){var a=c.prefix,l=c.iconName,e=c.children,r=c.attributes,s=c.symbol,i=s===!0?"".concat(a,"-").concat(p.cssPrefix,"-").concat(l):s;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:o(o({},r),{},{id:i}),children:e}]}]}function v6(c){var a=["aria-label","aria-labelledby","title","role"];return a.some(function(l){return l in c})}function K2(c){var a=c.icons,l=a.main,e=a.mask,r=c.prefix,s=c.iconName,i=c.transform,f=c.symbol,n=c.maskId,t=c.extra,z=c.watchable,m=z===void 0?!1:z,u=e.found?e:l,M=u.width,h=u.height,d=[p.replacementClass,s?"".concat(p.cssPrefix,"-").concat(s):""].filter(function(P){return t.classes.indexOf(P)===-1}).filter(function(P){return P!==""||!!P}).concat(t.classes).join(" "),x={children:[],attributes:o(o({},t.attributes),{},{"data-prefix":r,"data-icon":s,class:d,role:t.attributes.role||"img",viewBox:"0 0 ".concat(M," ").concat(h)})};!v6(t.attributes)&&!t.attributes["aria-hidden"]&&(x.attributes["aria-hidden"]="true"),m&&(x.attributes[O]="");var g=o(o({},x),{},{prefix:r,iconName:s,main:l,mask:e,maskId:n,transform:i,symbol:f,styles:o({},t.styles)}),N=e.found&&l.found?E("generateAbstractMask",g)||{children:[],attributes:{}}:E("generateAbstractIcon",g)||{children:[],attributes:{}},y=N.children,q=N.attributes;return g.children=y,g.attributes=q,f?d6(g):L6(g)}function F1(c){var a=c.content,l=c.width,e=c.height,r=c.transform,s=c.extra,i=c.watchable,f=i===void 0?!1:i,n=o(o({},s.attributes),{},{class:s.classes.join(" ")});f&&(n[O]="");var t=o({},s.styles);$2(r)&&(t.transform=_0({transform:r,startCentered:!0,width:l,height:e}),t["-webkit-transform"]=t.transform);var z=p2(t);z.length>0&&(n.style=z);var m=[];return m.push({tag:"span",attributes:n,children:[a]}),m}function h6(c){var a=c.content,l=c.extra,e=o(o({},l.attributes),{},{class:l.classes.join(" ")}),r=p2(l.styles);r.length>0&&(e.style=r);var s=[];return s.push({tag:"span",attributes:e,children:[a]}),s}var y2=w.styles;function E2(c){var a=c[0],l=c[1],e=c.slice(4),r=z2(e,1),s=r[0],i=null;return Array.isArray(s)?i={tag:"g",attributes:{class:"".concat(p.cssPrefix,"-").concat(S2.GROUP)},children:[{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(S2.SECONDARY),fill:"currentColor",d:s[0]}},{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(S2.PRIMARY),fill:"currentColor",d:s[1]}}]}:i={tag:"path",attributes:{fill:"currentColor",d:s}},{found:!0,width:a,height:l,icon:i}}var g6={found:!1,width:512,height:512};function C6(c,a){!h4&&!p.showMissingIcons&&c&&console.error('Icon with name "'.concat(c,'" and prefix "').concat(a,'" is missing.'))}function U2(c,a){var l=a;return a==="fa"&&p.styleDefault!==null&&(a=H()),new Promise(function(e,r){if(l==="fa"){var s=E4(c)||{};c=s.iconName||c,a=s.prefix||a}if(c&&a&&y2[a]&&y2[a][c]){var i=y2[a][c];return e(E2(i))}C6(c,a),e(o(o({},g6),{},{icon:p.showMissingIcons&&c?E("missingIconAbstract")||{}:{}}))})}var B1=function(){},I2=p.measurePerformance&&r2&&r2.mark&&r2.measure?r2:{mark:B1,measure:B1},X='FA "7.0.0"',x6=function(a){return I2.mark("".concat(X," ").concat(a," begins")),function(){return O4(a)}},O4=function(a){I2.mark("".concat(X," ").concat(a," ends")),I2.measure("".concat(X," ").concat(a),"".concat(X," ").concat(a," begins"),"".concat(X," ").concat(a," ends"))},Q2={begin:x6,end:O4},f2=function(){};function D1(c){var a=c.getAttribute?c.getAttribute(O):null;return typeof a=="string"}function S6(c){var a=c.getAttribute?c.getAttribute(j2):null,l=c.getAttribute?c.getAttribute(V2):null;return a&&l}function N6(c){return c&&c.classList&&c.classList.contains&&c.classList.contains(p.replacementClass)}function b6(){if(p.autoReplaceSvg===!0)return n2.replace;var c=n2[p.autoReplaceSvg];return c||n2.replace}function y6(c){return v.createElementNS("http://www.w3.org/2000/svg",c)}function w6(c){return v.createElement(c)}function W4(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=a.ceFn,e=l===void 0?c.tag==="svg"?y6:w6:l;if(typeof c=="string")return v.createTextNode(c);var r=e(c.tag);Object.keys(c.attributes||[]).forEach(function(i){r.setAttribute(i,c.attributes[i])});var s=c.children||[];return s.forEach(function(i){r.appendChild(W4(i,{ceFn:e}))}),r}function k6(c){var a=" ".concat(c.outerHTML," ");return a="".concat(a,"Font Awesome fontawesome.com "),a}var n2={replace:function(a){var l=a[0];if(l.parentNode)if(a[1].forEach(function(r){l.parentNode.insertBefore(W4(r),l)}),l.getAttribute(O)===null&&p.keepOriginalSource){var e=v.createComment(k6(l));l.parentNode.replaceChild(e,l)}else l.remove()},nest:function(a){var l=a[0],e=a[1];if(~_2(l).indexOf(p.replacementClass))return n2.replace(a);var r=new RegExp("".concat(p.cssPrefix,"-.*"));if(delete e[0].attributes.id,e[0].attributes.class){var s=e[0].attributes.class.split(" ").reduce(function(f,n){return n===p.replacementClass||n.match(r)?f.toSvg.push(n):f.toNode.push(n),f},{toNode:[],toSvg:[]});e[0].attributes.class=s.toSvg.join(" "),s.toNode.length===0?l.removeAttribute("class"):l.setAttribute("class",s.toNode.join(" "))}var i=e.map(function(f){return c2(f)}).join(`
`);l.setAttribute(O,""),l.innerHTML=i}};function R1(c){c()}function q4(c,a){var l=typeof a=="function"?a:f2;if(c.length===0)l();else{var e=R1;p.mutateApproach===T0&&(e=R.requestAnimationFrame||R1),e(function(){var r=b6(),s=Q2.begin("mutate");c.map(r),s(),l()})}}var J2=!1;function G4(){J2=!0}function O2(){J2=!1}var m2=null;function H1(c){if(h1&&p.observeMutations){var a=c.treeCallback,l=a===void 0?f2:a,e=c.nodeCallback,r=e===void 0?f2:e,s=c.pseudoElementsCallback,i=s===void 0?f2:s,f=c.observeMutationsRoot,n=f===void 0?v:f;m2=new h1(function(t){if(!J2){var z=H();_(t).forEach(function(m){if(m.type==="childList"&&m.addedNodes.length>0&&!D1(m.addedNodes[0])&&(p.searchPseudoElements&&i(m.target),l(m.target)),m.type==="attributes"&&m.target.parentNode&&p.searchPseudoElements&&i([m.target],!0),m.type==="attributes"&&D1(m.target)&&~E0.indexOf(m.attributeName))if(m.attributeName==="class"&&S6(m.target)){var u=u2(_2(m.target)),M=u.prefix,h=u.iconName;m.target.setAttribute(j2,M||z),h&&m.target.setAttribute(V2,h)}else N6(m.target)&&r(m.target)})}}),B&&m2.observe(n,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}}function A6(){m2&&m2.disconnect()}function P6(c){var a=c.getAttribute("style"),l=[];return a&&(l=a.split(";").reduce(function(e,r){var s=r.split(":"),i=s[0],f=s.slice(1);return i&&f.length>0&&(e[i]=f.join(":").trim()),e},{})),l}function T6(c){var a=c.getAttribute("data-prefix"),l=c.getAttribute("data-icon"),e=c.innerText!==void 0?c.innerText.trim():"",r=u2(_2(c));return r.prefix||(r.prefix=H()),a&&l&&(r.prefix=a,r.iconName=l),r.iconName&&r.prefix||(r.prefix&&e.length>0&&(r.iconName=a6(r.prefix,c.innerText)||Y2(r.prefix,k4(c.innerText))),!r.iconName&&p.autoFetchSvg&&c.firstChild&&c.firstChild.nodeType===Node.TEXT_NODE&&(r.iconName=c.firstChild.data)),r}function F6(c){var a=_(c.attributes).reduce(function(l,e){return l.name!=="class"&&l.name!=="style"&&(l[e.name]=e.value),l},{});return a}function B6(){return{iconName:null,prefix:null,transform:A,symbol:!1,mask:{iconName:null,prefix:null,rest:[]},maskId:null,extra:{classes:[],styles:{},attributes:{}}}}function E1(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{styleParser:!0},l=T6(c),e=l.iconName,r=l.prefix,s=l.rest,i=F6(c),f=R2("parseNodeAttributes",{},c),n=a.styleParser?P6(c):[];return o({iconName:e,prefix:r,transform:A,mask:{iconName:null,prefix:null,rest:[]},maskId:null,symbol:!1,extra:{classes:s,styles:n,attributes:i}},f)}var D6=w.styles;function j4(c){var a=p.autoReplaceSvg==="nest"?E1(c,{styleParser:!1}):E1(c);return~a.extra.classes.indexOf(x4)?E("generateLayersText",c,a):E("generateSvgReplacementMutation",c,a)}function R6(){return[].concat(k(p4),k(M4))}function U1(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!B)return Promise.resolve();var l=v.documentElement.classList,e=function(m){return l.add("".concat(x1,"-").concat(m))},r=function(m){return l.remove("".concat(x1,"-").concat(m))},s=p.autoFetchSvg?R6():J1.concat(Object.keys(D6));s.includes("fa")||s.push("fa");var i=[".".concat(x4,":not([").concat(O,"])")].concat(s.map(function(z){return".".concat(z,":not([").concat(O,"])")})).join(", ");if(i.length===0)return Promise.resolve();var f=[];try{f=_(c.querySelectorAll(i))}catch{}if(f.length>0)e("pending"),r("complete");else return Promise.resolve();var n=Q2.begin("onTree"),t=f.reduce(function(z,m){try{var u=j4(m);u&&z.push(u)}catch(M){h4||M.name==="MissingIcon"&&console.error(M)}return z},[]);return new Promise(function(z,m){Promise.all(t).then(function(u){q4(u,function(){e("active"),e("complete"),r("pending"),typeof a=="function"&&a(),n(),z()})}).catch(function(u){n(),m(u)})})}function H6(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;j4(c).then(function(l){l&&q4([l],a)})}function E6(c){return function(a){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=(a||{}).icon?a:H2(a||{}),r=l.mask;return r&&(r=(r||{}).icon?r:H2(r||{})),c(e,o(o({},l),{},{mask:r}))}}var U6=function(a){var l=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=l.transform,r=e===void 0?A:e,s=l.symbol,i=s===void 0?!1:s,f=l.mask,n=f===void 0?null:f,t=l.maskId,z=t===void 0?null:t,m=l.classes,u=m===void 0?[]:m,M=l.attributes,h=M===void 0?{}:M,d=l.styles,x=d===void 0?{}:d;if(a){var g=a.prefix,N=a.iconName,y=a.icon;return L2(o({type:"icon"},a),function(){return W("beforeDOMElementCreation",{iconDefinition:a,params:l}),K2({icons:{main:E2(y),mask:n?E2(n.icon):{found:!1,width:null,height:null,icon:{}}},prefix:g,iconName:N,transform:o(o({},A),r),symbol:i,maskId:z,extra:{attributes:h,styles:x,classes:u}})})}},I6={mixout:function(){return{icon:E6(U6)}},hooks:function(){return{mutationObserverCallbacks:function(l){return l.treeCallback=U1,l.nodeCallback=H6,l}}},provides:function(a){a.i2svg=function(l){var e=l.node,r=e===void 0?v:e,s=l.callback,i=s===void 0?function(){}:s;return U1(r,i)},a.generateSvgReplacementMutation=function(l,e){var r=e.iconName,s=e.prefix,i=e.transform,f=e.symbol,n=e.mask,t=e.maskId,z=e.extra;return new Promise(function(m,u){Promise.all([U2(r,s),n.iconName?U2(n.iconName,n.prefix):Promise.resolve({found:!1,width:512,height:512,icon:{}})]).then(function(M){var h=z2(M,2),d=h[0],x=h[1];m([l,K2({icons:{main:d,mask:x},prefix:s,iconName:r,transform:i,symbol:f,maskId:t,extra:z,watchable:!0})])}).catch(u)})},a.generateAbstractIcon=function(l){var e=l.children,r=l.attributes,s=l.main,i=l.transform,f=l.styles,n=p2(f);n.length>0&&(r.style=n);var t;return $2(i)&&(t=E("generateAbstractTransformGrouping",{main:s,transform:i,containerWidth:s.width,iconWidth:s.width})),e.push(t||s.icon),{children:e,attributes:r}}}},O6={mixout:function(){return{layer:function(l){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.classes,s=r===void 0?[]:r;return L2({type:"layer"},function(){W("beforeDOMElementCreation",{assembler:l,params:e});var i=[];return l(function(f){Array.isArray(f)?f.map(function(n){i=i.concat(n.abstract)}):i=i.concat(f.abstract)}),[{tag:"span",attributes:{class:["".concat(p.cssPrefix,"-layers")].concat(k(s)).join(" ")},children:i}]})}}}},W6={mixout:function(){return{counter:function(l){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.title,s=r===void 0?null:r,i=e.classes,f=i===void 0?[]:i,n=e.attributes,t=n===void 0?{}:n,z=e.styles,m=z===void 0?{}:z;return L2({type:"counter",content:l},function(){return W("beforeDOMElementCreation",{content:l,params:e}),h6({content:l.toString(),title:s,extra:{attributes:t,styles:m,classes:["".concat(p.cssPrefix,"-layers-counter")].concat(k(f))}})})}}}},q6={mixout:function(){return{text:function(l){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.transform,s=r===void 0?A:r,i=e.classes,f=i===void 0?[]:i,n=e.attributes,t=n===void 0?{}:n,z=e.styles,m=z===void 0?{}:z;return L2({type:"text",content:l},function(){return W("beforeDOMElementCreation",{content:l,params:e}),F1({content:l,transform:o(o({},A),s),extra:{attributes:t,styles:m,classes:["".concat(p.cssPrefix,"-layers-text")].concat(k(f))}})})}}},provides:function(a){a.generateLayersText=function(l,e){var r=e.transform,s=e.extra,i=null,f=null;if(K1){var n=parseInt(getComputedStyle(l).fontSize,10),t=l.getBoundingClientRect();i=t.width/n,f=t.height/n}return Promise.resolve([l,F1({content:l.innerHTML,width:i,height:f,transform:r,extra:s,watchable:!0})])}}},V4=new RegExp('"',"ug"),I1=[1105920,1112319],O1=o(o(o(o({},{FontAwesome:{normal:"fas",400:"fas"}}),P3),A0),I3),W2=Object.keys(O1).reduce(function(c,a){return c[a.toLowerCase()]=O1[a],c},{}),G6=Object.keys(W2).reduce(function(c,a){var l=W2[a];return c[a]=l[900]||k(Object.entries(l))[0][1],c},{});function j6(c){var a=c.replace(V4,"");return k4(k(a)[0]||"")}function V6(c){var a=c.getPropertyValue("font-feature-settings").includes("ss01"),l=c.getPropertyValue("content"),e=l.replace(V4,""),r=e.codePointAt(0),s=r>=I1[0]&&r<=I1[1],i=e.length===2?e[0]===e[1]:!1;return s||i||a}function _6(c,a){var l=c.replace(/^['"]|['"]$/g,"").toLowerCase(),e=parseInt(a),r=isNaN(e)?"normal":e;return(W2[l]||{})[r]||G6[l]}function W1(c,a){var l="".concat(P0).concat(a.replace(":","-"));return new Promise(function(e,r){if(c.getAttribute(l)!==null)return e();var s=_(c.children),i=s.filter(function(d2){return d2.getAttribute(T2)===a})[0],f=R.getComputedStyle(c,a),n=f.getPropertyValue("font-family"),t=n.match(R0),z=f.getPropertyValue("font-weight"),m=f.getPropertyValue("content");if(i&&!t)return c.removeChild(i),e();if(t&&m!=="none"&&m!==""){var u=f.getPropertyValue("content"),M=_6(n,z),h=j6(u),d=t[0].startsWith("FontAwesome"),x=V6(f),g=Y2(M,h),N=g;if(d){var y=l6(h);y.iconName&&y.prefix&&(g=y.iconName,M=y.prefix)}if(g&&!x&&(!i||i.getAttribute(j2)!==M||i.getAttribute(V2)!==N)){c.setAttribute(l,N),i&&c.removeChild(i);var q=B6(),P=q.extra;P.attributes[T2]=a,U2(g,M).then(function(d2){var J4=K2(o(o({},q),{},{icons:{main:d2,mask:U4()},prefix:M,iconName:N,extra:P,watchable:!0})),v2=v.createElementNS("http://www.w3.org/2000/svg","svg");a==="::before"?c.insertBefore(v2,c.firstChild):c.appendChild(v2),v2.outerHTML=J4.map(function(Z4){return c2(Z4)}).join(`
`),c.removeAttribute(l),e()}).catch(r)}else e()}else e()})}function $6(c){return Promise.all([W1(c,"::before"),W1(c,"::after")])}function X6(c){return c.parentNode!==document.head&&!~F0.indexOf(c.tagName.toUpperCase())&&!c.getAttribute(T2)&&(!c.parentNode||c.parentNode.tagName!=="svg")}var Y6=function(a){return!!a&&v4.some(function(l){return a.includes(l)})},K6=function(a){if(!a)return[];for(var l=new Set,e=[a],r=[/(?=\s:)/,new RegExp("(?<=\\)\\)?[^,]*,)")],s=function(){var M=f[i];e=e.flatMap(function(h){return h.split(M).map(function(d){return d.replace(/,\s*$/,"").trim()})})},i=0,f=r;i<f.length;i++)s();e=e.flatMap(function(u){return u.includes("(")?u:u.split(",").map(function(M){return M.trim()})});var n=i2(e),t;try{for(n.s();!(t=n.n()).done;){var z=t.value;if(Y6(z)){var m=v4.reduce(function(u,M){return u.replace(M,"")},z);m!==""&&m!=="*"&&l.add(m)}}}catch(u){n.e(u)}finally{n.f()}return l};function q1(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(B){var l;if(a)l=c;else if(p.searchPseudoElementsFullScan)l=c.querySelectorAll("*");else{var e=new Set,r=i2(document.styleSheets),s;try{for(r.s();!(s=r.n()).done;){var i=s.value;try{var f=i2(i.cssRules),n;try{for(f.s();!(n=f.n()).done;){var t=n.value,z=K6(t.selectorText),m=i2(z),u;try{for(m.s();!(u=m.n()).done;){var M=u.value;e.add(M)}}catch(d){m.e(d)}finally{m.f()}}}catch(d){f.e(d)}finally{f.f()}}catch(d){p.searchPseudoElementsWarnings&&console.warn("Font Awesome: cannot parse stylesheet: ".concat(i.href," (").concat(d.message,`)
If it declares any Font Awesome CSS pseudo-elements, they will not be rendered as SVG icons. Add crossorigin="anonymous" to the <link>, enable searchPseudoElementsFullScan for slower but more thorough DOM parsing, or suppress this warning by setting searchPseudoElementsWarnings to false.`))}}}catch(d){r.e(d)}finally{r.f()}if(!e.size)return;var h=Array.from(e).join(", ");try{l=c.querySelectorAll(h)}catch{}}return new Promise(function(d,x){var g=_(l).filter(X6).map($6),N=Q2.begin("searchPseudoElements");G4(),Promise.all(g).then(function(){N(),O2(),d()}).catch(function(){N(),O2(),x()})})}}var Q6={hooks:function(){return{mutationObserverCallbacks:function(l){return l.pseudoElementsCallback=q1,l}}},provides:function(a){a.pseudoElements2svg=function(l){var e=l.node,r=e===void 0?v:e;p.searchPseudoElements&&q1(r)}}},G1=!1,J6={mixout:function(){return{dom:{unwatch:function(){G4(),G1=!0}}}},hooks:function(){return{bootstrap:function(){H1(R2("mutationObserverCallbacks",{}))},noAuto:function(){A6()},watch:function(l){var e=l.observeMutationsRoot;G1?O2():H1(R2("mutationObserverCallbacks",{observeMutationsRoot:e}))}}}},j1=function(a){var l={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return a.toLowerCase().split(" ").reduce(function(e,r){var s=r.toLowerCase().split("-"),i=s[0],f=s.slice(1).join("-");if(i&&f==="h")return e.flipX=!0,e;if(i&&f==="v")return e.flipY=!0,e;if(f=parseFloat(f),isNaN(f))return e;switch(i){case"grow":e.size=e.size+f;break;case"shrink":e.size=e.size-f;break;case"left":e.x=e.x-f;break;case"right":e.x=e.x+f;break;case"up":e.y=e.y-f;break;case"down":e.y=e.y+f;break;case"rotate":e.rotate=e.rotate+f;break}return e},l)},Z6={mixout:function(){return{parse:{transform:function(l){return j1(l)}}}},hooks:function(){return{parseNodeAttributes:function(l,e){var r=e.getAttribute("data-fa-transform");return r&&(l.transform=j1(r)),l}}},provides:function(a){a.generateAbstractTransformGrouping=function(l){var e=l.main,r=l.transform,s=l.containerWidth,i=l.iconWidth,f={transform:"translate(".concat(s/2," 256)")},n="translate(".concat(r.x*32,", ").concat(r.y*32,") "),t="scale(".concat(r.size/16*(r.flipX?-1:1),", ").concat(r.size/16*(r.flipY?-1:1),") "),z="rotate(".concat(r.rotate," 0 0)"),m={transform:"".concat(n," ").concat(t," ").concat(z)},u={transform:"translate(".concat(i/2*-1," -256)")},M={outer:f,inner:m,path:u};return{tag:"g",attributes:o({},M.outer),children:[{tag:"g",attributes:o({},M.inner),children:[{tag:e.icon.tag,children:e.icon.children,attributes:o(o({},e.icon.attributes),M.path)}]}]}}}},w2={x:0,y:0,width:"100%",height:"100%"};function V1(c){var a=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return c.attributes&&(c.attributes.fill||a)&&(c.attributes.fill="black"),c}function c8(c){return c.tag==="g"?c.children:[c]}var a8={hooks:function(){return{parseNodeAttributes:function(l,e){var r=e.getAttribute("data-fa-mask"),s=r?u2(r.split(" ").map(function(i){return i.trim()})):U4();return s.prefix||(s.prefix=H()),l.mask=s,l.maskId=e.getAttribute("data-fa-mask-id"),l}}},provides:function(a){a.generateAbstractMask=function(l){var e=l.children,r=l.attributes,s=l.main,i=l.mask,f=l.maskId,n=l.transform,t=s.width,z=s.icon,m=i.width,u=i.icon,M=V0({transform:n,containerWidth:m,iconWidth:t}),h={tag:"rect",attributes:o(o({},w2),{},{fill:"white"})},d=z.children?{children:z.children.map(V1)}:{},x={tag:"g",attributes:o({},M.inner),children:[V1(o({tag:z.tag,attributes:o(o({},z.attributes),M.path)},d))]},g={tag:"g",attributes:o({},M.outer),children:[x]},N="mask-".concat(f||b1()),y="clip-".concat(f||b1()),q={tag:"mask",attributes:o(o({},w2),{},{id:N,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[h,g]},P={tag:"defs",children:[{tag:"clipPath",attributes:{id:y},children:c8(u)},q]};return e.push(P,{tag:"rect",attributes:o({fill:"currentColor","clip-path":"url(#".concat(y,")"),mask:"url(#".concat(N,")")},w2)}),{children:e,attributes:r}}}},l8={provides:function(a){var l=!1;R.matchMedia&&(l=R.matchMedia("(prefers-reduced-motion: reduce)").matches),a.missingIconAbstract=function(){var e=[],r={fill:"currentColor"},s={attributeType:"XML",repeatCount:"indefinite",dur:"2s"};e.push({tag:"path",attributes:o(o({},r),{},{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})});var i=o(o({},s),{},{attributeName:"opacity"}),f={tag:"circle",attributes:o(o({},r),{},{cx:"256",cy:"364",r:"28"}),children:[]};return l||f.children.push({tag:"animate",attributes:o(o({},s),{},{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:o(o({},i),{},{values:"1;0;1;1;0;1;"})}),e.push(f),e.push({tag:"path",attributes:o(o({},r),{},{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:l?[]:[{tag:"animate",attributes:o(o({},i),{},{values:"1;0;0;0;0;1;"})}]}),l||e.push({tag:"path",attributes:o(o({},r),{},{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:o(o({},i),{},{values:"0;0;1;1;0;0;"})}]}),{tag:"g",attributes:{class:"missing"},children:e}}}},e8={hooks:function(){return{parseNodeAttributes:function(l,e){var r=e.getAttribute("data-fa-symbol"),s=r===null?!1:r===""?!0:r;return l.symbol=s,l}}}},r8=[X0,I6,O6,W6,q6,Q6,J6,Z6,a8,l8,e8];m6(r8,{mixoutsTo:b});var A8=b.noAuto,_4=b.config,P8=b.library,$4=b.dom,X4=b.parse,T8=b.findIconDefinition,F8=b.toHtml,Y4=b.icon,B8=b.layer,s8=b.text,i8=b.counter;var f8=["*"],n8=(()=>{class c{defaultPrefix="fas";fallbackIcon=null;fixedWidth;set autoAddCss(l){_4.autoAddCss=l,this._autoAddCss=l}get autoAddCss(){return this._autoAddCss}_autoAddCss=!0;static \u0275fac=function(e){return new(e||c)};static \u0275prov=$({token:c,factory:c.\u0275fac,providedIn:"root"})}return c})(),o8=(()=>{class c{definitions={};addIcons(...l){for(let e of l){e.prefix in this.definitions||(this.definitions[e.prefix]={}),this.definitions[e.prefix][e.iconName]=e;for(let r of e.icon[2])typeof r=="string"&&(this.definitions[e.prefix][r]=e)}}addIconPacks(...l){for(let e of l){let r=Object.keys(e).map(s=>e[s]);this.addIcons(...r)}}getIconDefinition(l,e){return l in this.definitions&&e in this.definitions[l]?this.definitions[l][e]:null}static \u0275fac=function(e){return new(e||c)};static \u0275prov=$({token:c,factory:c.\u0275fac,providedIn:"root"})}return c})(),t8=c=>{throw new Error(`Could not find icon with iconName=${c.iconName} and prefix=${c.prefix} in the icon library.`)},m8=()=>{throw new Error("Property `icon` is required for `fa-icon`/`fa-duotone-icon` components.")},Q4=c=>c!=null&&(c===90||c===180||c===270||c==="90"||c==="180"||c==="270"),z8=c=>{let a=Q4(c.rotate),l={[`fa-${c.animation}`]:c.animation!=null&&!c.animation.startsWith("spin"),"fa-spin":c.animation==="spin"||c.animation==="spin-reverse","fa-spin-pulse":c.animation==="spin-pulse"||c.animation==="spin-pulse-reverse","fa-spin-reverse":c.animation==="spin-reverse"||c.animation==="spin-pulse-reverse","fa-pulse":c.animation==="spin-pulse"||c.animation==="spin-pulse-reverse","fa-fw":c.fixedWidth,"fa-border":c.border,"fa-inverse":c.inverse,"fa-layers-counter":c.counter,"fa-flip-horizontal":c.flip==="horizontal"||c.flip==="both","fa-flip-vertical":c.flip==="vertical"||c.flip==="both",[`fa-${c.size}`]:c.size!==null,[`fa-rotate-${c.rotate}`]:a,"fa-rotate-by":c.rotate!=null&&!a,[`fa-pull-${c.pull}`]:c.pull!==null,[`fa-stack-${c.stackItemSize}`]:c.stackItemSize!=null};return Object.keys(l).map(e=>l[e]?e:null).filter(e=>e!=null)},Z2=new WeakSet,K4="fa-auto-css";function p8(c,a){if(!a.autoAddCss||Z2.has(c))return;if(c.getElementById(K4)!=null){a.autoAddCss=!1,Z2.add(c);return}let l=c.createElement("style");l.setAttribute("type","text/css"),l.setAttribute("id",K4),l.innerHTML=$4.css();let e=c.head.childNodes,r=null;for(let s=e.length-1;s>-1;s--){let i=e[s],f=i.nodeName.toUpperCase();["STYLE","LINK"].indexOf(f)>-1&&(r=i)}c.head.insertBefore(l,r),a.autoAddCss=!1,Z2.add(c)}var M8=c=>c.prefix!==void 0&&c.iconName!==void 0,u8=(c,a)=>M8(c)?c:Array.isArray(c)&&c.length===2?{prefix:c[0],iconName:c[1]}:{prefix:a,iconName:c},L8=(()=>{class c{stackItemSize=e2("1x");size=e2();_effect=m1(()=>{if(this.size())throw new Error('fa-icon is not allowed to customize size when used inside fa-stack. Set size on the enclosing fa-stack instead: <fa-stack size="4x">...</fa-stack>.')});static \u0275fac=function(e){return new(e||c)};static \u0275dir=s1({type:c,selectors:[["fa-icon","stackItemSize",""],["fa-duotone-icon","stackItemSize",""]],inputs:{stackItemSize:[1,"stackItemSize"],size:[1,"size"]}})}return c})(),d8=(()=>{class c{size=e2();classes=g2(()=>{let l=this.size(),e=l?{[`fa-${l}`]:!0}:{};return l2(a2({},e),{"fa-stack":!0})});static \u0275fac=function(e){return new(e||c)};static \u0275cmp=h2({type:c,selectors:[["fa-stack"]],hostVars:2,hostBindings:function(e,r){e&2&&t1(r.classes())},inputs:{size:[1,"size"]},ngContentSelectors:f8,decls:1,vars:0,template:function(e,r){e&1&&(n1(),o1(0))},encapsulation:2,changeDetection:0})}return c})(),V8=(()=>{class c{icon=S();title=S();animation=S();mask=S();flip=S();size=S();pull=S();border=S();inverse=S();symbol=S();rotate=S();fixedWidth=S();transform=S();a11yRole=S();renderedIconHTML=g2(()=>{let l=this.icon()??this.config.fallbackIcon;if(!l)return m8(),"";let e=this.findIconDefinition(l);if(!e)return"";let r=this.buildParams();p8(this.document,this.config);let s=Y4(e,r);return this.sanitizer.bypassSecurityTrustHtml(s.html.join(`
`))});document=U(a1);sanitizer=U(z1);config=U(n8);iconLibrary=U(o8);stackItem=U(L8,{optional:!0});stack=U(d8,{optional:!0});constructor(){this.stack!=null&&this.stackItem==null&&console.error('FontAwesome: fa-icon and fa-duotone-icon elements must specify stackItemSize attribute when wrapped into fa-stack. Example: <fa-icon stackItemSize="2x" />.')}findIconDefinition(l){let e=u8(l,this.config.defaultPrefix);if("icon"in e)return e;let r=this.iconLibrary.getIconDefinition(e.prefix,e.iconName);return r??(t8(e),null)}buildParams(){let l=this.fixedWidth(),e={flip:this.flip(),animation:this.animation(),border:this.border(),inverse:this.inverse(),size:this.size(),pull:this.pull(),rotate:this.rotate(),fixedWidth:typeof l=="boolean"?l:this.config.fixedWidth,stackItemSize:this.stackItem!=null?this.stackItem.stackItemSize():void 0},r=this.transform(),s=typeof r=="string"?X4.transform(r):r,i=this.mask(),f=i!=null?this.findIconDefinition(i):null,n={},t=this.a11yRole();t!=null&&(n.role=t);let z={};return e.rotate!=null&&!Q4(e.rotate)&&(z["--fa-rotate-angle"]=`${e.rotate}`),{title:this.title(),transform:s,classes:z8(e),mask:f??void 0,symbol:this.symbol(),attributes:n,styles:z}}static \u0275fac=function(e){return new(e||c)};static \u0275cmp=h2({type:c,selectors:[["fa-icon"]],hostAttrs:[1,"ng-fa-icon"],hostVars:2,hostBindings:function(e,r){e&2&&(f1("innerHTML",r.renderedIconHTML(),e1),i1("title",r.title()??void 0))},inputs:{icon:[1,"icon"],title:[1,"title"],animation:[1,"animation"],mask:[1,"mask"],flip:[1,"flip"],size:[1,"size"],pull:[1,"pull"],border:[1,"border"],inverse:[1,"inverse"],symbol:[1,"symbol"],rotate:[1,"rotate"],fixedWidth:[1,"fixedWidth"],transform:[1,"transform"],a11yRole:[1,"a11yRole"]},outputs:{icon:"iconChange",title:"titleChange",animation:"animationChange",mask:"maskChange",flip:"flipChange",size:"sizeChange",pull:"pullChange",border:"borderChange",inverse:"inverseChange",symbol:"symbolChange",rotate:"rotateChange",fixedWidth:"fixedWidthChange",transform:"transformChange",a11yRole:"a11yRoleChange"},decls:0,vars:0,template:function(e,r){},encapsulation:2,changeDetection:0})}return c})();var _8=(()=>{class c{static \u0275fac=function(e){return new(e||c)};static \u0275mod=r1({type:c});static \u0275inj=c1({})}return c})();var Y8={prefix:"fas",iconName:"ellipsis-vertical",icon:[128,512,["ellipsis-v"],"f142","M64 144a56 56 0 1 1 0-112 56 56 0 1 1 0 112zm0 224c30.9 0 56 25.1 56 56s-25.1 56-56 56-56-25.1-56-56 25.1-56 56-56zm56-112c0 30.9-25.1 56-56 56s-56-25.1-56-56 25.1-56 56-56 56 25.1 56 56z"]};var K8={prefix:"fas",iconName:"circle-half-stroke",icon:[512,512,[9680,"adjust"],"f042","M448 256c0-106-86-192-192-192l0 384c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"]};var Q8={prefix:"fas",iconName:"sun",icon:[576,512,[9728],"f185","M178.2-10.1c7.4-3.1 15.8-2.2 22.5 2.2l87.8 58.2 87.8-58.2c6.7-4.4 15.1-5.2 22.5-2.2S411.4-.5 413 7.3l20.9 103.2 103.2 20.9c7.8 1.6 14.4 7 17.4 14.3s2.2 15.8-2.2 22.5l-58.2 87.8 58.2 87.8c4.4 6.7 5.2 15.1 2.2 22.5s-9.6 12.8-17.4 14.3L433.8 401.4 413 504.7c-1.6 7.8-7 14.4-14.3 17.4s-15.8 2.2-22.5-2.2l-87.8-58.2-87.8 58.2c-6.7 4.4-15.1 5.2-22.5 2.2s-12.8-9.6-14.3-17.4L143 401.4 39.7 380.5c-7.8-1.6-14.4-7-17.4-14.3s-2.2-15.8 2.2-22.5L82.7 256 24.5 168.2c-4.4-6.7-5.2-15.1-2.2-22.5s9.6-12.8 17.4-14.3L143 110.6 163.9 7.3c1.6-7.8 7-14.4 14.3-17.4zM207.6 256a80.4 80.4 0 1 1 160.8 0 80.4 80.4 0 1 1 -160.8 0zm208.8 0a128.4 128.4 0 1 0 -256.8 0 128.4 128.4 0 1 0 256.8 0z"]};var J8={prefix:"fas",iconName:"user-tag",icon:[640,512,[],"f507","M256.1 8a120 120 0 1 1 0 240 120 120 0 1 1 0-240zM226.4 304l59.4 0c6.7 0 13.2 .4 19.7 1.1-.9 4.9-1.4 9.9-1.4 15l0 92.1c0 25.5 10.1 49.9 28.1 67.9l31.9 31.9-286.3 0c-16.4 0-29.7-13.3-29.7-29.7 0-98.5 79.8-178.3 178.3-178.3zM352.1 412.2l0-92.1c0-17.7 14.3-32 32-32l92.1 0c12.7 0 24.9 5.1 33.9 14.1l96 96c18.7 18.7 18.7 49.1 0 67.9l-76.1 76.1c-18.7 18.7-49.1 18.7-67.9 0l-96-96c-9-9-14.1-21.2-14.1-33.9zm104-44.2a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"]};var Z8={prefix:"fas",iconName:"moon",icon:[512,512,[127769,9214],"f186","M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"]};export{p1 as a,V8 as b,_8 as c,Y8 as d,K8 as e,Q8 as f,J8 as g,Z8 as h};
