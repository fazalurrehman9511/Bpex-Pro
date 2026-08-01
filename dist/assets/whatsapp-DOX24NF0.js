import{M as e}from"./api-PddSKxz1.js";import{n as t,r as n}from"./countries-B9zOJVG6.js";import{t as r}from"./paymentMethods-bdDPdI8h.js";var i=`bpex_support_whatsapp`,a={PK:void 0,IN:void 0,AE:void 0,SA:void 0,GB:void 0,US:void 0,BD:void 0,SUPPORT:void 0,DEFAULT:``};function o(){try{return String(localStorage.getItem(i)||``).replace(/[^\d]/g,``)}catch{return``}}function s(e){try{e&&localStorage.setItem(i,e)}catch{}}var c=o()||a.SUPPORT||a.DEFAULT||``;function l(){return c||a.SUPPORT||a.DEFAULT}async function u(){try{let t=await e(),n=String(t?.whatsapp||``).replace(/[^\d]/g,``);if(n)return c=n,s(n),n}catch(e){console.warn(`Support WhatsApp load failed, using fallback:`,e.message)}return c||=o()||a.SUPPORT||a.DEFAULT||``,l()}var d={register:`register on BpxPro`,login:`login to my BpxPro account`,contact:`contact my betting agent`,deposit:`add balance to my account`,withdraw:`withdraw from my account`},f=[{id:`hello`,label:`Say hello`,text:`Hi BpxPro! 👋

I need help with my account.
Please assist me.`},{id:`register`,label:`Register account`,text:`Hi BpxPro! 👋

I want to register a new account.
Please help me get started.`},{id:`deposit`,label:`Add balance`,text:`Hi BpxPro! 👋

I want to add balance to my account.
Please share deposit details.`},{id:`withdraw`,label:`Withdraw`,text:`Hi BpxPro! 👋

I want to make a withdrawal.
Please assist me.`}];f[0].text,f[1].text,f[2].text,f[3].text;function p({name:e,phone:i,intent:a=`register`,countryCode:o=`PK`,paymentMethod:s}){let c=d[a]||d.register,l=t(o),u=n(o),f=`Hi, I'd like to ${c}.\n\n`;if(f+=`Country: ${l.flag} ${l.name}\n`,f+=`Name: ${e}\n`,f+=`Phone: ${i}`,s){let e=r(s);e&&(f+=`\nPayment Method: ${e.name}`)}return`https://wa.me/${u}?text=${encodeURIComponent(f)}`}function m(e){return`https://wa.me/${l()}?text=${encodeURIComponent(e)}`}function h({name:e,phone:t,intent:n=`register`,countryCode:r=`PK`,paymentMethod:i}){window.open(p({name:e,phone:t,intent:n,countryCode:r,paymentMethod:i}),`_blank`,`noopener,noreferrer`)}async function g(e){if(await loadSupportWhatsAppNumber(),!l())throw Error(`Support WhatsApp number is not configured`);window.open(m(e),`_blank`,`noopener,noreferrer`)}export{u as i,g as n,h as r,f as t};