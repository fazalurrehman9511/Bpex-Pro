export const DEFAULT_EMBED_BRAND_NAME = 'BPEXCH'

export function getEmbedBrandName(override) {
  return override || process.env.VITE_EMBED_BRAND_NAME || DEFAULT_EMBED_BRAND_NAME
}

/** Replace visible BPEXCH name in HTML text nodes only — never href/src paths or CSS filenames */
export function applyBrandReplace(content, brandName = getEmbedBrandName()) {
  if (!content || !brandName || brandName.toUpperCase() === 'BPEXCH') return content

  const preserved = []
  const stripped = content.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, (block) => {
    preserved.push(block)
    return `\x00KEEP${preserved.length - 1}\x00`
  })

  const replaced = stripped.replace(/>([^<]*)</g, (match, text) => {
    if (!/\bBPEXCH\b/.test(text)) return match
    return `>${text.replace(/\bBPEXCH\b/g, brandName)}<`
  })

  return replaced.replace(/\x00KEEP(\d+)\x00/g, (_, i) => preserved[Number(i)])
}

function createInjectScript(brandName, syncSecret = '') {
  const brand = JSON.stringify(brandName)
  const syncSec = JSON.stringify(syncSecret || '')
  return `
<script id="flowexch-proxy-bridge">
(function(){
  var P='/bpexch';
  var BRAND=${brand};
  function fix(u){
    if(!u||typeof u!=='string')return u;
    if(u.indexOf(P+'/')===0||u===P)return u;
    if(u.indexOf('data:')===0||u.indexOf('blob:')===0||u.indexOf('mailto:')===0)return u;
    /* FlowExch backend routes — must NOT go through BPEXCH proxy */
    if(u.indexOf('/api/bpexch/')===0||u.indexOf('/api/transactions')===0||u.indexOf('/api/admin')===0||u.indexOf('/api/blog')===0||u.indexOf('/api/live-events')===0||u.indexOf('/api/health')===0||u.indexOf('/uploads/')===0)return u;
    if(/^https?:\\/\\//i.test(u)||u.indexOf('//')===0){
      return u.replace(/^https?:\\/\\/[^/]*bpexch[^/]*/i,location.origin+P);
    }
    if(u.charAt(0)==='/')return P+u;
    return u;
  }
  function getAuthToken(){
    try{
      var i='; '+document.cookie;
      var t=i.split('; wex3authtoken=');
      if(t.length===2)return t.pop().split(';').shift();
    }catch(e){}
    return '';
  }
  function attachAuthHeaders(headers){
    headers=headers||{};
    var token=getAuthToken();
    if(token && !headers.Authorization && !headers.authorization){
      headers.Authorization='Bearer '+token;
    }
    return headers;
  }
  function isApiUrl(u){
    u=String(u||'');
    return u.indexOf('/api/')>=0 || u.indexOf(P+'/api/')>=0;
  }
  function hookJQuery(jQuery){
    jQuery=jQuery||window.jQuery;
    if(!jQuery||jQuery.__flowexch)return;
    jQuery.__flowexch=1;
    /*
     * BPEXCH GetFunds uses timeout:1000 — too low through our proxy (often >1s).
     * Also rewrite /api/* → /bpexch/api/* and attach Bearer token from wex3authtoken.
     */
    jQuery.ajaxPrefilter(function(o){
      if(o.url)o.url=fix(o.url);
      if(typeof o.timeout==='number'&&o.timeout>0&&o.timeout<30000)o.timeout=30000;
      if(o.timeout==null||o.timeout===0)o.timeout=30000;
      if(o.url&&isApiUrl(o.url)){
        o.headers=attachAuthHeaders(o.headers||{});
        o.xhrFields=o.xhrFields||{};
        if(o.xhrFields.withCredentials==null)o.xhrFields.withCredentials=true;
      }
    });
    var _ajax=jQuery.ajax;
    jQuery.ajax=function(url,options){
      if(typeof url==='object'){
        options=url;
        if(options&&options.url)options.url=fix(options.url);
        if(options&&typeof options.timeout==='number'&&options.timeout>0&&options.timeout<30000)options.timeout=30000;
        if(options&&(options.timeout==null||options.timeout===0))options.timeout=30000;
        return _ajax.call(jQuery,options);
      }
      if(options&&typeof options==='object'){
        if(typeof options.timeout==='number'&&options.timeout>0&&options.timeout<30000)options.timeout=30000;
        if(options.timeout==null||options.timeout===0)options.timeout=30000;
      }
      return _ajax.call(jQuery,fix(url),options);
    };
  }
  /*
   * Do NOT defineProperty(window,'$'|jQuery) — that breaks jQuery.noConflict /
   * dual jquery loads and leaves $ undefined, so Vue (#searchUsers) never mounts
   * and {{ user.username }} shows as raw text.
   * Primary hook is injected immediately after jquery.js (see injectAfterJquery).
   */
  hookJQuery();
  var _jqTries=0;
  var _jqWait=setInterval(function(){
    hookJQuery();
    if(++_jqTries>500)clearInterval(_jqWait);
  },10);
  document.addEventListener('DOMContentLoaded',function(){hookJQuery();});
  window.addEventListener('load',function(){hookJQuery();});
  /* Hook fetch — api-client.js uses fetch() for orders/nav APIs */
  var _fetch=window.fetch;
  if(_fetch&&!_fetch.__flowexch){
    window.fetch=function(input,init){
      init=init?Object.assign({},init):{};
      if(typeof input==='string'){
        input=fix(input);
      }else if(input&&typeof Request!=='undefined'&&input instanceof Request){
        var fixed=fix(input.url);
        if(fixed!==input.url)input=new Request(fixed,input);
      }
      var url=typeof input==='string'?input:(input&&input.url)||'';
      if(isApiUrl(url)){
        var hdrs=new Headers(init.headers||(input&&input.headers)||{});
        var token=getAuthToken();
        if(token&&!hdrs.has('Authorization'))hdrs.set('Authorization','Bearer '+token);
        init.headers=hdrs;
        if(init.credentials==null)init.credentials='include';
      }
      return _fetch.call(this,input,init);
    };
    window.fetch.__flowexch=1;
  }
  /* Hook XHR for Angular/$http and non-jQuery callers */
  var _xhrOpen=XMLHttpRequest.prototype.open;
  if(!_xhrOpen.__flowexch){
    XMLHttpRequest.prototype.open=function(method,url,async,user,password){
      var fixed=typeof url==='string'?fix(url):url;
      this.__flowexchUrl=fixed;
      if(arguments.length===2)return _xhrOpen.call(this,method,fixed);
      if(arguments.length===3)return _xhrOpen.call(this,method,fixed,async);
      return _xhrOpen.call(this,method,fixed,async,user,password);
    };
    XMLHttpRequest.prototype.open.__flowexch=1;
  }
  var _xhrSend=XMLHttpRequest.prototype.send;
  if(!_xhrSend.__flowexch){
    XMLHttpRequest.prototype.send=function(body){
      try{
        if(typeof this.timeout==='number'&&this.timeout>0&&this.timeout<30000)this.timeout=30000;
        if(isApiUrl(this.__flowexchUrl)){
          var token=getAuthToken();
          if(token){
            try{this.setRequestHeader('Authorization','Bearer '+token);}catch(e){}
          }
          try{this.withCredentials=true;}catch(e){}
        }
      }catch(e){}
      return _xhrSend.call(this,body);
    };
    XMLHttpRequest.prototype.send.__flowexch=1;
  }
  var _WS=window.WebSocket;
  window.WebSocket=function(u,p){
    u=String(u||'').replace(/wss?:\\/\\/[^/]*bpexch[^/]*/i,location.origin+P);
    u=fix(u);
    return new _WS(u,p);
  };
  window.WebSocket.prototype=_WS.prototype;
  window.WebSocket.CONNECTING=_WS.CONNECTING;
  window.WebSocket.OPEN=_WS.OPEN;
  window.WebSocket.CLOSING=_WS.CLOSING;
  window.WebSocket.CLOSED=_WS.CLOSED;

  /* Fix hard redirects that bypass /bpexch (e.g. GetFunds Unauthorized → /Users/Login) */
  var _assign=Location.prototype.assign;
  Location.prototype.assign=function(u){return _assign.call(this,fix(String(u)));};
  var _replace=Location.prototype.replace;
  Location.prototype.replace=function(u){return _replace.call(this,fix(String(u)));};
  /* Do not redefine location.href — breaks Chrome navigation / Vue init */

  /* Lodash shim — ErrorHandler uses _.includes; missing _ aborts Markets error handling */
  if(typeof window._==='undefined'){
    window._={includes:function(a,v){return Array.isArray(a)&&a.indexOf(v)>=0;}};
  }

  /* Patch GetFunds / ErrorHandler — short timeout + bare /Users/Login break the embed */
  function goLogin(){
    try{location.assign(fix('/Users/Login'));}catch(e){location.href=P+'/Users/Login';}
  }
  function patchBpexchDataFns(){
    if(typeof ErrorHandler==='function'&&!ErrorHandler.__flowexch){
      window.ErrorHandler=function(n){
        if(n&&(n.error==='MISSING_AUTH_TOKEN'||n.error==='INVALID_SESSION'))goLogin();
      };
      ErrorHandler.__flowexch=1;
    }
    if(typeof GetFunds==='function'&&!GetFunds.__flowexch){
      window.GetFunds=function(){
        var jq=window.jQuery;
        if(!jq)return;
        var url=(typeof svc_prefix==='string'?svc_prefix:'/api/')+'users/funds';
        jq.ajax(fix(url),{
          timeout:30000,
          dataType:'json',
          success:function(d){if(typeof RenderFunds==='function')RenderFunds(d);},
          error:function(xhr,t,i){
            var err=xhr&&xhr.responseJSON;
            if(i==='Unauthorized'||(err&&(err.error==='INVALID_SESSION'||err.error==='MISSING_AUTH_TOKEN')))goLogin();
          }
        });
      };
      GetFunds.__flowexch=1;
    }
    if(typeof RefreshToken==='function'&&!RefreshToken.__flowexch){
      window.RefreshToken=function(){
        var jq=window.jQuery;
        if(!jq||typeof reft==='undefined')return;
        var url=(typeof svc_prefix==='string'?svc_prefix:'/api/')+'users/refresh?rt='+reft;
        jq.ajax(fix(url),{timeout:30000,dataType:'json',error:function(xhr,t,i){
          var err=xhr&&xhr.responseJSON;
          if(i==='Unauthorized'||(err&&(err.error==='INVALID_SESSION'||err.error==='MISSING_AUTH_TOKEN')))goLogin();
        }});
      };
      RefreshToken.__flowexch=1;
    }
  }
  var _patchTries=0;
  var _patchWait=setInterval(function(){
    patchBpexchDataFns();
    if((typeof GetFunds==='function'&&GetFunds.__flowexch)||++_patchTries>600)clearInterval(_patchWait);
  },20);
  document.addEventListener('DOMContentLoaded',patchBpexchDataFns);
  window.addEventListener('load',function(){
    patchBpexchDataFns();
    if(typeof GetFunds==='function')try{GetFunds();}catch(e){}
    setTimeout(function(){
      if(typeof GetFunds==='function')try{GetFunds();}catch(e){}
    },1500);
    /* Sport Highlights — same as bpexch.xyz dashboard under Search-Users */
    function ensureHighlights(){
      var el=document.getElementById('highlights');
      if(!el)return;
      if(el.__vue__&&el.__vue__.GetMarkets){
        try{el.__vue__.GetMarkets();}catch(e){}
        return;
      }
      if(typeof RenderHighlights==='function'&&!el.__vue__){
        try{RenderHighlights();}catch(e){}
      }
    }
    ensureHighlights();
    setTimeout(ensureHighlights,800);
    setTimeout(ensureHighlights,2500);
  });

  /* Keep navigation in iframe; sync clean parent URL (no /bpexch in address bar) */
  var _lastPublicPath='';
  function publicPath(){
    var p=location.pathname||'/';
    if(p.indexOf(P)===0){p=p.slice(P.length)||'/';if(p.charAt(0)!=='/')p='/'+p;}
    if(/^\\/users\\/login\\/?$/i.test(p))return '/login'+(location.search||'');
    if(/^\\/login\\/?$/i.test(p))return '/login'+(location.search||'');
    return '/dashboard'+(location.search||'');
  }
  function notifyParentPath(){
    if(window.parent===window)return;
    var path=publicPath();
    if(path===_lastPublicPath)return;
    _lastPublicPath=path;
    try{window.parent.postMessage({source:'flowexch-embed',action:'embed-path',path:path},location.origin);}catch(e){}
  }
  function keepLinksInFrame(){
    document.addEventListener('click',function(e){
      var a=e.target.closest('a[href]');
      if(!a)return;
      var href=a.getAttribute('href')||'';
      if(href.indexOf('javascript:')===0)return;
      if(a.target==='_top'||a.target==='_parent')a.target='_self';
    },true);
    document.addEventListener('submit',function(e){
      var f=e.target;
      if(f&&(f.target==='_top'||f.target==='_parent'))f.target='_self';
    },true);
  }
  /*
   * Profile dropdown — match bpexch.xyz behaviour.
   * Do NOT rewrite href to javascript:void(0) (breaks some Bootstrap builds).
   * Manually toggle header dropdowns so Popper failures / <base href> can't block Profile/Logout.
   */
  function closeHeaderDropdowns(){
    document.querySelectorAll('.header .dropdown.show, .app-header .dropdown.show, header .dropdown.show, .navbar-nav > .dropdown.show, .nav-item.dropdown.show').forEach(function(dd){
      dd.classList.remove('show');
      var m=dd.querySelector(':scope > .dropdown-menu, .dropdown-menu');
      if(m){
        m.classList.remove('show');
        m.style.removeProperty('display');
      }
      var t=dd.querySelector('.dropdown-toggle');
      if(t)t.setAttribute('aria-expanded','false');
    });
  }
  function bindHeaderDropdown(){
    if(document.documentElement.__flowexchDd)return;
    document.documentElement.__flowexchDd=1;
    document.addEventListener('click',function(e){
      var logout=e.target.closest('#btn-logout, a[href*="/Logout"], a[href*="/logout"]');
      if(logout&&logout.closest('.dropdown-menu, .header, .navbar')){
        e.preventDefault();
        e.stopPropagation();
        var href=logout.getAttribute('href')||'/Common/Logout';
        try{localStorage.setItem('logout-event','logout'+Math.random());}catch(err){}
        location.assign(fix(href));
        return;
      }
      var toggle=e.target.closest('.header .dropdown-toggle, .app-header .dropdown-toggle, header .dropdown-toggle, .navbar .nav-item.dropdown > .dropdown-toggle, .navbar-nav > .nav-item.dropdown > a');
      if(toggle && !toggle.closest('.sidebar')){
        var dd=toggle.closest('.dropdown, .nav-item');
        var menu=dd&&dd.querySelector('.dropdown-menu');
        if(dd&&menu){
          e.preventDefault();
          e.stopImmediatePropagation();
          var willOpen=!dd.classList.contains('show');
          closeHeaderDropdowns();
          if(willOpen){
            dd.classList.add('show');
            menu.classList.add('show');
            menu.style.setProperty('display','block','important');
            toggle.setAttribute('aria-expanded','true');
          }
          return;
        }
      }
      if(!e.target.closest('.dropdown-menu')&&!e.target.closest('.dropdown-toggle')){
        closeHeaderDropdowns();
      }
    },true);
  }
  function fixDropdownAnchors(){
    /* Keep href="#" like bpexch.xyz — only ensure data-toggle is present */
    document.querySelectorAll('.header a.dropdown-toggle, .app-header a.dropdown-toggle, header a.dropdown-toggle, .navbar-nav a.dropdown-toggle').forEach(function(a){
      if(!a.getAttribute('data-toggle')&&!a.getAttribute('data-bs-toggle')){
        a.setAttribute('data-toggle','dropdown');
      }
      var href=(a.getAttribute('href')||'').trim();
      if(href.indexOf('javascript:')===0){
        a.setAttribute('href','#');
      }
    });
  }
  function stripTopTargets(){
    document.querySelectorAll('a[target=_top],a[target=_parent],form[target=_top],form[target=_parent]').forEach(function(el){el.target='_self';});
  }
  keepLinksInFrame();
  bindHeaderDropdown();
  stripTopTargets();
  fixDropdownAnchors();
  notifyParentPath();
  document.addEventListener('DOMContentLoaded',function(){stripTopTargets();fixDropdownAnchors();notifyParentPath();});
  window.addEventListener('load',function(){stripTopTargets();fixDropdownAnchors();notifyParentPath();});
  window.addEventListener('popstate',notifyParentPath);
  setInterval(function(){stripTopTargets();fixDropdownAnchors();notifyParentPath();},2000);
  /* bootActionBar on its own slower timer — avoid parent overlay thrashing profile clicks */
  setInterval(function(){bootActionBar();},2000);

  /* Force desktop sidebar — same as bpexch.xyz on desktop */
  function forceDesktopSidebar(){
    var b=document.body;
    if(!b)return;
    b.classList.add('sidebar-lg-show','sidebar-fixed');
    b.classList.remove('sidebar-show','sidebar-sm-show','sidebar-md-show');
  }
  forceDesktopSidebar();
  document.addEventListener('DOMContentLoaded',forceDesktopSidebar);
  window.addEventListener('load',forceDesktopSidebar);

  /* Replace BPEXCH name only — never destroy child nodes (logo img / dropdown) */
  function replaceBrandText(root){
    if(!root||!BRAND||BRAND==='BPEXCH')return;
    var skip=/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT)$/i;
    var brandSel='.green-logo-text,.sidebar-brand,.navbar-brand,.header-brand';
    root.querySelectorAll(brandSel).forEach(function(el){
      var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null);
      var n;
      while(n=w.nextNode()){
        if(/\\bBPEXCH\\b/.test(n.textContent))n.textContent=n.textContent.replace(/\\bBPEXCH\\b/g,BRAND);
      }
    });
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
    var n;
    while(n=w.nextNode()){
      var p=n.parentElement;
      if(!p||skip.test(p.tagName))continue;
      if(p.closest&&p.closest(brandSel))continue;
      if(p.closest&&p.closest('.wallet-balance,.wallet-exposure,#flowexch-action-bar,.dropdown-menu'))continue;
      if(/\\bBPEXCH\\b/.test(n.textContent))n.textContent=n.textContent.replace(/\\bBPEXCH\\b/g,BRAND);
    }
    if(document.title)document.title=document.title.replace(/\\bBPEXCH\\b/g,BRAND);
  }
  function runBrandReplace(){
    replaceBrandText(document.documentElement);
  }
  runBrandReplace();
  document.addEventListener('DOMContentLoaded',runBrandReplace);
  window.addEventListener('load',runBrandReplace);
  var _brandTimer;
  if(window.MutationObserver&&document.body){
    new MutationObserver(function(){
      clearTimeout(_brandTimer);
      _brandTimer=setTimeout(runBrandReplace,200);
    }).observe(document.body,{childList:true,subtree:true});
  }

  /* Header B:/L: — sync from info bar when placeholder "-" (no DOM/layout changes) */
  function infoBarText(){
    var row=document.querySelector('.Bl_NT_SF,.Bl_NT_DB');
    if(row)return row.innerText||'';
    var nodes=document.querySelectorAll('.navbar ~ * div, .app-header ~ * div, header ~ * div, .card-header, .card-body');
    for(var i=0;i<nodes.length;i++){
      var t=(nodes[i].innerText||'').replace(/\\s+/g,' ').trim();
      if(t.length<120&&/Credit:/i.test(t)&&/Balance:/i.test(t)&&/Liable:/i.test(t))return t;
    }
    return '';
  }
  function walletPlaceholder(v){
    v=(v||'').trim();
    return v===''||v==='-'||v==='—'||v==='–';
  }
  function currencySymbol(){
    var sym=localStorage.getItem('symbol')||'Rs.';
    if(!/\\.$/.test(sym))sym+='.';
    return sym;
  }
  function formatBalanceText(raw,sym){
    var v=(raw||'').trim();
    if(!v||walletPlaceholder(v))return null;
    if(new RegExp('^'+sym.replace('.','\\\\.')).test(v))return v;
    if(/^Rs\\.?\\s/i.test(v))return v;
    var num=v.replace(/[^\\d.,]/g,'');
    if(!num)return v;
    return sym+' '+num;
  }
  function syncWalletHeader(){
    var bal=document.querySelector('.navbar .wallet-balance,.header .wallet-balance,.wallet-balance');
    var exp=document.querySelector('.navbar .wallet-exposure,.header .wallet-exposure,.wallet-exposure');
    if(!bal)return;
    var wrap=bal.parentElement;
    if(wrap){
      var wrapTxt=(wrap.textContent||'').replace(/\\s+/g,' ').trim();
      if(!/\\bB\\s*:/i.test(wrapTxt))wrap.classList.add('flowexch-wallet-plain');
      else wrap.classList.remove('flowexch-wallet-plain');
    }
    var sym=currencySymbol();
    var bt=(bal.textContent||'').trim();
    if(walletPlaceholder(bt)){
      var txt=infoBarText();
      if(!txt)return;
      var bm=txt.match(/Balance:\\s*([\\d.,]+)/i);
      var lm=txt.match(/Liable:\\s*([\\d.,]+)/i);
      if(!bm)return;
      bal.textContent=sym+' '+bm[1];
      if(exp&&lm)exp.textContent=lm[1];
      return;
    }
    var formatted=formatBalanceText(bt,sym);
    if(formatted&&formatted!==bt)bal.textContent=formatted;
    if(exp){
      var et=(exp.textContent||'').trim();
      if(walletPlaceholder(et)){
        var txt2=infoBarText();
        var lm2=txt2&&txt2.match(/Liable:\\s*([\\d.,]+)/i);
        if(lm2)exp.textContent=lm2[1];
      }
    }
  }
  function scheduleWalletSync(){
    syncWalletHeader();
    var n=0;
    var iv=setInterval(function(){
      syncWalletHeader();
      if(++n>=30)clearInterval(iv);
    },500);
  }
  function wrapRenderFunds(){
    if(typeof RenderFunds!=='function'||RenderFunds.__flowexch)return;
    var orig=RenderFunds;
    window.RenderFunds=function(d){
      orig(d);
      setTimeout(syncWalletHeader,0);
    };
    RenderFunds.__flowexch=1;
  }
  document.addEventListener('DOMContentLoaded',function(){
    scheduleWalletSync();
    wrapRenderFunds();
  });
  window.addEventListener('load',function(){
    scheduleWalletSync();
    wrapRenderFunds();
    if(typeof GetFunds==='function')try{GetFunds();}catch(e){}
  });
  var _rfPoll=setInterval(function(){
    wrapRenderFunds();
    syncWalletHeader();
  },300);
  setTimeout(function(){clearInterval(_rfPoll);},12000);

  /* Deposit / Withdraw — attach to Credit/Balance info row (2nd line) */
  function findInfoBarEl(){
    /*
     * Do NOT match bare .Bl_NT_DB — Sport Highlights race cards use that class too,
     * which falsely enables the parent action-bar overlay and blocks the profile dropdown.
     */
    var cands=document.querySelectorAll('.Bl_NT_SF,.Bl_NT_DB,.header ~ div, .navbar ~ div, .app-header ~ div');
    for(var i=0;i<cands.length;i++){
      var el=cands[i];
      var t=(el.innerText||'').replace(/\\s+/g,' ').trim();
      if(t.length<160&&t.length>8&&/Credit:/i.test(t)&&/Balance:/i.test(t)&&/Liable:/i.test(t))return el;
    }
    var nodes=document.querySelectorAll('div, section');
    for(var j=0;j<nodes.length;j++){
      var el2=nodes[j];
      var t2=(el2.innerText||'').replace(/\\s+/g,' ').trim();
      if(t2.length<160&&t2.length>8&&/Credit:/i.test(t2)&&/Balance:/i.test(t2)&&/Liable:/i.test(t2))return el2;
    }
    return null;
  }
  function hasLoggedInShell(){
    if(findInfoBarEl())return true;
    if(findHeaderEl()&&document.querySelector('.wallet-balance,.dropdown-toggle,.nav-link.dropdown-toggle'))return true;
    return false;
  }
  function isLoginScreen(){
    if(hasLoggedInShell())return false;
    if(document.querySelector('.login100-form,.wrap-login100,.container-login100'))return true;
    var p=(location.pathname||'').toLowerCase();
    if(/\\/(users\\/)?login\\/?$/i.test(p))return true;
    return false;
  }
  function shouldShowActionBar(){
    if(isLoginScreen())return false;
    /* Only bettor dashboards with real Credit/Balance row — not Admin / Sport Highlights */
    if(!findInfoBarEl())return false;
    var hdr=findHeaderEl();
    if(hdr&&/\\(\\s*Admin\\s*\\)/i.test(hdr.innerText||''))return false;
    return true;
  }
  function postNavigate(path){
    var payload={source:'flowexch-embed',action:'navigate',path:path};
    var bal=document.querySelector('.navbar .wallet-balance,.header .wallet-balance,.wallet-balance');
    if(bal)payload.availableBalance=(bal.textContent||'').trim();
    try{window.parent.postMessage(payload,window.location.origin);}catch(e){}
  }
  function walletNavRect(){
    var w=document.querySelector('.navbar .wallet-balance,.header .wallet-balance,.wallet-balance');
    if(w){
      var el=w.closest('.nav-item,li,a,.navbar-nav > *')||w.parentElement||w;
      var r=el.getBoundingClientRect();
      if(r.width>=1)return r;
    }
    var info=document.querySelector('.Bl_NT_SF,.Bl_NT_DB');
    if(info){
      var ir=info.getBoundingClientRect();
      if(ir.width>=1)return ir;
    }
    var hdr=findHeaderEl();
    if(hdr)return hdr.getBoundingClientRect();
    return null;
  }
  function findHeaderEl(){
    return document.querySelector('.header,header.app-header,header.navbar,header');
  }
  function findActionBarHost(){
    var header=findHeaderEl();
    var info=findInfoBarEl();
    if(info){
      var wrap=info.parentElement;
      if(wrap&&header&&(wrap===header.parentElement||wrap.contains(header)))return wrap;
      return info;
    }
    return header;
  }
  function ensureRelative(el){
    if(!el)return;
    var pos=window.getComputedStyle(el).position;
    if(pos==='static')el.style.position='relative';
    el.classList.add('flowexch-action-host');
  }
  var NARROW_MAX=659;
  var _parentNarrow=null;
  function viewportWidth(){
    try{
      if(window.parent&&window.parent!==window)return window.parent.innerWidth||window.innerWidth;
    }catch(e){}
    return window.innerWidth;
  }
  function isNarrowViewport(){
    if(_parentNarrow!==null)return _parentNarrow;
    return viewportWidth()<=NARROW_MAX;
  }
  function syncNarrowMode(){
    var narrow=isNarrowViewport();
    document.body.classList.toggle('flowexch-narrow',narrow);
    document.documentElement.style.setProperty('--flowexch-header-h',narrow?'92px':'68px');
  }
  function reportActionBarAnchor(){
    if(window.parent===window)return;
    if(!shouldShowActionBar()){
      try{window.parent.postMessage({source:'flowexch-embed',action:'actionbar-anchor',visible:false},location.origin);}catch(e){}
      return;
    }
    var info=findInfoBarEl();
    var header=findHeaderEl();
    var el=info||header;
    if(!el){
      try{window.parent.postMessage({source:'flowexch-embed',action:'actionbar-anchor',visible:false},location.origin);}catch(e){}
      return;
    }
    var r=el.getBoundingClientRect();
    var visible=r.height>0&&r.bottom>0&&r.top<window.innerHeight;
    try{
      window.parent.postMessage({
        source:'flowexch-embed',
        action:'actionbar-anchor',
        visible:visible,
        top:r.top,
        height:Math.max(r.height,28),
        bottom:r.bottom
      },location.origin);
    }catch(e){}
  }
  function hideLegacyIframeBar(){
    var bar=document.getElementById('flowexch-action-bar');
    if(bar)bar.remove();
  }
  function bootActionBar(){
    hideLegacyIframeBar();
    reportActionBarAnchor();
    var main=document.querySelector('.main,.app-body,main');
    if(main&&!main.__flowexchScroll){
      main.__flowexchScroll=1;
      main.addEventListener('scroll',bootActionBar,{passive:true});
    }
  }
  document.addEventListener('DOMContentLoaded',bootActionBar);
  window.addEventListener('load',bootActionBar);
  window.addEventListener('resize',bootActionBar);
  window.addEventListener('scroll',bootActionBar,{passive:true});
  window.addEventListener('popstate',bootActionBar);
  window.addEventListener('message',function(e){
    if(e.origin!==window.location.origin)return;
    var d=e.data;
    if(d&&d.source==='flowexch-parent'&&typeof d.narrow==='boolean'){
      _parentNarrow=!!d.narrow;
      syncNarrowMode();
      bootActionBar();
    }
  });
  var _narrowPoll=setInterval(function(){
    syncNarrowMode();
  },400);
  setTimeout(function(){clearInterval(_narrowPoll);},15000);
  setTimeout(bootActionBar,600);
  setTimeout(bootActionBar,2000);
  setTimeout(bootActionBar,5000);
  /* Slow poll only — fast re-posts made parent overlay re-render and ate profile clicks */
  setInterval(function(){
    bootActionBar();
  },2500);
  if(window.MutationObserver&&document.body){
    var _abMoTimer;
    new MutationObserver(function(){
      syncWalletHeader();
      clearTimeout(_abMoTimer);
      _abMoTimer=setTimeout(bootActionBar,300);
    }).observe(document.body,{childList:true,subtree:true});
  }

  /* Sync BPEXCH user create/edit → FlowExch database */
  var SYNC_SECRET=${syncSec};
  var cachedEditUsername='';
  function normKey(k){
    var raw=String(k).trim();
    var last=raw.indexOf('.')>=0?raw.split('.').pop():raw;
    return last.toLowerCase().replace(/[^a-z0-9]/g,'');
  }
  function isLoginPath(u){
    return /login|authenticate|logout|signin/i.test(u||'');
  }
  function parseBodyFields(body,ct){
    if(!body)return{};
    if(typeof body==='string'){
      if(!body.trim())return{};
      if((ct&&ct.indexOf('json')!==-1)||body.trim().charAt(0)==='{'){
        try{return JSON.parse(body);}catch(e){return{};}
      }
      var out={},parts=body.split('&');
      for(var i=0;i<parts.length;i++){
        var kv=parts[i].split('=');
        if(kv[0])out[decodeURIComponent(kv[0])]=decodeURIComponent((kv[1]||'').replace(/\\+/g,' '));
      }
      return out;
    }
    if(body instanceof FormData){
      var fd={};
      body.forEach(function(v,k){fd[k]=v;});
      return fd;
    }
    if(typeof body==='object')return body;
    return {};
  }
  function pickUsername(map){
    var c=[map.username,map.loginname,map.login,map.user];
    if(map.userid&&!/^\\d+$/.test(String(map.userid).trim()))c.push(map.userid);
    for(var i=0;i<c.length;i++){if(c[i])return String(c[i]).trim();}
    return '';
  }
  function parseBoolish(v){
    var s=String(v==null?'':v).trim().toLowerCase();
    if(/^(true|1|on|yes|y|active|enabled|open|unlocked)$/.test(s))return true;
    if(/^(false|0|off|no|n|inactive|disabled|locked|blocked|suspended|closed)$/.test(s))return false;
    return null;
  }
  function parseIsActive(map,mode){
    if(!map)return mode==='edit'?null:true;
    var direct=map.isactive!=null?map.isactive:map.active;
    if(direct!=null&&direct!==''){var p=parseBoolish(direct);if(p!=null)return p;}
    if(map.enabled!=null&&map.enabled!==''){var e=parseBoolish(map.enabled);if(e!=null)return e;}
    var inactive=map.isinactive!=null?map.isinactive:map.inactive;
    if(inactive!=null&&inactive!==''){var n=parseBoolish(inactive);if(n!=null)return !n;}
    var locked=map.islocked!=null?map.islocked:map.locked;
    if(locked!=null&&locked!==''){var l=parseBoolish(locked);if(l!=null)return !l;}
    var status=map.userstatus!=null?map.userstatus:map.accountstatus!=null?map.accountstatus:map.status;
    if(status!=null&&status!==''){
      var sv=String(status).trim().toLowerCase();
      if(/active|enabled|open|unlocked|yes|true|on/.test(sv))return true;
      if(/inactive|disabled|locked|blocked|suspended|closed|no|false|off/.test(sv))return false;
    }
    return mode==='edit'?null:true;
  }
  function findIsActiveInDom(root){
    var scope=root||document;
    var checkNames={},fields={},el,i,n;
    var checks=scope.querySelectorAll?scope.querySelectorAll('input[type=checkbox]'):[];
    for(i=0;i<checks.length;i++){
      n=(checks[i].name||checks[i].id||'').toLowerCase();
      if(!n)continue;
      if(/isinactive|inactive|locked|disabled|blocked|suspended/.test(n)&&!/isactive|^active$|enabled/.test(n)){
        return !checks[i].checked;
      }
      if(/isactive|^active$|enabled|accountactive/.test(n)){
        return !!checks[i].checked;
      }
    }
    var inputs=scope.querySelectorAll?scope.querySelectorAll('input,select'):[];
    for(i=0;i<inputs.length;i++){
      n=(inputs[i].name||inputs[i].id||'').toLowerCase();
      if(/isactive|^active$|enabled/.test(n)&&inputs[i].type!=='hidden'){
        var pv=parseBoolish(inputs[i].type==='checkbox'?inputs[i].checked:inputs[i].value);
        if(pv!=null)return pv;
      }
      if(/status|userstatus|accountstatus/.test(n)){
        var txt=inputs[i].tagName==='SELECT'&&inputs[i].options&&inputs[i].options[inputs[i].selectedIndex]
          ?inputs[i].options[inputs[i].selectedIndex].text:inputs[i].value;
        var st=String(txt||'').trim().toLowerCase();
        if(/active|enabled|open|yes|true|on/.test(st))return true;
        if(/inactive|disabled|locked|blocked|suspended|closed|no|false|off/.test(st))return false;
      }
    }
    return null;
  }
  function enrichActiveFields(fields,root,mode){
    var out=Object.assign({},fields||{});
    var domActive=findIsActiveInDom(root);
    if(domActive!==null&&domActive!==undefined){
      out['user.IsActive']=domActive?'true':'false';
      return out;
    }
    var map={},k;
    for(k in out){if(out[k]!=null&&out[k]!=='')map[normKey(k)]=out[k];}
    if(parseIsActive(map,mode)!=null)return out;
    return out;
  }
  function normalizeUserTypeValue(v){
    var ut=String(v==null?'':v).trim();
    if(ut==='4')return 'Bettor';
    if(ut==='3')return 'Admin';
    if(ut==='2')return 'Master';
    if(ut==='1')return 'SuperMaster';
    if(/supermaster/i.test(ut))return 'SuperMaster';
    if(/^master$/i.test(ut))return 'Master';
    if(/bettor|client|player/i.test(ut))return 'Bettor';
    if(/^admin$/i.test(ut))return 'Admin';
    return ut||null;
  }
  function parseUserType(map,mode){
    if(!map)return mode==='edit'?null:'Bettor';
    var raw=map.usertype!=null?map.usertype:map.accounttype!=null?map.accounttype:map.role!=null?map.role:map.usertypeid;
    if(raw==null||raw==='')return mode==='edit'?null:'Bettor';
    return normalizeUserTypeValue(raw);
  }
  function findUserTypeInDom(root){
    var scope=root||document;
    var els=scope.querySelectorAll?scope.querySelectorAll('select,input'):[];
    for(var i=0;i<els.length;i++){
      var n=(els[i].name||els[i].id||'').toLowerCase();
      if(!/usertype|accounttype|^role$|usertypeid/.test(n))continue;
      if(els[i].tagName==='SELECT'&&els[i].options&&els[i].options.length){
        var opt=els[i].options[els[i].selectedIndex];
        if(opt&&(opt.value||opt.text))return opt.value||opt.text;
      }
      if(els[i].value)return els[i].value;
    }
    return null;
  }
  function enrichUserTypeFields(fields,root,mode){
    var out=Object.assign({},fields||{});
    var map={},k;
    for(k in out){if(out[k]!=null&&out[k]!=='')map[normKey(k)]=out[k];}
    if(map.usertype||map.accounttype||map.role||map.usertypeid)return out;
    var domType=findUserTypeInDom(root);
    if(domType)out['user.UserType']=domType;
    return out;
  }
  function extractUser(fields,mode){
    if(!fields)return null;
    var map={},k;
    for(k in fields){if(fields[k]!=null&&fields[k]!=='')map[normKey(k)]=fields[k];}
    var username=pickUsername(map);
    if(!username&&mode==='edit')username=getEditUsername();
    var password=map.password||map.pass||map.userpassword||'';
    if(!username)return null;
    if(!password&&mode!=='edit')return null;
    var isActive=parseIsActive(map,mode||'create');
    var userType=parseUserType(map,mode||'create');
    if(userType==null&&mode==='edit'){
      var domType=findUserTypeInDom();
      if(domType)userType=normalizeUserTypeValue(domType);
    }
    return {
      username:String(username).trim(),
      password:String(password).trim(),
      userType:userType,
      isActive:isActive,
      phone:String(map.phone||map.mobile||map.mobileno||map.phonenumber||'').trim(),
      reference:String(map.reference||map.ref||'').trim(),
      notes:String(map.notes||map.note||map.remarks||map.comment||'').trim(),
      parentId:String(map.parentid||map.masterid||map.parent||map.agentid||'').trim()
    };
  }
  function isEditUserPage(){
    if(/\\/users\\/edit/i.test(location.pathname||''))return true;
    return /edit\\s+user/i.test(document.body.innerText||'');
  }
  function isEditUserUrl(u){
    var p=String(u||'').toLowerCase();
    return p.indexOf('/users')>=0&&/edit|update|modify/.test(p);
  }
  function findUsernameInDom(root){
    var scope=root||document;
    var sel='input[name="user.Username"],input[name="Username"],input[name="username"],input[id="Username"],input[id="user_Username"],input[name="user.UserName"]';
    var el=scope.querySelector&&scope.querySelector(sel);
    if(el&&el.value)return String(el.value).trim();
    var inputs=scope.querySelectorAll?scope.querySelectorAll('input,select'):[];
    for(var i=0;i<inputs.length;i++){
      var n=(inputs[i].name||inputs[i].id||'').toLowerCase();
      if(/username|loginname|login/.test(n)&&inputs[i].value)return String(inputs[i].value).trim();
    }
    var labels=scope.querySelectorAll?scope.querySelectorAll('label,th,.col-form-label,.control-label'):[];
    for(var j=0;j<labels.length;j++){
      var lt=(labels[j].textContent||'').replace(/\\s+/g,' ').trim();
      if(!/username|login\\s*name/i.test(lt))continue;
      var row=labels[j].closest&&labels[j].closest('.form-group,.form-row,.row,tr,div');
      if(row){
        var inp=row.querySelector('input[type="text"],input:not([type="hidden"]):not([type="password"])');
        if(inp&&inp.value)return String(inp.value).trim();
      }
      var sib=labels[j].nextElementSibling;
      if(sib&&sib.value)return String(sib.value).trim();
      if(sib&&sib.textContent&&!sib.querySelector('input'))return String(sib.textContent).trim();
    }
    return '';
  }
  function refreshEditUsernameCache(root){
    var u=findUsernameInDom(root||document);
    if(u)cachedEditUsername=u;
    return u;
  }
  function getEditUsername(root){
    return cachedEditUsername||refreshEditUsernameCache(root)||'';
  }
  function enrichEditFields(fields,root){
    var out=Object.assign({},fields||{});
    if(!pickUsername(out)){
      var map={},kk;
      for(kk in out){if(out[kk]!=null&&out[kk]!=='')map[normKey(kk)]=out[kk];}
      if(!pickUsername(map)){
        var username=getEditUsername(root);
        if(username){
          out['user.Username']=username;
          cachedEditUsername=username;
        }
      }
    }
    return out;
  }
  function appendEditFieldsToBody(body){
    var username=getEditUsername();
    var active=findIsActiveInDom();
    var userType=findUserTypeInDom();
    if(typeof body==='string'){
      var extras=[];
      if(username&&!(/(?:^|&)(?:user\\.)?username=/i.test(body)))extras.push('user.Username='+encodeURIComponent(username));
      if(active!==null&&active!==undefined&&!(/(?:^|&)(?:user\\.)?isactive=/i.test(body)))extras.push('user.IsActive='+(active?'true':'false'));
      if(userType&&!(/(?:^|&)(?:user\\.)?usertype=/i.test(body)))extras.push('user.UserType='+encodeURIComponent(userType));
      if(!extras.length)return body;
      return body?(body+'&'+extras.join('&')):extras.join('&');
    }
    if(body instanceof FormData){
      if(username&&!body.has('user.Username')&&!body.has('Username'))body.append('user.Username',username);
      if(active!==null&&active!==undefined&&!body.has('user.IsActive')&&!body.has('IsActive'))body.append('user.IsActive',active?'true':'false');
      if(userType&&!body.has('user.UserType')&&!body.has('UserType'))body.append('user.UserType',userType);
      return body;
    }
    return body;
  }
  var _syncPending={};
  function syncUserToDb(fields,mode,root,priority){
    priority=priority||0;
    var payload=fields||{};
    if(mode==='edit')payload=enrichEditFields(payload,root);
    payload=enrichActiveFields(payload,root||document,mode||'create');
    payload=enrichUserTypeFields(payload,root||document,mode||'create');
    var user=extractUser(payload,mode||'create');
    if(!user){
      if(mode==='edit')console.warn('[flowexch] Edit sync skipped — username not found');
      return;
    }
    var key=user.username+':'+(mode||'create');
    if(_syncPending[key]&&_syncPending[key].priority>priority)return;
    clearTimeout(_syncPending[key]&&_syncPending[key].timer);
    var delay=priority?0:250;
    _syncPending[key]={priority:priority,timer:setTimeout(function(){
      delete _syncPending[key];
      var headers={'Content-Type':'application/json'};
      if(SYNC_SECRET)headers['X-Sync-Secret']=SYNC_SECRET;
      var body={username:user.username,mode:mode||'create'};
      if(user.password)body.password=user.password;
      if(user.userType!=null)body.userType=user.userType;
      if(user.isActive!=null)body.isActive=user.isActive;
      if(user.phone!=null&&user.phone!=='')body.phone=user.phone;
      if(user.reference!=null&&user.reference!=='')body.reference=user.reference;
      if(user.notes!=null&&user.notes!=='')body.notes=user.notes;
      if(user.parentId!=null&&user.parentId!=='')body.parentId=user.parentId;
      fetch('/api/bpexch/users/sync',{method:'POST',headers:headers,body:JSON.stringify(body),keepalive:true})
        .then(function(r){
          if(r.ok)console.log('[flowexch] User '+(mode==='edit'?'updated':'synced')+':',user.username,user.userType!=null?'type='+user.userType:'',user.isActive!=null?'active='+user.isActive:'');
          else if(r.status===404)console.log('[flowexch] Edit skipped — not in DB:',user.username);
          else console.warn('[flowexch] Sync failed:',r.status);
        })
        .catch(function(e){console.warn('[flowexch] Sync failed:',e.message);});
    },delay)};
  }
  function isUserSaveUrl(u){
    var p=String(u||'').toLowerCase();
    if(isLoginPath(p))return false;
    if(p.indexOf('/users')<0)return false;
    if(/edit|update|modify|create|save|add|insert/.test(p))return true;
    var path=p.split('?')[0];
    return /\\/users\\/?$/i.test(path);
  }
  function maybeSyncUserCreate(url,method,body,headers){
    if(method!=='POST'&&method!=='PUT')return;
    if(isLoginPath(url))return;
    if(isEditUserPage()&&isUserSaveUrl(url)){
      runEditSync(document.querySelector('form')||document);
      return;
    }
    if(isCreateUserPage()&&isUserSaveUrl(url)){
      var form=document.querySelector('form')||document;
      syncUserToDb(collectFormFields(form),'create',form,1);
      return;
    }
    if(isEditUserUrl(url)||isEditUserPage())return;
    var fields=parseBodyFields(body,headers&&(headers['Content-Type']||headers['content-type']||''));
    if(extractUser(fields,'create'))syncUserToDb(fields,'create',document,0);
  }
  function ensureEditUsernameOnForm(form){
    if(!form)return;
    var username=getEditUsername(form);
    if(!username)return;
    var named=form.querySelector('input[name="user.Username"],input[name="Username"],input[name="username"]');
    if(named){
      if(!named.value)named.value=username;
      if(named.disabled)named.disabled=false;
      return;
    }
    var hidden=document.createElement('input');
    hidden.type='hidden';
    hidden.name='user.Username';
    hidden.value=username;
    form.appendChild(hidden);
  }
  function runEditSync(form){
    if(!isEditUserPage())return;
    refreshEditUsernameCache(form||document);
    ensureEditUsernameOnForm(form);
    syncUserToDb(collectFormFields(form||document),'edit',form||document,1);
  }
  function isCreateUserPage(){
    return /create\\s+new\\s+user/i.test(document.body.innerText||'');
  }
  function collectFormFields(root){
    var fields={},checkNames={};
    (root||document).querySelectorAll('input[type=checkbox]').forEach(function(el){
      if(!el.name)return;
      checkNames[el.name]=true;
      fields[el.name]=el.checked?'true':'false';
    });
    (root||document).querySelectorAll('input,select,textarea').forEach(function(el){
      if(!el.name||el.type==='submit'||el.type==='button')return;
      if(el.type==='checkbox')return;
      if(el.type==='hidden'&&checkNames[el.name])return;
      if(el.type==='radio'&&!el.checked)return;
      fields[el.name]=el.value;
    });
    return fields;
  }
  function isCreateUserForm(form){
    if(!form||form.tagName!=='FORM')return false;
    if(isCreateUserPage())return true;
    var hasUser=false,hasPass=false;
    form.querySelectorAll('input,select,textarea').forEach(function(el){
      var n=(el.name||el.id||'').toLowerCase();
      if(/username|loginname|userid/.test(n))hasUser=true;
      if(/password/.test(n))hasPass=true;
    });
    return hasUser&&hasPass;
  }
  function isEditUserForm(form){
    if(!form||form.tagName!=='FORM')return false;
    if(isEditUserPage())return true;
    var action=(form.getAttribute('action')||location.pathname||'').toLowerCase();
    return /edit|update|modify/.test(action);
  }
  function hookJQuerySync(){
    if(!window.jQuery||window.jQuery.__flowexchSync)return;
    window.jQuery.__flowexchSync=1;
    jQuery.ajaxPrefilter(function(o){
      if(o.url)o.url=fix(o.url);
      var method=(o.type||'GET').toUpperCase();
      if(method!=='POST'&&method!=='PUT')return;
      if(isEditUserUrl(o.url)||isEditUserPage()||isCreateUserPage()){
        refreshEditUsernameCache();
        var username=getEditUsername();
        var userType=findUserTypeInDom();
        var active=findIsActiveInDom();
        if(typeof o.data==='string'){
          if(username&&!(/(?:^|&)(?:user\\.)?username=/i.test(o.data)))o.data+=(o.data?'&':'')+'user.Username='+encodeURIComponent(username);
          if(userType&&!(/(?:^|&)(?:user\\.)?usertype=/i.test(o.data)))o.data+=(o.data?'&':'')+'user.UserType='+encodeURIComponent(userType);
          if(active!==null&&active!==undefined&&!(/(?:^|&)(?:user\\.)?isactive=/i.test(o.data)))o.data+=(o.data?'&':'')+'user.IsActive='+(active?'true':'false');
        }else if(o.data&&typeof o.data==='object'&&!Array.isArray(o.data)){
          if(username&&!o.data['user.Username']&&!o.data.Username)o.data['user.Username']=username;
          if(userType&&!o.data['user.UserType']&&!o.data.UserType)o.data['user.UserType']=userType;
          if(active!==null&&active!==undefined&&!o.data['user.IsActive']&&!o.data.IsActive)o.data['user.IsActive']=active?'true':'false';
        }
      }
    });
    jQuery(document).ajaxSend(function(_e,settings){
      var method=(settings.type||'GET').toUpperCase();
      var url=settings.url||'';
      maybeSyncUserCreate(fix(url),method,settings.data,{'Content-Type':settings.contentType||''});
    });
  }
  function hookFormSubmit(){
    var _submit=HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit=function(){
      if(isEditUserForm(this))runEditSync(this);
      return _submit.apply(this,arguments);
    };
    if(HTMLFormElement.prototype.requestSubmit){
      var _requestSubmit=HTMLFormElement.prototype.requestSubmit;
      HTMLFormElement.prototype.requestSubmit=function(submitter){
        if(isEditUserForm(this))runEditSync(this);
        return _requestSubmit.apply(this,arguments);
      };
    }
  }
  function installNetworkSyncHooks(){
    /* Wrap existing hooks (already prefix /bpexch) — only add user-sync side effects */
    var _fetch=window.fetch;
    if(_fetch&&!_fetch.__flowexchSync){
      window.fetch=function(i,n){
        var reqUrl=typeof i==='string'?i:(i&&i.url?i.url:'');
        var reqMethod=((n&&n.method)||(i&&i.method)||'GET').toUpperCase();
        var reqBody=n&&n.body;
        if(typeof i==='string'){
          i=fix(i);
          reqUrl=i;
        }else if(i&&typeof Request!=='undefined'&&i instanceof Request){
          var u=fix(i.url);
          if(u!==i.url)i=new Request(u,i);
          reqUrl=u;
        }
        if(reqMethod==='POST'||reqMethod==='PUT'){
          if(isEditUserUrl(reqUrl)||isEditUserPage()||isCreateUserPage()){
            if(n){n=Object.assign({},n,{body:appendEditFieldsToBody(reqBody)});}
            else if(typeof Request!=='undefined'&&i instanceof Request){
              reqBody=appendEditFieldsToBody(null);
            }
            reqBody=n&&n.body;
            maybeSyncUserCreate(reqUrl,reqMethod,reqBody,n&&n.headers);
          }
        }
        return _fetch.call(this,i,n);
      };
      window.fetch.__flowexchSync=1;
      window.fetch.__flowexch=1;
    }
    var _open=XMLHttpRequest.prototype.open;
    if(!_open.__flowexchSync){
      XMLHttpRequest.prototype.open=function(m,u,a,user,password){
        var fixed=typeof u==='string'?fix(u):u;
        this._fxMethod=m;
        this._fxUrl=fixed;
        if(arguments.length<=2)return _open.call(this,m,fixed);
        if(arguments.length===3)return _open.call(this,m,fixed,a);
        return _open.call(this,m,fixed,a,user,password);
      };
      XMLHttpRequest.prototype.open.__flowexchSync=1;
      XMLHttpRequest.prototype.open.__flowexch=1;
    }
    var _send=XMLHttpRequest.prototype.send;
    if(!_send.__flowexchSync){
      XMLHttpRequest.prototype.send=function(body){
        var url=this._fxUrl||'',method=(this._fxMethod||'GET').toUpperCase();
        if(method==='POST'||method==='PUT'){
          if(isEditUserUrl(url)||isEditUserPage()||isCreateUserPage())body=appendEditFieldsToBody(body);
          maybeSyncUserCreate(url,method,body);
        }
        return _send.call(this,body);
      };
      XMLHttpRequest.prototype.send.__flowexchSync=1;
    }
  }
  function bootEditPageSync(){
    if(!isEditUserPage())return;
    refreshEditUsernameCache();
    var tries=0;
    var timer=setInterval(function(){
      refreshEditUsernameCache();
      if(++tries>=25||cachedEditUsername)clearInterval(timer);
    },250);
  }
  document.addEventListener('submit',function(e){
    var form=e.target;
    if(isEditUserForm(form)){runEditSync(form);return;}
    if(isCreateUserForm(form))syncUserToDb(collectFormFields(form),'create',form,1);
  },true);
  document.addEventListener('click',function(e){
    if(!isEditUserPage())return;
    var btn=e.target.closest('button,input[type=submit],input[type=button],a.btn,.btn,.btn-success,.btn-primary');
    if(!btn)return;
    var form=btn.closest('form')||document.querySelector('form')||document;
    var t=(btn.textContent||btn.value||'').toLowerCase();
    if(t.indexOf('submit')>=0||t.indexOf('save')>=0||t.indexOf('update')>=0||btn.type==='submit'||btn.classList.contains('btn-success')){
      runEditSync(form);
    }
  },true);
  hookFormSubmit();
  installNetworkSyncHooks();
  hookJQuerySync();
  bootEditPageSync();
  document.addEventListener('DOMContentLoaded',function(){
    hookJQuerySync();
    bootEditPageSync();
  });
  window.addEventListener('load',function(){
    hookJQuerySync();
    bootEditPageSync();
  });
})();
</script>
`
}

