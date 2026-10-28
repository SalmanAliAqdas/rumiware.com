// ====== EDIT THESE ======
const WHATSAPP = "923331902030";   // country code + number, no + or spaces
const PHONE = "+923331902030";   // number shown for calls
const EASYPAISA = "+923331902030";  // Easypaisa account number
const JAZZCASH = "+923331902030";   // JazzCash account number
const ACCOUNT_NAME = "Mani Bakes"; // account title
// ========================
const MENU = [
 {c:"Cakes",e:"🎂",n:"Chocolate Fudge Cake",d:"Rich chocolate sponge, ganache, per pound",p:1800},
 {c:"Cakes",e:"🍰",n:"Red Velvet Cake",d:"Cream cheese frosting, per pound",p:2000},
 {c:"Cakes",e:"🎂",n:"Vanilla Fresh Cream Cake",d:"Soft sponge with fruit, per pound",p:1600},
 {c:"Cakes",e:"✨",n:"Custom Theme Cake",d:"Fondant or cream design, per pound from",p:2500},
 {c:"Pastries",e:"🥐",n:"Chocolate Pastry",d:"Single slice with ganache",p:250},
 {c:"Pastries",e:"🍓",n:"Strawberry Pastry",d:"Fresh cream and strawberry",p:250},
 {c:"Pastries",e:"🍮",n:"Tiramisu Cup",d:"Coffee soaked, creamy, in a cup",p:450},
 {c:"Cupcakes",e:"🧁",n:"Cupcakes (box of 6)",d:"Vanilla or chocolate, buttercream",p:1200},
 {c:"Cupcakes",e:"🧁",n:"Cupcakes (box of 12)",d:"Mixed flavours, buttercream",p:2200},
 {c:"Cookies & Brownies",e:"🍪",n:"Choc Chip Cookies (6)",d:"Soft centre, crisp edges",p:700},
 {c:"Cookies & Brownies",e:"🍫",n:"Fudgy Brownies (6)",d:"Dense, chocolatey, with walnuts",p:900},
 {c:"Bread & Savoury",e:"🍞",n:"Milk Bread Loaf",d:"Soft homemade loaf",p:350},
 {c:"Bread & Savoury",e:"🥟",n:"Chicken Patties (6)",d:"Flaky pastry, spiced filling",p:800},
 {c:"Bread & Savoury",e:"🥖",n:"Dinner Rolls (12)",d:"Buttery and soft",p:600}
];
const $=s=>document.querySelector(s);
const cats=["All",...new Set(MENU.map(m=>m.c))];
let cur="All";
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),1600)};
function renderTabs(){ $("#tabs").innerHTML=cats.map(c=>`<button type="button" class="tab" aria-pressed="${c===cur}" data-c="${c}">${c}</button>`).join("") }
function renderMenu(){
  $("#menuGrid").innerHTML=MENU.map((m,i)=>({m,i})).filter(o=>cur==="All"||o.m.c===cur).map(({m,i})=>
   `<article class="item"><div class="em">${m.e}</div><h3>${m.n}</h3><p>${m.d}</p><div class="pr"><span>Rs ${m.p.toLocaleString()}</span><button type="button" class="btn" data-add="${i}">Add</button></div></article>`).join("");
}
$("#items").innerHTML=MENU.map((m,i)=>`<label class="qty"><span>${m.n} (Rs ${m.p})</span><input type="number" min="0" max="50" value="0" inputmode="numeric" data-q="${i}" aria-label="Quantity of ${m.n}"></label>`).join("");
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(b){cur=b.dataset.c;renderTabs();renderMenu()}});
$("#menuGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;const q=document.querySelector(`[data-q="${b.dataset.add}"]`);q.value=+q.value+1;toast(MENU[b.dataset.add].n+" added to order")});
// links
document.querySelectorAll("[data-call]").forEach(a=>a.href="tel:+"+WHATSAPP);
document.querySelectorAll("[data-wa]").forEach(a=>a.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Assalam o Alaikum, I would like to order from Mani Bakes.")}`);
$("#phoneTxt").textContent=PHONE;$("#yr").textContent=new Date().getFullYear();
// form
const f=$("#orderForm");
const d=new Date();d.setDate(d.getDate()+1);f.date.min=d.toISOString().slice(0,10);
function sync(){
  const home=f.del.value==="Home delivery";$("#addrLbl").style.display=home?"grid":"none";
  const p=f.pay.value;
  $("#payNote").textContent=p==="Cash"?"Pay in cash on delivery or pickup.":`Send payment to ${p==="Easypaisa"?EASYPAISA:JAZZCASH} (${ACCOUNT_NAME}) and share the screenshot on WhatsApp.`;
}
f.addEventListener("change",sync);sync();
f.addEventListener("submit",e=>{
  e.preventDefault();const err=$("#err");err.textContent="";
  const lines=[...document.querySelectorAll("[data-q]")].filter(q=>+q.value>0).map(q=>({m:MENU[q.dataset.q],q:+q.value}));
  if(!f.name.value.trim()||!f.phone.value.trim()||!f.date.value){err.textContent="Please enter your name, phone number and date.";return}
  if(!lines.length){err.textContent="Please choose at least one item, using Add on the menu or the quantities above.";return}
  if(f.del.value==="Home delivery"&&!f.addr.value.trim()){err.textContent="Please enter your delivery address.";return}
  const total=lines.reduce((s,l)=>s+l.m.p*l.q,0);
  const msg=["*New order - Mani Bakes*",`Name: ${f.name.value.trim()}`,`Phone: ${f.phone.value.trim()}`,"",...lines.map(l=>`- ${l.q} x ${l.m.n} = Rs ${l.m.p*l.q}`),`Estimated total: Rs ${total} (excluding delivery)`,"",f.msg.value.trim()&&`Cake message/design: ${f.msg.value.trim()}`,`Needed on: ${f.date.value}`,`${f.del.value}${f.del.value==="Home delivery"?": "+f.addr.value.trim():""}`,`Payment: ${f.pay.value}`,f.notes.value.trim()&&`Notes: ${f.notes.value.trim()}`].filter(x=>x!==""&&x!==false&&x!==undefined).join("\n");
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
toast("Opening WhatsApp...");
// Try a new tab first; if the browser blocks it, open in the same tab
const w = window.open(url, "_blank");
if (!w) window.location.href = url;
});
renderTabs();renderMenu();
