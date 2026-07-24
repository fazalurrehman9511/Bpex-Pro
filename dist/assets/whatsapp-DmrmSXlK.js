import{j as e}from"./api-D3UQ6Hff.js";import{n as t,r as n}from"./countries-byzMxxOg.js";import{t as r}from"./paymentMethods-bdDPdI8h.js";var i={PK:void 0,IN:void 0,AE:void 0,SA:void 0,GB:void 0,US:void 0,BD:void 0,SUPPORT:void 0,DEFAULT:`923001234567`},a=i.SUPPORT||i.DEFAULT;function o(){return a||i.SUPPORT||i.DEFAULT}async function s(){try{let t=await e(),n=String(t?.whatsapp||``).replace(/[^\d]/g,``);n&&(a=n)}catch(e){console.warn(`Support WhatsApp load failed, using fallback:`,e.message)}return o()}var c={register:`register on BpxPro`,login:`login to my BpxPro account`,contact:`contact my betting agent`,deposit:`add balance to my account`,withdraw:`withdraw from my account`},l=[{id:`hello`,label:`Say hello`,text:`Hi BpxPro! 👋

I need help with my account.
Please assist me.`},{id:`register`,label:`Register account`,text:`Hi BpxPro! 👋

I want to register a new account.
Please help me get started.`},{id:`deposit`,label:`Add balance`,text:`Hi BpxPro! 👋

I want to add balance to my account.
Please share deposit details.`},{id:`withdraw`,label:`Withdraw`,text:`Hi BpxPro! 👋

I want to make a withdrawal.
Please assist me.`}];l[0].text,l[1].text,l[2].text,l[3].text;function u({name:e,phone:i,intent:a=`register`,countryCode:o=`PK`,paymentMethod:s}){let l=c[a]||c.register,u=t(o),d=n(o),f=`Hi, I'd like to ${l}.\n\n`;if(f+=`Country: ${u.flag} ${u.name}\n`,f+=`Name: ${e}\n`,f+=`Phone: ${i}`,s){let e=r(s);e&&(f+=`\nPayment Method: ${e.name}`)}return`https://wa.me/${d}?text=${encodeURIComponent(f)}`}function d(e){return`https://wa.me/${o()}?text=${encodeURIComponent(e)}`}function f({name:e,phone:t,intent:n=`register`,countryCode:r=`PK`,paymentMethod:i}){window.open(u({name:e,phone:t,intent:n,countryCode:r,paymentMethod:i}),`_blank`,`noopener,noreferrer`)}function p(e){window.open(d(e),`_blank`,`noopener,noreferrer`)}export{f as n,s as r,p as t};