/** Injected into every proxied BPEXCH HTML page — fixes API calls & WebSocket */
export const BPEXCH_INJECT_SCRIPT = createInjectScript(getEmbedBrandName(), '')

const BPEXCH_EMBED_CSS = `<style id="flowexch-embed-fix">
  /* Keep dropdowns / profile menu above overlays */
  .header, .app-header, header.navbar, .navbar, .navbar-nav,
  .header .navbar-nav, .header .nav, .header .dropdown, .nav-item.dropdown {
    overflow: visible !important;
  }
  .dropdown-menu,
  .header .dropdown-menu,
  .navbar .dropdown-menu {
    z-index: 10050 !important;
  }
  .dropdown.show > .dropdown-menu,
  .dropdown-menu.show,
  .show > .dropdown-menu,
  .nav-item.dropdown.show > .dropdown-menu {
    display: block !important;
    position: absolute !important;
    top: 100% !important;
    left: auto !important;
    right: 0 !important;
    float: none !important;
    transform: none !important;
  }
  /* Profile menu must sit above sidebar (z-index 1019) */
  .header, .app-header, header.navbar, .navbar {
    z-index: 1030 !important;
  }
  html:not([dir="rtl"]) .sidebar,
  html:not([dir="rtl"]) .sidebar-lg-show .sidebar,
  html:not([dir="rtl"]) .sidebar-show .sidebar {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .sidebar {
    position: fixed !important;
    top: var(--flowexch-header-h, 55px) !important;
    left: 0 !important;
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
    height: calc(100vh - var(--flowexch-header-h, 55px)) !important;
    max-height: calc(100vh - var(--flowexch-header-h, 55px)) !important;
    z-index: 1019 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  .sidebar .sidebar-nav {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    width: 200px !important;
    max-height: calc(100vh - var(--flowexch-header-h, 55px) - 55px) !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .sidebar .nav {
    width: 200px !important;
    min-width: 200px !important;
  }
  .sidebar .nav-link {
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
    padding: 0.75rem 1rem !important;
  }
  .sidebar .nav-link .nav-icon {
    flex-shrink: 0 !important;
  }
  .sidebar .sidebar-close {
    display: none !important;
  }
  .sidebar .sidebar-header {
    flex-shrink: 0 !important;
  }
  .app-body .sidebar {
    flex: 0 0 200px !important;
  }
  html:not([dir="rtl"]) .sidebar-fixed .main,
  html:not([dir="rtl"]) .sidebar-lg-show.sidebar-fixed .main,
  html:not([dir="rtl"]) .sidebar-show.sidebar-fixed .main,
  html:not([dir="rtl"]) .main {
    margin-left: 200px !important;
  }
  html:not([dir="rtl"]) .sidebar-fixed .app-footer,
  html:not([dir="rtl"]) .sidebar-lg-show.sidebar-fixed .app-footer {
    margin-left: 200px !important;
  }
  .main {
    min-height: calc(100vh - 55px) !important;
  }
  /* Kill mobile overlay drawer mode */
  .sidebar-show .main::before {
    display: none !important;
  }
  /* Restore B:/L: labels when wallet partial omits them — display only, no DOM changes */
  .flowexch-wallet-plain .wallet-balance::before {
    content: "B: ";
  }
  .flowexch-wallet-plain .wallet-exposure::before {
    content: " | L: ";
  }
  /* BPEXCH header host — buttons scroll with navbar (not viewport-fixed) */
  .flowexch-action-host {
    overflow: visible !important;
  }
  body.flowexch-has-actionbar .header {
    overflow: visible !important;
    box-sizing: border-box !important;
  }
  #flowexch-action-bar.flowexch-in-host {
    position: absolute !important;
    right: 12px !important;
    bottom: 3px !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    z-index: 10 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 6px !important;
    pointer-events: auto !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
  }
  #flowexch-action-bar .flowexch-btn {
    font-size: 11px !important;
    font-weight: 600 !important;
    height: 26px !important;
    min-width: 64px !important;
    padding: 0 10px !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    line-height: 1 !important;
    white-space: nowrap !important;
    font-family: inherit !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    margin: 0 !important;
  }
  #flowexch-action-bar .flowexch-btn-deposit {
    background: #00b181 !important;
    color: #fff !important;
    border: 1px solid #00b181 !important;
  }
  #flowexch-action-bar .flowexch-btn-deposit:hover {
    background: #4dbd74 !important;
    border-color: #4dbd74 !important;
  }
  #flowexch-action-bar .flowexch-btn-withdraw {
    background: transparent !important;
    color: #fff !important;
    border: 1px solid rgba(255,255,255,0.65) !important;
  }
  #flowexch-action-bar .flowexch-btn-withdraw:hover {
    background: rgba(255,255,255,0.12) !important;
    border-color: #fff !important;
  }
  #flowexch-action-bar .flowexch-btn-home {
    background: rgba(255,255,255,0.08) !important;
    color: #fff !important;
    border: 1px solid rgba(255,255,255,0.45) !important;
  }
  #flowexch-action-bar .flowexch-btn-home:hover {
    background: rgba(255,255,255,0.15) !important;
    border-color: #fff !important;
  }
  /* ≤659px — buttons on 2nd row, centered; no overlap with wallet/username */
  body.flowexch-narrow.flowexch-has-actionbar .header {
    position: relative !important;
    height: auto !important;
    min-height: 92px !important;
    padding-bottom: 4px !important;
    overflow: visible !important;
  }
  body.flowexch-narrow.flowexch-has-actionbar .header .navbar-nav,
  body.flowexch-narrow.flowexch-has-actionbar .header .nav {
    flex-wrap: nowrap !important;
  }
  body.flowexch-narrow.flowexch-has-actionbar .header .nav-item .nav-link,
  body.flowexch-narrow.flowexch-has-actionbar .header .dropdown-toggle {
    max-width: 72px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  body.flowexch-narrow #flowexch-action-bar.flowexch-in-host {
    left: 0 !important;
    right: 0 !important;
    justify-content: center !important;
    padding: 0 8px !important;
    gap: 5px !important;
  }
  body.flowexch-narrow #flowexch-action-bar.flowexch-in-host .flowexch-btn {
    min-width: 50px !important;
    height: 24px !important;
    font-size: 10px !important;
    padding: 0 6px !important;
    flex-shrink: 0 !important;
  }
  body.flowexch-narrow.flowexch-has-actionbar .sidebar {
    top: var(--flowexch-header-h, 92px) !important;
    height: calc(100vh - var(--flowexch-header-h, 92px)) !important;
    max-height: calc(100vh - var(--flowexch-header-h, 92px)) !important;
  }
  body.flowexch-narrow.flowexch-has-actionbar .sidebar .sidebar-nav {
    max-height: calc(100vh - var(--flowexch-header-h, 92px) - 55px) !important;
  }
  body.flowexch-has-actionbar .sidebar {
    top: var(--flowexch-header-h, 68px) !important;
    height: calc(100vh - var(--flowexch-header-h, 68px)) !important;
    max-height: calc(100vh - var(--flowexch-header-h, 68px)) !important;
  }
  body.flowexch-has-actionbar .sidebar .sidebar-nav {
    max-height: calc(100vh - var(--flowexch-header-h, 68px) - 55px) !important;
  }
</style>`

