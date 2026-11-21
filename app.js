'use strict';
/* SafeWord — family protection from AI voice-clone scams.
   Everything runs locally on this device. No accounts, no servers, no tracking.
   The codeword and family details never leave this phone. */

/* ---------------- Codeword generator ---------------- */
const WORDS = ['mango','banana','coconut','river','mountain','bicycle','umbrella','elephant','tiger','parrot','lotus','jasmine','monsoon','harvest','copper','silver','marble','velvet','candle','lantern','window','garden','market','sunrise','rainbow','thunder','breeze','island','forest','meadow','harbour','compass','anchor','saddle','basket','button','pocket','mirror','ladder','bridge','tunnel','rocket','planet','comet','walnut','almond','pepper','ginger','saffron','turmeric','cardamom','violin','trumpet','blanket','pillow','curtain','carpet','bottle','kettle','spoon','hammer','needle','thread','paper','pencil'];
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function generateCodeword(){
  const used = new Set(); const parts = [];
  while (parts.length < 3){ const w = pick(WORDS); if (!used.has(w)){ used.add(w); parts.push(w[0].toUpperCase()+w.slice(1)); } }
  return parts.join(' ') + ' ' + (2 + Math.floor(Math.random()*8));
}

/* ---------------- Scam message checker ---------------- */
/* Pattern labels in 3 languages; weights reflect how specific the trick is. */
const PATTERNS = [
 { id:'digital_arrest', w:42, label:{en:'“Digital arrest” / fake officer threat', hi:'“डिजिटल अरेस्ट” / नकली अधिकारी की धमकी', ml:'"ഡിജിറ്റൽ അറസ്റ്റ്" / വ്യാജ ഉദ്യോഗസ്ഥ ഭീഷണി'},
   re:/digital arrest|under arrest|arrest warrant|money laundering|your (aadhaar|aadhar|sim|mobile number|name) (was|is|has been) (used|found|linked)|cbi officer|customs (department|officer)|narcotics|fir (has been|is) (registered|filed|lodged) against|police.*video call|video call.*(police|cbi|court)/i },
 { id:'otp', w:26, label:{en:'Asks for an OTP, PIN, CVV or password', hi:'OTP, PIN, CVV या पासवर्ड माँगता है', ml:'OTP, PIN, CVV അല്ലെങ്കിൽ പാസ്‌വേഡ് ചോദിക്കുന്നു'},
   re:/\botp\b|one[- ]time password|share the (code|otp|pin)|verification code|cvv|card (number|details)|your pin|atm pin|password/i },
 { id:'family_emergency', w:24, label:{en:'Fake family emergency (accident / hospital / arrest / lost phone)', hi:'नकली पारिवारिक इमरजेंसी (दुर्घटना / अस्पताल / गिरफ़्तारी / खोया फ़ोन)', ml:'വ്യാജ കുടുംബ അടിയന്തരാവസ്ഥ (അപകടം / ആശുപത്രി / അറസ്റ്റ് / ഫോൺ നഷ്ടപ്പെട്ടു)'},
   re:/been in an accident|met with an accident|i am in (the )?(hospital|jail)|admitted in (the )?hospital|i lost my phone|this is my new number|my phone (is )?(lost|dead|broken)|kidnapped|ransom|bail (money|amount)|in police custody|i'?m in trouble,? (please )?help/i },
 { id:'authority', w:20, label:{en:'Claims to be police / bank / government official', hi:'पुलिस / बैंक / सरकारी अधिकारी होने का दावा', ml:'പോലീസ് / ബാങ്ക് / സർക്കാർ ഉദ്യോഗസ്ഥനാണെന്ന് അവകാശപ്പെടുന്നു'},
   re:/\bpolice\b|\bcbi\b|cyber cell|income tax|reserve bank|\brbi\b|\btrai\b|bank officer|verification officer|court notice|legal action will be taken|customs department/i },
 { id:'payment_redflag', w:20, label:{en:'Payment by UPI to a stranger, gift cards or crypto', hi:'अजनबी को UPI, गिफ़्ट कार्ड या क्रिप्टो से भुगतान', ml:'അപരിചിതന് UPI വഴിയോ ഗിഫ്റ്റ് കാർഡ് വഴിയോ ക്രിപ്റ്റോ വഴിയോ പണം'},
   re:/gift ?cards?|google play card|crypto|bitcoin|\busdt\b|upi id|paytm|phonepe|gpay|wallet address|scan (the|this) qr/i },
 { id:'secrecy', w:18, label:{en:'Secrecy pressure — “don’t tell anyone”', hi:'गोपनीयता का दबाव — “किसी को मत बताना”', ml:'രഹസ്യ സമ്മർദ്ദം — "ആരോടും പറയരുത്"'},
   re:/don'?t tell anyone|do not tell (anyone|anybody)|keep (this|it) (a )?secret|between (you and me|us)|no one should know|secret (operation|mission|case)|किसी को मत|गुप्त रख|ആരോടും പറയരുത്|രഹസ്യമാക്കി/i },
 { id:'money', w:18, label:{en:'Asks you to send / transfer money', hi:'पैसे भेजने / ट्रांसफ़र करने को कहता है', ml:'പണം അയക്കാനോ കൈമാറാനോ പറയുന്നു'},
   re:/send (money|₹|rs\.?|inr|the amount)|transfer (money|₹|rs\.?|the amount|funds)|deposit (the |₹|rs\.?)? ?(amount|money)|pay(ment)? of (₹|rs\.?|inr)|refundable (deposit|fee|amount|security)|(₹|rs\.?|inr)\s?\d[\d,]{2,}.*(send|transfer|pay|deposit)|(pay|send|transfer|deposit).{0,25}(fee|fees|charge|charges)/i },
 { id:'urgency', w:15, label:{en:'Extreme urgency — no time to think', hi:'अत्यधिक जल्दबाज़ी — सोचने का समय नहीं', ml:'അമിത തിരക്ക് — ചിന്തിക്കാൻ സമയമില്ല'},
   re:/immediately|right now|within \d+ (minutes|mins|hours)|urgent(ly)?|last chance|will expire|act now|before \d+ (pm|am|o'?clock)|तुरंत|अभी के अभी|ഉടൻ തന്നെ|അടിയന്തരമായി/i },
 { id:'video_pressure', w:16, label:{en:'Orders you to stay on a video call / under surveillance', hi:'वीडियो कॉल पर बने रहने / निगरानी का आदेश', ml:'വീഡിയോ കോളിൽ തുടരാനോ നിരീക്ഷണത്തിലാണെന്നോ ഉത്തരവ്'},
   re:/stay on (the )?(video )?call|do not disconnect|keep (the )?camera on|under (video )?surveillance|remain on (the )?call|don'?t (cut|end) the call/i },
 { id:'job_offer', w:24, label:{en:'Too-good job / task offer (earn by liking, registration fee)', hi:'अत्यधिक आकर्षक नौकरी / टास्क ऑफ़र (लाइक से कमाई, पंजीकरण शुल्क)', ml:'അമിത ആകർഷകമായ ജോലി / ടാസ്ക് ഓഫർ (ലൈക്ക് ചെയ്ത് സമ്പാദ്യം, രജിസ്ട്രേഷൻ ഫീസ്)'},
   re:/earn (₹|rs\.?)?\s?\d[\d,]* (per day|daily|per task)|like (videos|posts|reels).{0,30}(earn|income|₹)|work from home.{0,40}(earn|₹\s?\d)|registration fee|security deposit.{0,20}job|part[- ]time job.{0,30}(whatsapp|telegram)/i },
 { id:'prize', w:26, label:{en:'Lottery / prize / lucky draw claim', hi:'लॉटरी / इनाम / लकी ड्रॉ का दावा', ml:'ലോട്ടറി / സമ്മാനം / ലക്കി ഡ്രോ അവകാശവാദം'},
   re:/you (have )?won|lottery|prize money|claim your (prize|reward|amount)|lucky draw|\bkbc\b|congratulations.{0,30}(won|winner|prize)/i },
 { id:'threat', w:14, label:{en:'Threats — arrest, blocked account/SIM, legal action', hi:'धमकियाँ — गिरफ़्तारी, ब्लॉक खाता/SIM, कानूनी कार्रवाई', ml:'ഭീഷണികൾ — അറസ്റ്റ്, ബ്ലോക്ക് ചെയ്ത അക്കൗണ്ട്/SIM, നിയമ നടപടി'},
   re:/will be arrested|legal consequences|account will be (blocked|frozen|suspended|closed)|sim will be (blocked|deactivated)|connection will be (disconnected|cut)|you will be (arrested|jailed|prosecuted)/i },
 { id:'link', w:10, label:{en:'Link to click (often fake websites)', hi:'क्लिक करने का लिंक (अक्सर नकली वेबसाइटें)', ml:'ക്ലിക്ക് ചെയ്യാനുള്ള ലിങ്ക് (പലപ്പോഴും വ്യാജ വെബ്‌സൈറ്റുകൾ)'},
   re:/https?:\/\/|bit\.ly|tinyurl|tiny\.cc|click (here|the link|this link)|tap the link|open this link/i }
];
function analyzeMessage(text){
  const hits = [];
  let score = 0;
  for (const p of PATTERNS){ if (p.re.test(text)){ hits.push(p); score += p.w; } }
  score = Math.min(100, score);
  let level = 'low';
  if (score >= 70) level = 'crit'; else if (score >= 35) level = 'high'; else if (score >= 20) level = 'mid';
  if (hits.some(h => h.id === 'digital_arrest')) level = 'crit';
  return { score, level, hits };
}

/* ---------------- State ---------------- */
const KEY = 'safeword_v1';
let S = { v:1, setupDone:false, familyName:'', codeword:'', question:'', answer:'', members:[], best:{}, panicLog:[], settings:{ lang:'en', theme:'light' } };
if (typeof localStorage !== 'undefined'){ try { const raw = localStorage.getItem(KEY); if (raw){ const p = JSON.parse(raw); if (p && p.v === 1) S = Object.assign(S, p); } } catch(e){} }
function save(){ if (typeof localStorage === 'undefined') return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
if (typeof window !== 'undefined') window.__lang = S.settings.lang || 'en';

const $view = () => document.getElementById('view');
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function lang(){ return (typeof window !== 'undefined' && window.__lang) || 'en'; }
function L(obj){ return (obj && (obj[lang()] || obj.en)) || ''; }

/* ---------------- Navigation ---------------- */
let currentView = 'home';
function go(view){ currentView = view; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view)); render(); window.scrollTo(0,0); }
function render(){
  const v = $view(); if (!v) return;
  if (currentView === 'home') v.innerHTML = viewHome();
  else if (currentView === 'setup') v.innerHTML = viewSetup();
  else if (currentView === 'drill') v.innerHTML = viewDrillList();
  else if (currentView === 'panic') v.innerHTML = viewPanic();
  else if (currentView === 'check') v.innerHTML = viewCheck();
  else if (currentView === 'learn') v.innerHTML = viewLearn();
  else if (currentView === 'help') v.innerHTML = viewHelp();
  bindView();
}
function applyStatic(){
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.documentElement.lang = lang();
}
function setLang(l){ window.__lang = l; S.settings.lang = l; save(); const sel = document.getElementById('langSel'); if (sel) sel.value = l; applyStatic(); render(); }
function setTheme(th){ S.settings.theme = th; save(); document.documentElement.setAttribute('data-theme', th === 'dark' ? 'dark' : 'light'); document.getElementById('themeBtn').textContent = th === 'dark' ? '☀️' : '🌙'; }

/* ---------------- Home ---------------- */
function memberCallButtons(){
  if (!S.members.length) return '<p class="muted">' + esc(t('no_members')) + '</p>';
  return S.members.map(m => '<div class="member-row"><div style="flex:1"><strong>' + esc(m.name) + '</strong>' + (m.phone ? '<div class="muted">' + esc(m.phone) + '</div>' : '') + '</div>' + (m.phone ? '<a class="call-btn" href="tel:' + esc(m.phone.replace(/[^+\d]/g,'')) + '">📞 ' + esc(m.name.split(' ')[0]) + '</a>' : '') + '</div>').join('');
}
function viewHome(){
  if (!S.setupDone){
    return '<div class="card"><h2>' + esc(t('welcome_title')) + '</h2><p class="big">' + esc(t('welcome_text')) + '</p>' +
      '<button class="btn big-btn" data-act="go" data-to="setup">' + esc(t('setup_cta')) + '</button></div>' +
      '<div class="card"><h3>' + esc(t('how_protects')) + '</h3><ol class="steps"><li>' + esc(t('hp_1')) + '</li><li>' + esc(t('hp_2')) + '</li><li>' + esc(t('hp_3')) + '</li></ol></div>' +
      '<div class="card"><h3>' + esc(t('check_home_title')) + '</h3><p>' + esc(t('check_home_text')) + '</p><button class="btn ghost" data-act="go" data-to="check">' + esc(t('go_check')) + '</button></div>';
  }
  const bestTxt = Object.keys(S.best).length ? '<p class="muted">' + esc(t('best_score')) + ': ' + Object.entries(S.best).map(([k,v]) => v + '%').join(' · ') + '</p>' : '';
  return '<div class="card"><h2>' + esc(t('protected_title')) + '</h2>' +
    (S.familyName ? '<p class="big"><strong>' + esc(S.familyName) + '</strong></p>' : '') +
    '<p class="muted" style="margin-bottom:2px">' + esc(t('family_word')) + '</p>' +
    '<div class="codeword-box"><span class="codeword hidden-word" id="cwText">' + esc(S.codeword) + '</span><div><button class="btn ghost" data-act="reveal" id="revealBtn">' + esc(t('tap_reveal')) + '</button> <button class="btn ghost" data-act="copy-cw">' + esc(t('copy_word')) + '</button></div></div>' +
    (S.question ? '<p><strong>' + esc(t('backup_q_label')) + ':</strong><br>' + esc(S.question) + '<br><span class="muted">' + esc(S.answer) + '</span></p>' : '') +
    '<button class="btn ghost" data-act="go" data-to="setup">' + esc(t('edit_family')) + '</button></div>' +
    '<div class="card"><h3>⚖️ ' + esc(t('golden_rule')) + '</h3><p class="big">' + esc(t('golden_text')) + '</p></div>' +
    '<div class="card"><h3>' + esc(t('members_title')) + '</h3>' + memberCallButtons() + '</div>' +
    '<div class="card"><h3>' + esc(t('drill_home_title')) + '</h3><p>' + esc(t('drill_home_text')) + '</p>' + bestTxt + '<button class="btn" data-act="go" data-to="drill">' + esc(t('start_drill')) + '</button></div>' +
    '<div class="card"><h3>' + esc(t('check_home_title')) + '</h3><p>' + esc(t('check_home_text')) + '</p><button class="btn ghost" data-act="go" data-to="check">' + esc(t('go_check')) + '</button></div>' +
    '<div class="card no-print"><h3>' + esc(t('print_card')) + '</h3><label style="font-weight:400"><input type="checkbox" id="incWord" style="width:auto"> ' + esc(t('include_word')) + '</label><button class="btn ghost" data-act="print">' + esc(t('print_btn')) + '</button></div>' +
    '<div class="print-card"><h2>🛡️ ' + esc(t('card_title')) + '</h2><p><strong>' + esc(S.familyName) + '</strong></p><p>' + esc(t('card_rule')) + '</p><p>🆘 1930 · cybercrime.gov.in</p><div id="printWord"></div></div>';
}

/* ---------------- Setup wizard ---------------- */
let wiz = null;
function startWizard(){
  wiz = { step:0, familyName:S.familyName||'', codeword:S.codeword||'', question:S.question||'', answer:S.answer||'',
          members: (S.members.length ? S.members.map(m => ({name:m.name, phone:m.phone})) : [{name:'', phone:''}]) };
}
function wizMemberRows(){
  return wiz.members.map((m,i) => '<div class="member-row"><input type="text" data-mem="' + i + '" data-f="name" placeholder="' + esc(t('m_name')) + '" value="' + esc(m.name) + '"><input type="tel" data-mem="' + i + '" data-f="phone" placeholder="' + esc(t('m_phone')) + '" value="' + esc(m.phone) + '"><button class="del" data-act="mem-del" data-i="' + i + '" aria-label="Remove">✕</button></div>').join('');
}
function viewSetup(){
  if (!wiz) startWizard();
  const stepsTotal = 4;
  const head = '<div class="card"><h2>' + esc(t('setup_title')) + '</h2><p class="muted">' + esc(t('step_of')) + ' ' + (wiz.step+1) + ' ' + esc(t('of')) + ' ' + stepsTotal + '</p><div class="progress"><i style="width:' + ((wiz.step+1)/stepsTotal*100) + '%"></i></div>';
  let body = '';
  if (wiz.step === 0){
    body = '<label>' + esc(t('fam_name')) + '</label><input type="text" id="wFam" value="' + esc(wiz.familyName) + '">' +
      '<h3>' + esc(t('cw_title')) + '</h3><p>' + esc(t('cw_explain')) + '</p>' +
      '<div class="codeword-box"><span class="codeword" id="wCw">' + esc(wiz.codeword || '—') + '</span></div>' +
      '<button class="btn" data-act="gen">' + esc(t('generate')) + '</button>' +
      '<label>' + esc(t('or_own')) + '</label><input type="text" id="wOwn" placeholder="' + esc(t('own_ph')) + '">';
  } else if (wiz.step === 1){
    body = '<h3>' + esc(t('q_title')) + '</h3><p>' + esc(t('q_explain')) + '</p>' +
      '<label>' + esc(t('q_title')) + '</label><input type="text" id="wQ" placeholder="' + esc(t('q_ph')) + '" value="' + esc(wiz.question) + '">' +
      '<label>' + esc(t('backup_q_label')) + '</label><input type="text" id="wA" placeholder="' + esc(t('a_ph')) + '" value="' + esc(wiz.answer) + '">';
  } else if (wiz.step === 2){
    body = '<h3>' + esc(t('members_step')) + '</h3><p>' + esc(t('members_explain')) + '</p><div id="memRows">' + wizMemberRows() + '</div>' +
      '<button class="btn ghost" data-act="mem-add">' + esc(t('add_member')) + '</button>';
  } else {
    body = '<h3>' + esc(t('teach_title')) + '</h3><ol class="steps"><li>' + esc(t('teach_1')) + '</li><li>' + esc(t('teach_2')) + '</li><li>' + esc(t('teach_3')) + '</li></ol>' +
      '<div class="codeword-box"><div class="muted">' + esc(t('family_word')) + '</div><span class="codeword">' + esc(wiz.codeword) + '</span></div>';
  }
  const nav = '<div style="margin-top:14px">' +
    (wiz.step > 0 ? '<button class="btn ghost" data-act="wback">' + esc(t('back')) + '</button>' : '') +
    (wiz.step < 3 ? '<button class="btn" data-act="wnext">' + esc(t('next')) + '</button>' : '<button class="btn ok" data-act="wfinish">' + esc(t('finish')) + '</button>') + '</div>';
  return head + body + nav + '</div>';
}
function wizCollect(){
  if (!wiz) return;
  if (wiz.step === 0){
    const fam = document.getElementById('wFam'); if (fam) wiz.familyName = fam.value.trim();
    const own = document.getElementById('wOwn'); if (own && own.value.trim()) wiz.codeword = own.value.trim();
  } else if (wiz.step === 1){
    const q = document.getElementById('wQ'); if (q) wiz.question = q.value.trim();
    const a = document.getElementById('wA'); if (a) wiz.answer = a.value.trim();
  } else if (wiz.step === 2){
    document.querySelectorAll('[data-mem]').forEach(inp => { const i = +inp.dataset.mem; wiz.members[i][inp.dataset.f] = inp.value.trim(); });
  }
}

/* ---------------- Panic flow ---------------- */
function viewPanic(){
  const calls = S.members.length ? S.members.filter(m => m.phone).map(m => '<a class="call-btn" href="tel:' + esc(m.phone.replace(/[^+\d]/g,'')) + '">📞 ' + esc(m.name) + '</a>').join(' ') : '<p class="muted">' + esc(t('no_members')) + '</p>';
  return '<div class="card panic-hero"><h2>🚨 ' + esc(t('panic_title')) + '</h2><p>' + esc(t('panic_sub')) + '</p></div>' +
    '<div class="card"><h3>1. ' + esc(t('p1_title')) + '</h3><div class="say">' + esc(t('p1_say')) + '</div>' +
    (S.codeword ? '<p class="muted">' + esc(t('family_word')) + ': <strong>' + esc(S.codeword) + '</strong></p>' : '') +
    '<h3>2. ' + esc(t('p2_title')) + '</h3><p>' + esc(t('p2_text')) + '</p>' +
    '<h3>3. ' + esc(t('p3_title')) + '</h3><p>' + esc(t('p3_text')) + '</p><p>' + calls + '</p>' +
    '<h3>' + esc(t('p_outcome')) + '</h3>' +
    '<button class="btn ok" data-act="outcome" data-o="safe">' + esc(t('o_safe')) + '</button>' +
    '<button class="btn bad" data-act="outcome" data-o="scam">' + esc(t('o_scam')) + '</button>' +
    '<button class="btn ghost" data-act="outcome" data-o="unsure">' + esc(t('o_unsure')) + '</button>' +
    '<p id="outcomeMsg" class="muted"></p></div>' +
    '<div class="card"><h3>🆘 ' + esc(t('help_title')) + '</h3><p><a class="btn bad" href="tel:1930">' + esc(t('call_1930')) + '</a> <a class="btn ghost" href="https://cybercrime.gov.in" target="_blank" rel="noopener">' + esc(t('visit_portal')) + '</a></p></div>';
}

/* ---------------- Check a message ---------------- */
function viewCheck(){
  return '<div class="card"><h2>' + esc(t('check_title')) + '</h2><p>' + esc(t('check_intro')) + '</p>' +
    '<textarea id="chkText" placeholder="' + esc(t('paste_ph')) + '"></textarea>' +
    '<button class="btn big-btn" data-act="analyze">' + esc(t('analyze')) + '</button><div id="chkResult"></div></div>';
}
function renderCheckResult(r){
  const verdictTxt = { low:t('v_low'), mid:t('v_mid'), high:t('v_high'), crit:t('v_crit') }[r.level];
  const flags = r.hits.length ? r.hits.map(h => '<div class="flag">🚩 ' + esc(L(h.label)) + '</div>').join('') : '<p>' + esc(t('no_flags')) + '</p>';
  return '<div class="verdict ' + (r.level === 'low' ? 'low' : r.level === 'mid' ? 'mid' : 'high') + '"><div>' + esc(t('score_label')) + ': <strong>' + r.score + ' / 100</strong></div><p style="margin:6px 0 0">' + esc(verdictTxt) + '</p></div>' +
    '<h3>' + esc(t('flags_found')) + '</h3>' + flags +
    '<h3>' + esc(t('do_now')) + '</h3><ol class="steps"><li>' + esc(t('do_1')) + '</li><li>' + esc(t('do_2')) + '</li><li>' + esc(t('do_3')) + '</li><li>' + esc(t('do_4')) + '</li></ol>';
}

/* ---------------- Learn & Help ---------------- */
function viewLearn(){
  const flags = [1,2,3,4,5,6].map(i => '<li>' + esc(t('flag_' + i)) + '</li>').join('');
  return '<div class="card"><h2>' + esc(t('learn_title')) + '</h2>' +
    '<h3>🎙️ ' + esc(t('how_title')) + '</h3><p>' + esc(t('how_text')) + '</p>' +
    '<h3>📹 ' + esc(t('da_title')) + '</h3><p>' + esc(t('da_text')) + '</p>' +
    '<h3>🚩 ' + esc(t('flags_title')) + '</h3><ul>' + flags + '</ul>' +
    '<h3>🗝️ ' + esc(t('why_title')) + '</h3><p>' + esc(t('why_text')) + '</p></div>';
}
function viewHelp(){
  return '<div class="card"><h2>🆘 ' + esc(t('help_title')) + '</h2><ol class="steps"><li>' + esc(t('help_1')) + '</li><li>' + esc(t('help_2')) + '</li><li>' + esc(t('help_3')) + '</li><li>' + esc(t('help_4')) + '</li></ol>' +
    '<p><a class="btn bad" href="tel:1930">' + esc(t('call_1930')) + '</a> <a class="btn ghost" href="https://cybercrime.gov.in" target="_blank" rel="noopener">' + esc(t('visit_portal')) + '</a></p>' +
    '<p class="muted">' + esc(t('help_note')) + '</p></div>';
}

/* ---------------- Practice drills ---------------- */
const ACTIONS = ['act_ask_word','act_ask_q','act_hangup','act_send','act_stay','act_secret'];
const SCENARIOS = [
{ id:'accident',
  title:{en:'“Mum, I\'ve had an accident”', hi:'“माँ, मेरा एक्सीडेंट हो गया”', ml:'"അമ്മേ, എനിക്ക് അപകടം പറ്റി"'},
  caller:{en:'A new number, claiming to be your son', hi:'एक नया नंबर, आपके बेटे होने का दावा', ml:'ഒരു പുതിയ നമ്പർ, നിങ്ങളുടെ മകനാണെന്ന് അവകാശപ്പെടുന്നു'},
  steps:[
   { msg:{en:'Mum?? It\'s me! I\'ve had an accident, I\'m in hospital. I need ₹40,000 right now for the operation, please hurry!',
          hi:'माँ?? मैं हूँ! मेरा एक्सीडेंट हो गया है, मैं अस्पताल में हूँ। ऑपरेशन के लिए मुझे अभी ₹40,000 चाहिए, जल्दी करो!',
          ml:'അമ്മേ?? ഞാനാണ്! എനിക്ക് അപകടം പറ്റി, ഞാൻ ആശുപത്രിയിലാണ്. ഓപ്പറേഷന് ഇപ്പോൾ തന്നെ ₹40,000 വേണം, വേഗം!'},
     choices:['act_ask_word','act_send','act_stay'], best:'act_ask_word',
     why:{en:'The voice sounds exactly like your son — that means nothing now. The codeword is the only proof. A real son knows it instantly.',
          hi:'आवाज़ बिल्कुल आपके बेटे जैसी है — अब इसका कोई मतलब नहीं। कोडवर्ड ही एकमात्र सबूत है। असली बेटा इसे तुरंत बता देगा।',
          ml:'ശബ്ദം നിങ്ങളുടെ മകന്റേത് പോലെ തന്നെ തോന്നുന്നു — ഇപ്പോൾ അതിന് അർത്ഥമില്ല. കോഡ്‌വേഡ് മാത്രമാണ് തെളിവ്. യഥാർത്ഥ മകന് അത് ഉടൻ അറിയാം.'} },
   { msg:{en:'What word?? Mum, please, it hurts so much, don\'t waste time! The doctor is waiting!',
          hi:'कौन सा शब्द?? माँ, प्लीज़, बहुत दर्द हो रहा है, समय बर्बाद मत करो! डॉक्टर इंतज़ार कर रहा है!',
          ml:'എന്ത് വാക്ക്?? അമ്മേ, പ്ലീസ്, ഒരുപാട് വേദനിക്കുന്നു, സമയം കളയരുത്! ഡോക്ടർ കാത്തിരിക്കുകയാണ്!'},
     choices:['act_send','act_hangup','act_secret'], best:'act_hangup',
     why:{en:'Failed the codeword = failed verification. Excuses and pain are part of the script. Hang up and call your son\'s saved number yourself.',
          hi:'कोडवर्ड नहीं बता पाया = सत्यापन विफल। बहाने और दर्द इस स्क्रिप्ट का हिस्सा हैं। फ़ोन काटें और बेटे के सेव नंबर पर खुद कॉल करें।',
          ml:'കോഡ്‌വേഡ് പറയാൻ കഴിഞ്ഞില്ല = പരിശോധന പരാജയപ്പെട്ടു. ഒഴികഴിവുകളും വേദനയും ഈ സ്ക്രിപ്റ്റിന്റെ ഭാഗമാണ്. ഫോൺ വെച്ച് മകന്റെ സേവ് ചെയ്ത നമ്പറിലേക്ക് സ്വയം വിളിക്കൂ.'} },
   { msg:{en:'(Calling again) Mum, if you don\'t pay in 10 minutes they won\'t operate! Don\'t tell Dad, he\'ll panic!',
          hi:'(फिर से कॉल) माँ, अगर 10 मिनट में पैसे नहीं दिए तो ऑपरेशन नहीं होगा! पापा को मत बताना, वो घबरा जाएँगे!',
          ml:'(വീണ്ടും വിളിക്കുന്നു) അമ്മേ, 10 മിനിറ്റിനുള്ളിൽ പണം കൊടുത്തില്ലെങ്കിൽ ഓപ്പറേഷൻ നടക്കില്ല! അച്ഛനോട് പറയരുത്, അദ്ദേഹം പരിഭ്രാന്തനാകും!'},
     choices:['act_hangup','act_send','act_ask_q'], best:'act_hangup',
     why:{en:'More urgency + secrecy = classic scam pressure. Verification already failed once. Only your own callback on the saved number counts now.',
          hi:'और जल्दबाज़ी + गोपनीयता = क्लासिक स्कैम दबाव। सत्यापन एक बार विफल हो चुका है। अब सिर्फ़ सेव नंबर पर आपकी खुद की कॉल ही मायने रखती है।',
          ml:'കൂടുതൽ തിരക്കും രഹസ്യവും = ക്ലാസിക് തട്ടിപ്പ് സമ്മർദ്ദം. പരിശോധന ഒരിക്കൽ പരാജയപ്പെട്ടു. ഇനി സേവ് ചെയ്ത നമ്പറിലേക്കുള്ള നിങ്ങളുടെ സ്വന്തം കോൾ മാത്രമേ പ്രധാനമുള്ളൂ.'} }
  ]},
{ id:'digital_arrest',
  title:{en:'The “digital arrest” officer', hi:'“डिजिटल अरेस्ट” वाला अधिकारी', ml:'"ഡിജിറ്റൽ അറസ്റ്റ്" ഉദ്യോഗസ്ഥൻ'},
  caller:{en:'A video call from a man in a police uniform', hi:'पुलिस वर्दी में एक व्यक्ति की वीडियो कॉल', ml:'പോലീസ് യൂണിഫോമിലുള്ള ഒരാളുടെ വീഡിയോ കോൾ'},
  steps:[
   { msg:{en:'I am Inspector Sharma, Cyber Cell. Your Aadhaar was used in a money laundering case. You are under digital arrest. Stay on this video call and do not tell anyone.',
          hi:'मैं इंस्पेक्टर शर्मा, साइबर सेल से हूँ। आपके आधार का इस्तेमाल मनी लॉन्ड्रिंग केस में हुआ है। आप डिजिटल अरेस्ट में हैं। इस वीडियो कॉल पर बने रहें और किसी को न बताएँ।',
          ml:'ഞാൻ ഇൻസ്പെക്ടർ ശർമ്മ, സൈബർ സെൽ. നിങ്ങളുടെ ആധാർ ഒരു കള്ളപ്പണം വെളുപ്പിക്കൽ കേസിൽ ഉപയോഗിച്ചു. നിങ്ങൾ ഡിജിറ്റൽ അറസ്റ്റിലാണ്. ഈ വീഡിയോ കോളിൽ തുടരൂ, ആരോടും പറയരുത്.'},
     choices:['act_stay','act_hangup','act_secret'], best:'act_hangup',
     why:{en:'“Digital arrest” does not exist. Indian police never arrest by video call, never order secrecy, and never take money on a call. Hanging up is always safe.',
          hi:'“डिजिटल अरेस्ट” जैसी कोई चीज़ नहीं होती। भारतीय पुलिस वीडियो कॉल से गिरफ़्तार नहीं करती, गोपनीयता का आदेश नहीं देती, और कॉल पर पैसे कभी नहीं लेती। फ़ोन काटना हमेशा सुरक्षित है।',
          ml:'"ഡിജിറ്റൽ അറസ്റ്റ്" എന്നൊന്നില്ല. ഇന്ത്യൻ പോലീസ് വീഡിയോ കോൾ വഴി അറസ്റ്റ് ചെയ്യില്ല, രഹസ്യം പാലിക്കാൻ ഉത്തരവിടില്ല, കോളിൽ പണം വാങ്ങില്ല. ഫോൺ വെയ്ക്കുന്നത് എപ്പോഴും സുരക്ഷിതമാണ്.'} },
   { msg:{en:'If you disconnect, a warrant will be issued and officers will come to your home today!',
          hi:'अगर आपने कॉल काटा तो वारंट जारी होगा और अधिकारी आज ही आपके घर आएँगे!',
          ml:'നിങ്ങൾ കോൾ വിച്ഛേദിച്ചാൽ വാറണ്ട് പുറപ്പെടുവിക്കും, ഉദ്യോഗസ്ഥർ ഇന്ന് തന്നെ നിങ്ങളുടെ വീട്ടിലെത്തും!'},
     choices:['act_hangup','act_secret','act_stay'], best:'act_hangup',
     why:{en:'Threats are the script. A real case is handled at a police station, in writing — never by scaring you on a video call. Hang up; if you want, visit your local station or call 1930.',
          hi:'धमकियाँ स्क्रिप्ट का हिस्सा हैं। असली केस थाने में, लिखित रूप में होता है — वीडियो कॉल पर डराकर कभी नहीं। फ़ोन काटें; चाहें तो स्थानीय थाने जाएँ या 1930 पर कॉल करें।',
          ml:'ഭീഷണികൾ സ്ക്രിപ്റ്റിന്റെ ഭാഗമാണ്. യഥാർത്ഥ കേസ് പോലീസ് സ്റ്റേഷനിൽ, എഴുതിയാണ് നടക്കുന്നത് — വീഡിയോ കോളിൽ ഭയപ്പെടുത്തിയല്ല. ഫോൺ വെയ്ക്കൂ; വേണമെങ്കിൽ അടുത്തുള്ള സ്റ്റേഷനിൽ പോകൂ അല്ലെങ്കിൽ 1930-ലേക്ക് വിളിക്കൂ.'} },
   { msg:{en:'To clear your name, transfer ₹1,50,000 to this verification account. It will be refunded after checking.',
          hi:'अपना नाम साफ़ करने के लिए इस सत्यापन खाते में ₹1,50,000 ट्रांसफ़र करें। जाँच के बाद वापस कर दिया जाएगा।',
          ml:'നിങ്ങളുടെ പേര് മായ്ക്കാൻ ഈ പരിശോധനാ അക്കൗണ്ടിലേക്ക് ₹1,50,000 കൈമാറൂ. പരിശോധനയ്ക്ക് ശേഷം തിരികെ നൽകും.'},
     choices:['act_send','act_hangup','act_stay'], best:'act_hangup',
     why:{en:'Police never take “verification” money. This transfer is the entire scam. Hang up and report the number on 1930.',
          hi:'पुलिस कभी “सत्यापन” के पैसे नहीं लेती। यह ट्रांसफ़र ही पूरा स्कैम है। फ़ोन काटें और 1930 पर नंबर रिपोर्ट करें।',
          ml:'പോലീസ് ഒരിക്കലും "പരിശോധന" പണം വാങ്ങില്ല. ഈ കൈമാറ്റമാണ് മുഴുവൻ തട്ടിപ്പും. ഫോൺ വെച്ച് 1930-ൽ നമ്പർ റിപ്പോർട്ട് ചെയ്യൂ.'} }
  ]},
{ id:'lost_phone',
  title:{en:'“Dad, I lost my phone abroad”', hi:'“पापा, विदेश में मेरा फ़ोन खो गया”', ml:'"അച്ഛാ, വിദേശത്ത് എന്റെ ഫോൺ നഷ്ടപ്പെട്ടു"'},
  caller:{en:'A WhatsApp message from an unknown number, claiming to be your daughter', hi:'अज्ञात नंबर से WhatsApp संदेश, आपकी बेटी होने का दावा', ml:'അജ്ഞാത നമ്പറിൽ നിന്ന് WhatsApp സന്ദേശം, നിങ്ങളുടെ മകളാണെന്ന് അവകാശപ്പെടുന്നു'},
  steps:[
   { msg:{en:'Hi Dad, it\'s me. I lost my phone in Dubai 😢 This is my friend\'s number. I need ₹25,000 for a new ticket home, please send fast.',
          hi:'हाय पापा, मैं हूँ। दुबई में मेरा फ़ोन खो गया 😢 यह मेरी दोस्त का नंबर है। घर के नए टिकट के लिए मुझे ₹25,000 चाहिए, जल्दी भेजो।',
          ml:'ഹായ് അച്ഛാ, ഞാനാണ്. ദുബായിൽ എന്റെ ഫോൺ നഷ്ടപ്പെട്ടു 😢 ഇത് എന്റെ സുഹൃത്തിന്റെ നമ്പറാണ്. വീട്ടിലേക്കുള്ള പുതിയ ടിക്കറ്റിന് എനിക്ക് ₹25,000 വേണം, വേഗം അയക്കൂ.'},
     choices:['act_send','act_ask_word','act_stay'], best:'act_ask_word',
     why:{en:'“Lost phone, new number” is the most common opening of this scam. The codeword works by message too — a real daughter can type it.',
          hi:'“फ़ोन खो गया, नया नंबर” इस स्कैम की सबसे आम शुरुआत है। कोडवर्ड संदेश में भी काम करता है — असली बेटी इसे टाइप कर सकती है।',
          ml:'"ഫോൺ നഷ്ടപ്പെട്ടു, പുതിയ നമ്പർ" ഈ തട്ടിപ്പിന്റെ ഏറ്റവും സാധാരണമായ തുടക്കമാണ്. കോഡ്‌വേഡ് സന്ദേശത്തിലും പ്രവർത്തിക്കും — യഥാർത്ഥ മകൾക്ക് അത് ടൈപ്പ് ചെയ്യാം.'} },
   { msg:{en:'Dad, I can\'t remember any word right now, I\'m crying at the airport. Please just send it, I\'ll explain later.',
          hi:'पापा, मुझे अभी कोई शब्द याद नहीं आ रहा, मैं एयरपोर्ट पर रो रही हूँ। बस भेज दो, बाद में समझाऊँगी।',
          ml:'അച്ഛാ, എനിക്ക് ഇപ്പോൾ ഒരു വാക്കും ഓർമ്മ വരുന്നില്ല, ഞാൻ എയർപോർട്ടിൽ കരയുകയാണ്. അയച്ചാൽ മതി, പിന്നീട് വിശദീകരിക്കാം.'},
     choices:['act_ask_q','act_send','act_secret'], best:'act_ask_q',
     why:{en:'Good — this is exactly what the backup question is for. Only real family knows the answer. Tears are easy to fake; family memories are not.',
          hi:'बहुत बढ़िया — बैकअप सवाल ठीक इसी के लिए है। जवाब सिर्फ़ असली परिवार जानता है। आँसू नकली हो सकते हैं; परिवार की यादें नहीं।',
          ml:'നല്ലത് — ബാക്കപ്പ് ചോദ്യം കൃത്യമായി ഇതിനാണ്. യഥാർത്ഥ കുടുംബത്തിന് മാത്രമേ ഉത്തരം അറിയൂ. കണ്ണീർ വ്യാജമാക്കാം; കുടുംബ ഓർമ്മകൾ പറ്റില്ല.'} },
   { msg:{en:'Why are you asking me questions?? Are you even my dad? Just send the money NOW.',
          hi:'आप मुझसे सवाल क्यों पूछ रहे हैं?? क्या आप सच में मेरे पापा हैं? बस पैसे अभी भेजो।',
          ml:'എന്തിനാണ് എന്നോട് ചോദ്യങ്ങൾ ചോദിക്കുന്നത്?? നിങ്ങൾ ശരിക്കും എന്റെ അച്ഛനാണോ? പണം ഇപ്പോൾ തന്നെ അയക്കൂ.'},
     choices:['act_send','act_hangup','act_stay'], best:'act_hangup',
     why:{en:'Anger at being verified is a scammer\'s tell — real family understands the rule, they agreed to it. Stop, and contact your daughter through a channel you already trust.',
          hi:'सत्यापन पर गुस्सा स्कैमर की पहचान है — असली परिवार नियम समझता है, वे इससे सहमत थे। रुकें, और बेटी से उस माध्यम से संपर्क करें जिस पर आपको पहले से भरोसा है।',
          ml:'പരിശോധനയിൽ ദേഷ്യം തട്ടിപ്പുകാരന്റെ ലക്ഷണമാണ് — യഥാർത്ഥ കുടുംബം നിയമം മനസ്സിലാക്കുന്നു, അവർ അതിന് സമ്മതിച്ചതാണ്. നിർത്തൂ, നിങ്ങൾക്ക് ഇതിനകം വിശ്വാസമുള്ള മാർഗ്ഗത്തിലൂടെ മകളെ ബന്ധപ്പെടൂ.'} }
  ]}
];
let drill = null;
function viewDrillList(){
  const cards = SCENARIOS.map((s,i) => '<div class="card"><h3>🎭 ' + esc(L(s.title)) + '</h3><p class="muted">' + esc(L(s.caller)) + '</p>' + (S.best[s.id] != null ? '<p class="muted">' + esc(t('best_score')) + ': ' + S.best[s.id] + '%</p>' : '') + '<button class="btn" data-act="drill-start" data-i="' + i + '">' + esc(t('start_drill')) + '</button></div>').join('');
  return '<div class="card"><h2>' + esc(t('drill_title')) + '</h2><p>' + esc(t('drill_intro')) + '</p></div>' + cards;
}
function renderDrill(){
  const v = $view(); const s = SCENARIOS[drill.i]; const step = s.steps[drill.step];
  if (!step){ /* finished */
    const pct = Math.round(drill.good / s.steps.length * 100);
    if (S.best[s.id] == null || pct > S.best[s.id]){ S.best[s.id] = pct; save(); }
    v.innerHTML = '<div class="card"><h2>🎉 ' + esc(t('drill_done')) + '</h2><div class="stat"><div class="num">' + pct + '%</div><p>' + esc(t('your_score')) + '</p></div>' +
      '<div class="chat">' + drill.log.map(x => '<div class="bubble scam"><div class="who">' + esc(L(s.caller)) + '</div>' + esc(L(x.msg)) + '</div><div class="bubble me">' + esc(t(x.choice)) + '</div><div class="teach">' + (x.ok ? esc(t('correct')) : esc(t('wrong'))) + ' ' + esc(L(x.why)) + '</div>').join('') + '</div>' +
      '<button class="btn" data-act="go" data-to="drill">' + esc(t('play_again')) + '</button> <button class="btn ghost" data-act="go" data-to="home">' + esc(t('back_home')) + '</button></div>';
    bindView(); return;
  }
  const history = drill.log.map(x => '<div class="bubble scam"><div class="who">' + esc(L(s.caller)) + '</div>' + esc(L(x.msg)) + '</div><div class="bubble me">' + esc(t(x.choice)) + '</div><div class="teach">' + (x.ok ? esc(t('correct')) : esc(t('wrong'))) + ' ' + esc(L(x.why)) + '</div>').join('');
  const btns = step.choices.map(c => '<button class="btn big-btn ghost" data-act="drill-choose" data-c="' + c + '">' + esc(t(c)) + '</button>').join('');
  v.innerHTML = '<div class="card"><h2>🎭 ' + esc(L(s.title)) + '</h2><p class="muted">' + esc(L(s.caller)) + ' · ' + (drill.step+1) + ' / ' + s.steps.length + '</p>' +
    '<div class="chat">' + history + '<div class="bubble scam"><div class="who">' + esc(L(s.caller)) + '</div>' + esc(L(step.msg)) + '</div></div>' + btns + '</div>';
  bindView();
}

/* ---------------- Events ---------------- */
function bindView(){
  $view().querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', onAction);
  });
  $view().querySelectorAll('[data-mem]').forEach(inp => {
    inp.addEventListener('input', () => { if (wiz){ wiz.members[+inp.dataset.mem][inp.dataset.f] = inp.value; } });
  });
}
function flashCopied(btn){ const old = btn.textContent; btn.textContent = t('copied'); setTimeout(() => { btn.textContent = old; }, 1400); }
function onAction(e){
  const el = e.currentTarget; const act = el.dataset.act;
  if (act === 'go'){ if (el.dataset.to === 'setup') wiz = null; go(el.dataset.to); }
  else if (act === 'reveal'){
    const cw = document.getElementById('cwText'); const btn = document.getElementById('revealBtn');
    const hidden = cw.classList.toggle('hidden-word'); btn.textContent = hidden ? t('tap_reveal') : t('hide');
    if (!hidden) setTimeout(() => { cw.classList.add('hidden-word'); btn.textContent = t('tap_reveal'); }, 6000);
  }
  else if (act === 'copy-cw'){
    if (navigator.clipboard) navigator.clipboard.writeText(S.codeword).then(() => flashCopied(el));
  }
  else if (act === 'print'){
    const inc = document.getElementById('incWord');
    const pw = document.getElementById('printWord');
    if (pw) pw.innerHTML = (inc && inc.checked && S.codeword) ? '<p><strong>' + esc(t('card_word')) + ':</strong> ' + esc(S.codeword) + '</p>' : '';
    window.print();
  }
  else if (act === 'gen'){ wizCollect(); wiz.codeword = generateCodeword(); render(); }
  else if (act === 'mem-add'){ wizCollect(); wiz.members.push({name:'', phone:''}); render(); }
  else if (act === 'mem-del'){ wizCollect(); wiz.members.splice(+el.dataset.i, 1); if (!wiz.members.length) wiz.members.push({name:'', phone:''}); render(); }
  else if (act === 'wnext'){ wizCollect(); if (wiz.step === 0 && !wiz.codeword){ wiz.codeword = generateCodeword(); } wiz.step++; render(); }
  else if (act === 'wback'){ wizCollect(); wiz.step--; render(); }
  else if (act === 'wfinish'){
    wizCollect();
    S.familyName = wiz.familyName; S.codeword = wiz.codeword; S.question = wiz.question; S.answer = wiz.answer;
    S.members = wiz.members.filter(m => m.name);
    S.setupDone = true; save(); wiz = null;
    $view().innerHTML = '<div class="card"><h2>' + esc(t('done_title')) + '</h2><p class="big">' + esc(t('done_text')) + '</p>' +
      '<div class="codeword-box"><div class="muted">' + esc(t('family_word')) + '</div><span class="codeword">' + esc(S.codeword) + '</span></div>' +
      '<button class="btn" data-act="share">' + esc(t('share_btn')) + '</button> <button class="btn" data-act="go" data-to="drill">' + esc(t('start_drill')) + '</button> <button class="btn ghost" data-act="go" data-to="home">' + esc(t('back_home')) + '</button></div>';
    bindView();
  }
  else if (act === 'share'){
    const text = t('share_msg') + location.href;
    if (navigator.share) navigator.share({ title:'SafeWord', text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => flashCopied(el));
  }
  else if (act === 'analyze'){
    const txt = document.getElementById('chkText').value || '';
    const r = analyzeMessage(txt);
    document.getElementById('chkResult').innerHTML = renderCheckResult(r);
  }
  else if (act === 'drill-start'){ drill = { i:+el.dataset.i, step:0, good:0, log:[] }; renderDrill(); window.scrollTo(0,0); }
  else if (act === 'drill-choose'){
    const s = SCENARIOS[drill.i]; const step = s.steps[drill.step]; const c = el.dataset.c;
    const ok = c === step.best; if (ok) drill.good++;
    drill.log.push({ msg: step.msg, choice: c, ok, why: step.why });
    drill.step++; renderDrill(); window.scrollTo(0,0);
  }
  else if (act === 'outcome'){
    S.panicLog.push({ at: new Date().toISOString(), outcome: el.dataset.o }); save();
    const m = document.getElementById('outcomeMsg'); if (m) m.textContent = t('o_saved');
  }
}

/* ---------------- Boot ---------------- */
if (typeof document !== 'undefined'){
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-theme', S.settings.theme === 'dark' ? 'dark' : 'light');
    document.getElementById('themeBtn').textContent = S.settings.theme === 'dark' ? '☀️' : '🌙';
    const sel = document.getElementById('langSel'); sel.value = lang();
    sel.addEventListener('change', () => setLang(sel.value));
    document.getElementById('themeBtn').addEventListener('click', () => setTheme(S.settings.theme === 'dark' ? 'light' : 'dark'));
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { if (b.dataset.view === 'setup') wiz = null; go(b.dataset.view); }));
    document.getElementById('panicFab').addEventListener('click', () => go('panic'));
    applyStatic(); render();
  });
}
if (typeof module !== 'undefined' && module.exports){ module.exports = { analyzeMessage, generateCodeword, PATTERNS, WORDS }; }
