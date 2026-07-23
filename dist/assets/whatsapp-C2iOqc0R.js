import{C as e}from"./index-sC8tY7TZ.js";import{n as t,r as n}from"./countries-DQm7HrlS.js";import{t as r}from"./paymentMethods-bdDPdI8h.js";var i={register:`register on BpxPro`,login:`login to my BpxPro account`,contact:`contact my betting agent`,deposit:`add balance to my account`,withdraw:`withdraw from my account`},a=[{id:`hello`,label:`Say hello`,text:`Hi BpxPro! 👋

I need help with my account.
Please assist me.`},{id:`register`,label:`Register account`,text:`Hi BpxPro! 👋

I want to register a new account.
Please help me get started.`},{id:`deposit`,label:`Add balance`,text:`Hi BpxPro! 👋

I want to add balance to my account.
Please share deposit details.`},{id:`withdraw`,label:`Withdraw`,text:`Hi BpxPro! 👋

I want to make a withdrawal.
Please assist me.`}];a[0].text,a[1].text,a[2].text,a[3].text;function o({name:e,phone:a,intent:o=`register`,countryCode:s=`PK`,paymentMethod:c}){let l=i[o]||i.register,u=t(s),d=n(s),f=`Hi, I'd like to ${l}.\n\n`;if(f+=`Country: ${u.flag} ${u.name}\n`,f+=`Name: ${e}\n`,f+=`Phone: ${a}`,c){let e=r(c);e&&(f+=`\nPayment Method: ${e.name}`)}return`https://wa.me/${d}?text=${encodeURIComponent(f)}`}function s(t,r){return`https://wa.me/${n(r||e())}?text=${encodeURIComponent(t)}`}function c({name:e,phone:t,intent:n=`register`,countryCode:r=`PK`,paymentMethod:i}){window.open(o({name:e,phone:t,intent:n,countryCode:r,paymentMethod:i}),`_blank`,`noopener,noreferrer`)}function l(e){window.open(s(e),`_blank`,`noopener,noreferrer`)}export{c as n,l as t};