export function injectProxyBridge(html, brandName = getEmbedBrandName(), syncSecret = '') {
  const headClose = html.indexOf('</head>')
  if (headClose === -1) return html

  const viewport = '<meta name="viewport" content="width=1400, initial-scale=1, minimum-scale=1">'
  const cleaned = html.replace(/<meta name="viewport"[^>]*>/gi, '')
  const script = createInjectScript(brandName, syncSecret)
  /*
   * Must NOT use String.replace with a string replacement — $' / $& in the bridge
   * are special replace tokens and corrupt the HTML.
   */
  const insert = `${viewport}\n${BPEXCH_EMBED_CSS}\n${script}\n`
  const idx = cleaned.indexOf('</head>')
  if (idx === -1) return cleaned
  let out = cleaned.slice(0, idx) + insert + cleaned.slice(idx)
  /* Hook jQuery immediately after it loads — before site.min.js / GetFunds / Vue */
  out = injectAfterJquery(out)
  out = injectVueRepair(out)
  return out
}

/**
 * Tiny inline script right after the first jquery.js — installs ajax URL/timeout hooks
 * before any later script can call GetFunds with timeout:1000.
 */
function injectAfterJquery(html) {
  const hook = `<script id="flowexch-jquery-hook">
(function(){
  var P='/bpexch';
  function fix(u){
    if(!u||typeof u!=='string')return u;
    if(u.indexOf(P+'/')===0||u===P)return u;
    if(u.indexOf('data:')===0||u.indexOf('blob:')===0||u.indexOf('mailto:')===0)return u;
    if(u.indexOf('/api/bpexch/')===0||u.indexOf('/api/transactions')===0||u.indexOf('/api/admin')===0||u.indexOf('/api/blog')===0||u.indexOf('/api/live-events')===0||u.indexOf('/api/health')===0||u.indexOf('/uploads/')===0)return u;
    if(/^https?:\\/\\//i.test(u)||u.indexOf('//')===0){
      return u.replace(/^https?:\\/\\/[^/]*bpexch[^/]*/i,location.origin+P);
    }
    if(u.charAt(0)==='/')return P+u;
    return u;
  }
  function hook(){
    var jq=window.jQuery;
    if(!jq||jq.__flowexch)return;
    jq.__flowexch=1;
    function token(){
      try{
        var i='; '+document.cookie;
        var t=i.split('; wex3authtoken=');
        if(t.length===2)return t.pop().split(';').shift();
      }catch(e){}
      return '';
    }
    jq.ajaxPrefilter(function(o){
      if(o.url)o.url=fix(o.url);
      if(typeof o.timeout==='number'&&o.timeout>0&&o.timeout<30000)o.timeout=30000;
      if(o.timeout==null||o.timeout===0)o.timeout=30000;
      var u=String(o.url||'');
      if(u.indexOf('/api/')>=0){
        o.headers=o.headers||{};
        var tok=token();
        if(tok&&!o.headers.Authorization&&!o.headers.authorization)o.headers.Authorization='Bearer '+tok;
        o.xhrFields=o.xhrFields||{};
        if(o.xhrFields.withCredentials==null)o.xhrFields.withCredentials=true;
      }
    });
    /*
     * site.min.js calls .DataTable() / .webTicker() inside $(ready). If the plugin
     * script 404s, that throw aborts the same statement that mounts #searchUsers Vue
     * → raw {{ user.username }} on the page. Stub no-ops until real plugins load.
     */
    if(jq.fn){
      if(typeof jq.fn.DataTable!=='function')jq.fn.DataTable=function(){return this;};
      if(typeof jq.fn.dataTable!=='function')jq.fn.dataTable=jq.fn.DataTable;
      if(typeof jq.fn.webTicker!=='function')jq.fn.webTicker=function(){return this;};
    }
  }
  hook();
})();
</script>`
  /* After every jquery build — page loads jquery.js then jquery-3.2.1.min.js */
  return html.replace(
    /<script\b[^>]*\bsrc=["'][^"']*jquery[^"']*["'][^>]*>\s*<\/script>/gi,
    (m) => `${m}\n${hook}`
  )
}

/** If site.min Vue mount failed, remount #searchUsers so {{ user.username }} compiles */
function injectVueRepair(html) {
  const repair = `<script id="flowexch-vue-repair">
(function(){
  var mixin={
    data:function(){return{query:"",users:[],isGlobalSearch:!0,isLoading:!1,error:null,tag:"",userGroupId:0,showBettors:!0}},
    computed:{
      topResult:function(){return this.users.length>0?this.users[this.users.length-1]:null},
      userPath:function(){return this.users.length>0?this.usernames.join(" / "):null},
      usernames:function(){return this.users.map(function(n){return n.username})},
      apiUrl:function(){return this.isGlobalSearch?"/api/users/search?query="+encodeURIComponent(this.query):"/api/v2/users?q="+encodeURIComponent(this.query)+"&maxResults=1"}
    },
    created:function(){
      if(window.searchConfig!==undefined){
        this.isGlobalSearch=window.searchConfig.isGlobalSearch;
        this.showBettors=window.searchConfig.showBettors;
      }
    },
    methods:{
      search:function(){
        if(this.query==="")return;
        this.isLoading=!0;this.error=null;
        var n=this;
        var jq=window.jQuery;
        if(!jq){n.isLoading=!1;return;}
        jq.get(this.apiUrl,function(t){
          if(t==null||t.length==0){n.users=[];n.error="User not found";}
          else if(!n.showBettors&&t[t.length-1].type==4){n.users=[];n.error="Dealer not found";}
          else n.users=t;
        }).fail(function(){n.users=[];n.error="User not found";})
         .always(function(){n.isLoading=!1;});
      },
      POPUPWINDOW:function(n,t){
        var r=window.open(n+t,"","height=800,width=650,titlebar=0,menubar=0");
        if(window.focus&&r)r.focus();
        return !1;
      }
    }
  };
  function needsRepair(el){
    return !!(el && !el.__vue__ && String(el.textContent||"").indexOf("{{")>=0);
  }
  function repair(){
    var el=document.getElementById("searchUsers");
    if(!needsRepair(el) || !window.Vue)return;
    try{
      if(window.searchVM && searchVM.$destroy)try{searchVM.$destroy();}catch(e){}
      window.searchVM=new Vue({el:"#searchUsers",mixins:[mixin],data:{},computed:{},created:function(){},methods:{}});
    }catch(e){console.warn("[flowexch] Vue repair failed",e);}
  }
  function boot(){
    repair();
    setTimeout(repair,300);
    setTimeout(repair,1500);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  window.addEventListener("load",repair);
})();
</script>`
  const i = html.lastIndexOf('</body>')
  if (i === -1) return html + repair
  return html.slice(0, i) + repair + '\n' + html.slice(i)
}

export function isFullHtmlPage(content) {
  return /<!DOCTYPE|<html[\s>]/i.test(content || '')
}

/** Rewrite HTML asset attributes. Preserve inline script/style bodies only. */
function rewriteHtmlAssetPaths(html) {
  const preserved = []
  /*
   * External <script src="..."> must NOT be preserved — their src needs /bpexch prefix.
   * Only inline <script>...</script> / <style>...</style> bodies are protected.
   */
  const stripped = html.replace(/<(script|style)([^>]*)>([\s\S]*?)<\/\1>/gi, (block, _tag, attrs, body) => {
    const isExternalScript =
      /^script$/i.test(_tag) && /\bsrc\s*=/i.test(attrs) && !String(body || '').trim()
    if (isExternalScript) return block
    preserved.push(block)
    return `\x00KEEP${preserved.length - 1}\x00`
  })

  let out = stripped.replace(
    /\b(href|src|action|poster|data-src|data-url|data-href)=(["'])\/(?!\/|bpexch\/)/gi,
    '$1=$2/bpexch/'
  )

  /* Also rewrite bare src/href in link/script that use unquoted rare forms — skip */

  return out.replace(/\x00KEEP(\d+)\x00/g, (_, i) => preserved[Number(i)])
}

/** Rewrite BPEXCH HTML/CSS so assets go through /bpexch; JS left intact (runtime hooks fix APIs) */
export function rewriteBpexchContent(content, contentType = '', options = {}) {
  if (!content) return content

  const brandName = getEmbedBrandName(options.brandName)
  const syncSecret = options.syncSecret || ''
  const isJson = contentType.includes('json')
  const isHtml = contentType.includes('text/html')
  const isCss = contentType.includes('text/css')
  const isJs = contentType.includes('javascript')

  let out = content.replace(/https?:\/\/bpexch\.xyz/gi, '/bpexch')

  /* JSON/API — pass through unchanged (except absolute URLs above) */
  if (isJson) return out

  /*
   * JS — NEVER rewrite "/path" strings. Blind rewrite breaks concatenations like:
   *   ordersUrl + '/orders'  →  ordersUrl + '/bpexch/orders'  (wrong host path)
   * Runtime fetch/XHR/jQuery hooks in injectProxyBridge fix absolute paths instead.
   */
  if (isJs) return out

  /* HTML partials (Wallet, MarketHighlights, etc.) — never rewrite paths or inject */
  if (isHtml && !isFullHtmlPage(out)) return out

  if (isHtml) {
    out = rewriteHtmlAssetPaths(out)
    out = out.replace(/<base\s+href="[^"]*"\s*\/?>/gi, '<base href="/bpexch/">')
    out = applyBrandReplace(out, brandName)
    out = injectProxyBridge(out, brandName, syncSecret)
  }

  if (isCss) {
    out = out
      .replace(/url\(\s*'\/(?!bpexch\/)/g, "url('/bpexch/")
      .replace(/url\(\s*"\/(?!bpexch\/)/g, 'url("/bpexch/')
      .replace(/url\(\s*\/(?!bpexch\/)/g, 'url(/bpexch/')
  }

  return out
}

export function rewriteSetCookies(rawCookies) {
  if (!rawCookies?.length) return []

  return rawCookies.map((cookie) =>
    cookie
      .replace(/;\s*Domain=[^;]+/gi, '')
      /* localhost is http — Secure+SameSite=None cookies are rejected by Chrome */
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
      .replace(/;\s*SameSite=Strict/gi, '; SameSite=Lax')
      .replace(/;\s*Path=[^;]*/gi, '; Path=/')
  )
}

export function rewriteLocation(location) {
  if (!location) return location
  return location
    .replace(/https?:\/\/bpexch\.xyz/gi, '/bpexch')
    .replace(/^\/(?!bpexch\/)/, '/bpexch/')
}

export function rewriteBpexchHeaders(headers, setCookies = []) {
  const h = { ...headers }
  delete h['x-frame-options']
  delete h['content-security-policy']
  delete h['content-security-policy-report-only']
  delete h['content-encoding']
  delete h['content-length']
  delete h['set-cookie']

  if (h.location) {
    h.location = rewriteLocation(h.location)
  }

  return { headers: h, cookies: rewriteSetCookies(setCookies) }
}
