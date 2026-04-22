/* =====================================================
   SHUTTLE CLUB — Booking + Match Making
   ===================================================== */

// ===== CONFIG =====
const CONFIG = {
  courts: 12,
  openHour: 10,
  closeHour: 24,
  pricing: (hour) => {
    if (hour >= 10 && hour < 16) return 150;
    if (hour >= 16 && hour < 21) return 250;
    return 200;
  },
  adminPassword: 'admin1234',
  storageKey: 'shuttle_club_v2',
  matchDuration: 15 * 60,  // 15 minutes in seconds
  skillLevels: {
    BG: { name: 'Beginner',    desc: 'เริ่มเล่นใหม่ๆ 0–1 ปี ยังไม่ชำนาญเทคนิค' },
    M:  { name: 'Medium',      desc: 'เล่นประจำ 1–3 ปี ตีได้ทุกพื้นฐาน' },
    P:  { name: 'Pro',         desc: 'เล่นแข่งระดับท้องถิ่น มีเทคนิคครบ' },
    S:  { name: 'Super Pro',   desc: 'ระดับทัวร์นาเมนต์จังหวัด/ประเทศ' },
  },
};

// ===== STATE =====
const state = {
  selectedDate: null,
  selectedSlots: [],
  bookings: [],
  queue: [],         // players waiting
  matches: [],       // active/finished matches
  currentPage: 'home',
  admin: { loggedIn: false },
  user: { loggedIn: false, phone: null, name: null },
  mmForm: { level: null, mode: null },
  queueFilter: 'all',
  selfQueueId: null, // tracks current user's position in queue
};

// ===== STORAGE =====
function loadData() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (raw) {
      const data = JSON.parse(raw);
      state.bookings = data.bookings || [];
      state.queue = data.queue || [];
      state.matches = data.matches || [];
    } else {
      state.bookings = seedBookings();
      state.queue = seedQueue();
      state.matches = [];
      saveData();
    }
  } catch {
    state.bookings = [];
    state.queue = [];
    state.matches = [];
  }
}
function saveData() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify({
    bookings: state.bookings,
    queue: state.queue,
    matches: state.matches,
  }));
  // Save user session separately so it persists across pages
  if (state.user.loggedIn) {
    localStorage.setItem('shuttle_club_user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('shuttle_club_user');
  }
}

function loadUserSession() {
  try {
    const raw = localStorage.getItem('shuttle_club_user');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.loggedIn && data.phone) {
        state.user = data;
      }
    }
  } catch {}
}

function seedBookings() {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const demo = [];
  const ex = [
    { d: 0, slots: [{c:1,h:18},{c:1,h:19}], name:'ภาณุศักดิ์ ศรีสุวรรณ', phone:'0812345678', status:'confirmed' },
    { d: 0, slots: [{c:3,h:19},{c:3,h:20}], name:'ปรียา แสงจันทร์', phone:'0898765432', status:'confirmed' },
    { d: 0, slots: [{c:5,h:20}], name:'ธีรพงษ์ วงศ์ประเสริฐ', phone:'0811111111', status:'confirmed' },
    { d: 1, slots: [{c:2,h:17},{c:2,h:18}], name:'สุภาพร เจริญสุข', phone:'0822222222', status:'confirmed' },
    { d: 1, slots: [{c:7,h:18}], name:'ชนาธิป บุญมาก', phone:'0833333333', status:'confirmed' },
    { d: 2, slots: [{c:4,h:19},{c:4,h:20},{c:4,h:21}], name:'วรรณา สิริธรรม', phone:'0844444444', status:'confirmed' },
  ];
  ex.forEach((e, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + e.d);
    demo.push({
      id: 'BK' + String(Date.now() + i).slice(-7),
      date: fmt(date),
      slots: e.slots.map(s => ({ court: s.c, hour: s.h, price: CONFIG.pricing(s.h) })),
      total: e.slots.reduce((sum, s) => sum + CONFIG.pricing(s.h), 0),
      name: e.name, phone: e.phone, note: '',
      status: e.status,
      createdAt: Date.now() - (i * 3600000),
    });
  });
  return demo;
}

function seedQueue() {
  const now = Date.now();
  return [
    { id:'Q'+(now-60000), name:'พีรพัฒน์',  phone:'0812223344', level:'M',  mode:'single', joinedAt: now-60000*5 },
    { id:'Q'+(now-50000), name:'จิราภรณ์',  phone:'0822334455', level:'M',  mode:'single', joinedAt: now-60000*4 },
    { id:'Q'+(now-40000), name:'กิตติพงษ์', phone:'0833445566', level:'P',  mode:'double', joinedAt: now-60000*3 },
    { id:'Q'+(now-30000), name:'สายฝน',    phone:'0844556677', level:'BG', mode:'double', joinedAt: now-60000*2 },
    { id:'Q'+(now-20000), name:'อนุชา',    phone:'0855667788', level:'P',  mode:'double', joinedAt: now-60000 },
  ];
}

// ===== UTILITIES =====
function fmtDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function fmtHour(h) { return String(h).padStart(2,'0') + ':00'; }
function fmtSlot(hour) { return `${fmtHour(hour)}–${fmtHour(hour+1)}`; }
function todayStr() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; }
function genId(prefix='BK') { return prefix + String(Date.now()).slice(-7); }
function fmtMMSS(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec/60), s = sec%60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}
function fmtAgo(ms) {
  const s = Math.floor((Date.now() - ms)/1000);
  if (s < 60) return `${s} วิ`;
  if (s < 3600) return `${Math.floor(s/60)} นาที`;
  return `${Math.floor(s/3600)} ชม.`;
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0].slice(0,2) || '?').toUpperCase();
}

// ===== PAGE DETECTION =====
function detectCurrentPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop().replace('.html', '') || 'main';
  const pageMap = {
    'main': 'home',
    'index': 'home',
    'booking': 'booking',
    'matchmaking': 'matchmaking',
    'history': 'history',
    'user': 'user',
    'admin': 'admin',
  };
  return pageMap[file] || 'home';
}

// ===== NAVIGATION =====
function goTo(page) {
  const fileMap = {
    'home': 'main.html',
    'booking': 'booking.html',
    'matchmaking': 'matchmaking.html',
    'history': 'history.html',
    'user': 'user.html',
    'admin': 'admin.html',
  };
  const target = fileMap[page];
  if (target) {
    window.location.href = target;
  }
}

// ===== BOOKING — DATE SCROLL =====
function renderDateScroll() {
  const scroll = document.getElementById('dateScroll');
  const days = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  scroll.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const chip = document.createElement('div');
    // Fix: use direct comparison without extra spaces
    chip.className = (iso === state.selectedDate) ? 'date-chip active' : 'date-chip';
    chip.dataset.date = iso;
    chip.innerHTML = `
      <div class="date-chip-day">${i === 0 ? 'วันนี้' : days[d.getDay()]}</div>
      <div class="date-chip-num">${d.getDate()}</div>
      <div class="date-chip-mon">${months[d.getMonth()]}</div>
    `;
    chip.onclick = () => {
      state.selectedDate = iso;
      state.selectedSlots = [];
      renderDateScroll();
      renderTable();
      updateSummary();
    };
    scroll.appendChild(chip);
  }
}

// ===== BOOKING — TABLE =====
function isSlotBooked(date, court, hour) {
  return state.bookings.some(b =>
    b.status !== 'cancelled' &&
    b.date === date &&
    b.slots.some(s => s.court === court && s.hour === hour)
  );
}
function isSlotPast(date, hour) {
  // Always return false to allow booking all slots
  return false;
}

function renderTable() {
  const table = document.getElementById('bookingTable');
  let html = '<thead><tr><th>เวลา</th>';
  for (let c = 1; c <= CONFIG.courts; c++) html += `<th>คอร์ท ${c}</th>`;
  html += '</tr></thead><tbody>';

  for (let h = CONFIG.openHour; h < CONFIG.closeHour; h++) {
    const price = CONFIG.pricing(h);
    html += `<tr><td class="time-cell">${fmtSlot(h)}</td>`;
    for (let c = 1; c <= CONFIG.courts; c++) {
      // Remove isSlotPast check - always allow booking
      const booked = isSlotBooked(state.selectedDate, c, h);
      const selected = state.selectedSlots.some(s => s.court === c && s.hour === h);
      let cls = 'slot';
      if (booked) cls += ' booked';
      else if (selected) cls += ' selected';
      html += `<td><button class="${cls}" data-court="${c}" data-hour="${h}" data-price="${price}" ${booked?'disabled':''}></button></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  table.innerHTML = html;

  table.querySelectorAll('.slot:not(.booked)').forEach(btn => {
    btn.onclick = () => toggleSlot(parseInt(btn.dataset.court), parseInt(btn.dataset.hour), parseInt(btn.dataset.price));
  });
}

function toggleSlot(court, hour, price) {
  const idx = state.selectedSlots.findIndex(s => s.court === court && s.hour === hour);
  if (idx >= 0) state.selectedSlots.splice(idx, 1);
  else state.selectedSlots.push({ court, hour, price });
  renderTable();
  updateSummary();
}

function updateSummary() {
  const bar = document.getElementById('summaryBar');
  const count = document.getElementById('selCount');
  const list = document.getElementById('selList');
  const total = document.getElementById('selTotal');
  const btn = document.getElementById('btnConfirm');

  const n = state.selectedSlots.length;
  count.textContent = n;

  if (n === 0) {
    list.textContent = 'ยังไม่ได้เลือกคอร์ท';
    total.textContent = '0';
    btn.disabled = true;
    bar.classList.remove('visible');
    return;
  }
  bar.classList.add('visible');
  btn.disabled = false;
  const sorted = [...state.selectedSlots].sort((a,b) => a.court - b.court || a.hour - b.hour);
  list.textContent = sorted.map(s => `คอร์ท${s.court}·${fmtSlot(s.hour)}`).join('  ·  ');
  const courtTotal = state.selectedSlots.reduce((sum, s) => sum + s.price, 0);
  let addonTotal = 0;
  const checkRacket = document.getElementById('checkRacket');
  const checkShuttlecock = document.getElementById('checkShuttlecock');
  if (checkRacket && checkRacket.checked) {
    const qty = parseInt(document.getElementById('racketQty').value) || 0;
    addonTotal += 250 * qty;
  }
  if (checkShuttlecock && checkShuttlecock.checked) {
    const qty = parseInt(document.getElementById('shuttlecockQty').value) || 0;
    addonTotal += 100 * qty;
  }
  total.textContent = (courtTotal + addonTotal).toLocaleString();
}

function renderBooking() {
  if (!state.selectedDate) state.selectedDate = todayStr();
  renderDateScroll();
  renderTable();
  updateSummary();
}

// ===== BOOKING MODAL =====
function changeQty(type, delta) {
  const input = document.getElementById(type + 'Qty');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  input.value = val;
  updateModalSummary();
  updateSummary();
}
function updateModalSummary() {
  const checkRacket = document.getElementById('checkRacket');
  const racketQty = parseInt(document.getElementById('racketQty').value) || 0;
  const checkShuttlecock = document.getElementById('checkShuttlecock');
  const shuttlecockQty = parseInt(document.getElementById('shuttlecockQty').value) || 0;
  const sum = document.getElementById('modalSummary');
  const courtTotal = state.selectedSlots.reduce((s,x) => s + x.price, 0);
  const sorted = [...state.selectedSlots].sort((a,b) => a.court - b.court || a.hour - b.hour);

  let addonTotal = 0;
  let addonHtml = '';
  if (checkRacket && checkRacket.checked) {
    addonTotal += 250 * racketQty;
    addonHtml += `<div class="modal-summary-line" style="color:var(--red);"><span>[+] เช่าไม้แบด x${racketQty}</span><span>฿${(250 * racketQty).toLocaleString()}</span></div>`;
  }
  if (checkShuttlecock && checkShuttlecock.checked) {
    const totalBalls = shuttlecockQty * 3;
    addonTotal += 100 * shuttlecockQty;
    addonHtml += `<div class="modal-summary-line" style="color:var(--red);"><span>[+] ซื้อลูกแบด ${totalBalls} ลูก</span><span>฿${(100 * shuttlecockQty).toLocaleString()}</span></div>`;
  }

  let html = `
    <div class="modal-summary-line"><span>วันที่</span><strong>${fmtDate(state.selectedDate)}</strong></div>
    <div class="modal-summary-line"><span>จำนวน</span><strong>${state.selectedSlots.length} คอร์ท</strong></div>`;
  sorted.forEach(s => {
    html += `<div class="modal-summary-line"><span>คอร์ท ${s.court} · ${fmtSlot(s.hour)}</span><span>฿${s.price}</span></div>`;
  });
  if (addonHtml) {
    html += `<div style="margin:8px 0;border-top:1px dashed var(--border);"></div>`;
    html += `<div style="font-size:12px;font-weight:600;letter-spacing:0.08em;color:var(--red);margin-bottom:4px;">ตัวเลือกเสริม</div>`;
    html += addonHtml;
  }
  html += `<div class="modal-summary-line total"><span>ยอดรวม</span><strong>฿${(courtTotal + addonTotal).toLocaleString()}</strong></div>`;
  sum.innerHTML = html;
}
function openModal() {
  if (state.selectedSlots.length === 0) return;
  const modal = document.getElementById('bookingModal');
  updateModalSummary();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
}

function submitBooking(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const name = (fd.get('name') || '').toString().trim();
  const phone = (fd.get('phone') || '').toString().trim();
  const note = (fd.get('note') || '').toString().trim();

  if (!name || !phone) {
    toast('error', 'กรุณากรอกข้อมูลให้ครบ', 'ชื่อ–นามสกุล และ เบอร์โทร จำเป็นต้องระบุ');
    return;
  }
  if (!/^[0-9]{9,10}$/.test(phone)) {
    toast('error', 'เบอร์โทรไม่ถูกต้อง', 'กรุณากรอกเบอร์โทร 9–10 หลัก');
    return;
  }

  for (const s of state.selectedSlots) {
    if (isSlotBooked(state.selectedDate, s.court, s.hour)) {
      toast('error', 'คอร์ทถูกจองแล้ว', 'มีคนอื่นจองไปก่อน กรุณาเลือกใหม่');
      closeModal();
      state.selectedSlots = state.selectedSlots.filter(x => !isSlotBooked(state.selectedDate, x.court, x.hour));
      renderTable();
      updateSummary();
      return;
    }
  }

  // Calculate total and open payment popup
  const courtTotal = state.selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const addons = [];
  const checkRacket = document.getElementById('checkRacket');
  const racketQty = parseInt(document.getElementById('racketQty').value) || 0;
  const checkShuttlecock = document.getElementById('checkShuttlecock');
  const shuttlecockQty = parseInt(document.getElementById('shuttlecockQty').value) || 0;
  if (checkRacket && checkRacket.checked) {
    addons.push({ type: 'racket', qty: racketQty, price: 250 * racketQty });
  }
  if (checkShuttlecock && checkShuttlecock.checked) {
    addons.push({ type: 'shuttlecock', qty: shuttlecockQty, balls: shuttlecockQty * 3, price: 100 * shuttlecockQty });
  }
  const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
  const total = courtTotal + addonTotal;

  // Store pending booking data
  state.pendingBooking = { name, phone, note, addons, total };

  // Open payment popup
  document.getElementById('paymentTotal').textContent = '฿' + total.toLocaleString();
  document.getElementById('paymentProcessing').style.display = 'none';
  document.querySelectorAll('.payment-method').forEach(b => b.style.display = 'flex');
  document.getElementById('paymentModal').classList.add('open');

  // Start 5-minute countdown
  clearInterval(state.paymentTimerInterval);
  state.paymentTimerSec = 300;
  const timerEl = document.getElementById('paymentTimerText');
  function tickTimer() {
    const m = Math.floor(state.paymentTimerSec / 60);
    const s = state.paymentTimerSec % 60;
    timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (state.paymentTimerSec <= 0) {
      clearInterval(state.paymentTimerInterval);
      document.getElementById('paymentModal').classList.remove('open');
      toast('error', 'หมดเวลาชำระเงิน', 'กรุณาจองใหม่อีกครั้ง');
      state.pendingBooking = null;
    }
    state.paymentTimerSec--;
  }
  tickTimer();
  state.paymentTimerInterval = setInterval(tickTimer, 1000);
}

function completePayment(method) {
  clearInterval(state.paymentTimerInterval);
  const pb = state.pendingBooking;
  if (!pb) return;

  const booking = {
    id: genId('BK'),
    date: state.selectedDate,
    slots: [...state.selectedSlots],
    addons: pb.addons, total: pb.total, name: pb.name, phone: pb.phone, note: pb.note,
    paymentMethod: method,
    status: 'confirmed',
    createdAt: Date.now(),
  };
  state.bookings.push(booking);
  saveData();

  // Auto-login user with this phone
  state.user.loggedIn = true;
  state.user.phone = pb.phone;
  state.user.name = pb.name;
  saveData();

  state.selectedSlots = [];
  state.pendingBooking = null;
  closeModal();
  document.getElementById('paymentModal').classList.remove('open');
  document.getElementById('bookingForm').reset();
  renderTable();
  updateSummary();

  const methodNames = { promptpay: 'พร้อมเพย์', credit: 'บัตรเครดิต', cash: 'เงินสด' };
  renderSuccessDetails(booking, methodNames[method] || method);
  document.getElementById('successModal').classList.add('open');
}

function renderSuccessDetails(booking, methodName) {
  const details = document.getElementById('successDetails');
  const addons = booking.addons || [];
  const addonLines = addons.length ? addons.map(a => {
    if (a.type === 'racket') return `เช่าไม้แบด ${a.qty} อัน (฿${a.price})`;
    if (a.type === 'shuttlecock') return `ซื้อลูกแบด ${a.balls} ลูก (฿${a.price})`;
    return `${a.type}: ฿${a.price}`;
  }).join('<br>') : 'ไม่มี';
  details.innerHTML = `
    <div style="font-size:14px;margin-bottom:8px;"><strong>รหัสการจอง:</strong> ${booking.id}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>วันที่:</strong> ${fmtDate(booking.date)}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>เวลา:</strong> ${booking.slots.map(s => fmtSlot(s.hour)).join(', ')}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>คอร์ท:</strong> ${booking.slots.map(s => `คอร์ท ${s.court}`).join(', ')}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>เช่า/ซื้อเพิ่มเติม:</strong><br>${addonLines}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>ชื่อ:</strong> ${booking.name}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>โทร:</strong> ${booking.phone}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>วิธีชำระ:</strong> ${methodName}</div>
    <div style="font-size:14px;margin-bottom:8px;"><strong>ยอดรวม:</strong> ฿${booking.total}</div>
  `;
  details.dataset.bookingId = booking.id;
}

function downloadBookingImage(booking) {
  const W = 520, H = 640;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;

  // Helper: rounded rect
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Background
  ctx.fillStyle = '#ffffff';
  roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Header gradient
  const grd = ctx.createLinearGradient(0, 0, W, 140);
  grd.addColorStop(0, '#e10028');
  grd.addColorStop(0.6, '#b8001c');
  grd.addColorStop(1, '#8a0017');
  ctx.fillStyle = grd;
  roundRect(0, 0, W, 140, 20);
  ctx.fill();
  // Fix bottom corners of header (no rounding)
  ctx.fillRect(0, 120, W, 20);

  // Diagonal stripes on header
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#fff';
  for (let i = -200; i < W + 200; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 8, 0);
    ctx.lineTo(i + 8 - 140, 140);
    ctx.lineTo(i - 140, 140);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Header glow circle
  ctx.save();
  ctx.globalAlpha = 0.08;
  const glowGrd = ctx.createRadialGradient(W - 40, 30, 0, W - 40, 30, 100);
  glowGrd.addColorStop(0, '#fff');
  glowGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrd;
  ctx.fillRect(W - 140, -70, 200, 200);
  ctx.restore();

  // Brand text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('ALMOST', 32, 46);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('IN', 152, 46);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('ใบยืนยันการจองคอร์ท', 32, 66);

  // ID bar
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 110, W, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(booking.id, 32, 130);
  // Status badge
  ctx.fillStyle = 'rgba(74,222,128,0.2)';
  roundRect(W - 150, 114, 118, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(W - 138, 125, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.fillText('ยืนยันแล้ว', W - 128, 129);

  // Body content
  let y = 160;
  const LX = 32, RX = W - 32;

  function sectionLabel(text) {
    // Red bar
    ctx.fillStyle = '#e10028';
    roundRect(LX, y, 3, 10, 1.5);
    ctx.fill();
    // Label
    ctx.fillStyle = '#bbbbbb';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText(text, LX + 10, y + 9);
    // Line
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tw = ctx.measureText(text).width;
    ctx.moveTo(LX + 14 + tw, y + 5);
    ctx.lineTo(RX, y + 5);
    ctx.stroke();
    y += 22;
  }

  function infoRow(label, value, col) {
    const colX = col === 0 ? LX : LX + 230;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(label, colX, y);
    ctx.fillStyle = '#111111';
    ctx.font = '600 14px Arial, sans-serif';
    ctx.fillText(value, colX, y + 16);
  }

  function slotRow(text, price) {
    // Background
    ctx.fillStyle = '#f7f7f7';
    roundRect(LX, y, RX - LX, 32, 8);
    ctx.fill();
    // Red left border
    ctx.fillStyle = '#e10028';
    roundRect(LX, y, 3, 32, 1.5);
    ctx.fill();
    // Text
    ctx.fillStyle = '#111111';
    ctx.font = '600 13px Arial, sans-serif';
    ctx.fillText(text, LX + 14, y + 20);
    // Price
    ctx.fillStyle = '#444444';
    ctx.font = 'bold 14px Arial, sans-serif';
    const pw = ctx.measureText(price).width;
    ctx.fillText(price, RX - 10 - pw, y + 20);
    y += 38;
  }

  function addonRow(text, price) {
    ctx.fillStyle = '#fef8f9';
    roundRect(LX, y, RX - LX, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#f4a0b0';
    roundRect(LX, y, 3, 32, 1.5);
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.font = '500 13px Arial, sans-serif';
    ctx.fillText(text, LX + 14, y + 20);
    ctx.fillStyle = '#c1001f';
    ctx.font = 'bold 14px Arial, sans-serif';
    const pw = ctx.measureText(price).width;
    ctx.fillText(price, RX - 10 - pw, y + 20);
    y += 38;
  }

  function divider() {
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LX, y);
    ctx.lineTo(RX, y);
    ctx.stroke();
    y += 14;
  }

  // Section: รายละเอียดการจอง
  sectionLabel('รายละเอียดการจอง');
  infoRow('วันที่', fmtDate(booking.date), 0);
  const created = new Date(booking.createdAt);
  const createdStr = `${created.getDate()}/${created.getMonth()+1}/${created.getFullYear()+543} ${String(created.getHours()).padStart(2,'0')}:${String(created.getMinutes()).padStart(2,'0')}`;
  infoRow('จองเมื่อ', createdStr, 1);
  y += 28;

  // Section: คอร์ท & เวลา
  sectionLabel('คอร์ท & เวลา');
  booking.slots.forEach(s => {
    slotRow(`คอร์ท ${s.court} · ${fmtSlot(s.hour)}`, `฿${s.price}`);
  });

  // Section: อุปกรณ์เสริม
  if (booking.addons && booking.addons.length) {
    sectionLabel('อุปกรณ์เสริม');
    booking.addons.forEach(a => {
      if (a.type === 'racket') addonRow(`เช่าไม้แบด ${a.qty} อัน`, `฿${a.price}`);
      if (a.type === 'shuttlecock') addonRow(`ซื้อลูกแบด ${a.balls} ลูก`, `฿${a.price}`);
    });
  }

  // Note
  if (booking.note) {
    sectionLabel('หมายเหตุ');
    ctx.fillStyle = '#fff8f0';
    roundRect(LX, y, RX - LX, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    roundRect(LX, y, 3, 32, 1.5);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = '600 13px Arial, sans-serif';
    ctx.fillText(booking.note, LX + 14, y + 20);
    y += 38;
  }

  divider();

  // Section: ข้อมูลผู้จอง
  sectionLabel('ข้อมูลผู้จอง');
  infoRow('ชื่อ', booking.name, 0);
  infoRow('เบอร์โทร', booking.phone, 1);
  y += 28;
  const methodNames = { promptpay: 'พร้อมเพย์', credit: 'บัตรเครดิต', cash: 'เงินสด' };
  infoRow('วิธีชำระ', methodNames[booking.paymentMethod] || booking.paymentMethod, 0);
  y += 28;

  divider();

  // Total row
  ctx.fillStyle = '#fef7f8';
  roundRect(LX, y, RX - LX, 44, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(225,0,40,0.08)';
  ctx.lineWidth = 1;
  roundRect(LX, y, RX - LX, 44, 10);
  ctx.stroke();
  ctx.fillStyle = '#888888';
  ctx.font = '500 13px Arial, sans-serif';
  ctx.fillText('ยอดรวมทั้งหมด', LX + 16, y + 28);
  ctx.fillStyle = '#e10028';
  ctx.font = 'bold 26px Arial, sans-serif';
  const totalStr = `฿${booking.total.toLocaleString()}`;
  const tw2 = ctx.measureText(totalStr).width;
  ctx.fillText(totalStr, RX - 16 - tw2, y + 30);
  y += 56;

  // Footer
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, H - 40, W, 40);
  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 40);
  ctx.lineTo(W, H - 40);
  ctx.stroke();
  ctx.fillStyle = '#bbbbbb';
  ctx.font = '10px Arial, sans-serif';
  ctx.fillText(' 2026 ALMOST IN · All rights reserved', 32, H - 16);
  ctx.fillStyle = '#d0d0d0';
  ctx.font = 'bold 13px Arial, sans-serif';
  const fw = ctx.measureText('ALMOSTIN').width;
  ctx.fillText('ALMOSTIN', RX - fw, H - 16);

  // Download
  const link = document.createElement('a');
  link.download = `booking-${booking.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ===== TOAST =====
let toastTimer;
function toast(type, title, msg) {
  const el = document.getElementById('toast');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${msg}</div>`;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

// ================================================
// ===== MATCH MAKING =============================
// ================================================

function renderMatchMaking() {
  renderSkillTiers();
  renderForm();
  renderQueue();
  renderMatches();
}

function renderSkillTiers() {
  const wrap = document.getElementById('skillTiers');
  const levels = ['BG', 'M', 'P', 'S'];
  wrap.innerHTML = levels.map(lv => {
    const count = state.queue.filter(q => q.level === lv).length;
    const info = CONFIG.skillLevels[lv];
    return `
      <div class="skill-tier" data-level="${lv}">
        <div class="skill-tier-head">
          <div class="skill-tier-badge">${lv}</div>
          <div>
            <div class="skill-tier-name">${info.name}</div>
          </div>
        </div>
        <div class="skill-tier-desc">${info.desc}</div>
        <div class="skill-tier-count"><strong>${count}</strong>คนในคิว</div>
      </div>
    `;
  }).join('');
}

function renderForm() {
  // Level picker
  document.querySelectorAll('#levelPicker .pick-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.level === state.mmForm.level);
    b.onclick = () => {
      state.mmForm.level = b.dataset.level;
      renderForm();
    };
  });
  // Mode picker
  document.querySelectorAll('#modePicker .pick-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === state.mmForm.mode);
    b.onclick = () => {
      state.mmForm.mode = b.dataset.mode;
      renderForm();
    };
  });
}

function joinQueue(e) {
  e.preventDefault();
  const name = document.getElementById('mmName').value.trim();
  const phone = document.getElementById('mmPhone').value.trim();
  const { level, mode } = state.mmForm;

  if (!name) { toast('error', 'กรอกชื่อก่อน', 'ระบุชื่อเล่นของคุณ'); return; }
  if (!/^[0-9]{9,10}$/.test(phone)) { toast('error', 'เบอร์ไม่ถูกต้อง', 'กรุณากรอก 9–10 หลัก'); return; }
  if (!level) { toast('error', 'เลือกระดับฝีมือ', 'เลือก BG / M / P / S'); return; }
  if (!mode) { toast('error', 'เลือกโหมด', '1v1 หรือ 2v2'); return; }

  // Check duplicate (same phone in queue)
  if (state.queue.some(q => q.phone === phone)) {
    toast('error', 'อยู่ในคิวแล้ว', 'เบอร์นี้อยู่ในคิวอยู่แล้ว');
    return;
  }
  // Check if in active match
  if (state.matches.some(m => !m.finished && m.players.some(p => p.phone === phone))) {
    toast('error', 'อยู่ในแมตช์', 'คุณกำลังเล่นอยู่ รอจบแมตช์ก่อน');
    return;
  }

  const entry = {
    id: genId('Q'),
    name, phone, level, mode,
    joinedAt: Date.now(),
  };
  state.queue.push(entry);
  state.selfQueueId = entry.id;
  saveData();

  // Reset form
  document.getElementById('mmName').value = '';
  document.getElementById('mmPhone').value = '';
  state.mmForm = { level: null, mode: null };

  toast('success', 'เข้าคิวแล้ว', `${name} · ระดับ ${level} · ${mode==='single'?'1v1':'2v2'}`);

  // Try to match
  tryMatch();
  renderMatchMaking();
}

function leaveQueue(id) {
  state.queue = state.queue.filter(q => q.id !== id);
  if (state.selfQueueId === id) state.selfQueueId = null;
  saveData();
  renderMatchMaking();
  toast('success', 'ออกจากคิวแล้ว', 'คุณออกจากคิวเรียบร้อย');
}

function tryMatch() {
  // Try matching by level + mode (oldest first)
  const levels = ['BG', 'M', 'P', 'S'];
  let anyMatched = false;

  for (const lv of levels) {
    // Singles: need 2 players
    const singles = state.queue
      .filter(q => q.level === lv && q.mode === 'single')
      .sort((a,b) => a.joinedAt - b.joinedAt);
    while (singles.length >= 2) {
      const p1 = singles.shift();
      const p2 = singles.shift();
      createMatch([p1], [p2], 'single', lv);
      anyMatched = true;
    }

    // Doubles: need 4 players (2v2)
    const doubles = state.queue
      .filter(q => q.level === lv && q.mode === 'double')
      .sort((a,b) => a.joinedAt - b.joinedAt);
    while (doubles.length >= 4) {
      const team1 = [doubles.shift(), doubles.shift()];
      const team2 = [doubles.shift(), doubles.shift()];
      createMatch(team1, team2, 'double', lv);
      anyMatched = true;
    }
  }

  if (anyMatched) saveData();
  return anyMatched;
}

function createMatch(team1, team2, mode, level) {
  const ids = [...team1, ...team2].map(p => p.id);
  // Remove from queue
  state.queue = state.queue.filter(q => !ids.includes(q.id));
  // If self was matched, announce
  if (ids.includes(state.selfQueueId)) {
    const selfPlayer = [...team1, ...team2].find(p => p.id === state.selfQueueId);
    toast('success', 'จับคู่สำเร็จ!', `${selfPlayer.name} ได้แมตช์แล้ว เริ่มเล่น 15 นาที`);
    state.selfQueueId = null;
  }

  // Assign a court number for this match
  const usedCourts = state.matches
    .filter(m => !m.finished)
    .map(m => m.court)
    .filter(Boolean);
  let court = 1;
  while (usedCourts.includes(court)) court++;
  if (court > CONFIG.courts) court = null; // no court available

  const match = {
    id: genId('MT'),
    mode, level, court,
    team1: team1.map(p => ({ id:p.id, name:p.name, phone:p.phone, level:p.level })),
    team2: team2.map(p => ({ id:p.id, name:p.name, phone:p.phone, level:p.level })),
    players: [...team1, ...team2].map(p => ({ name:p.name, phone:p.phone })),
    startedAt: Date.now(),
    endsAt: Date.now() + CONFIG.matchDuration * 1000,
    finished: false,
  };
  state.matches.push(match);
}

function finishMatch(id, auto=false) {
  const m = state.matches.find(x => x.id === id);
  if (!m) return;
  m.finished = true;
  m.endedAt = Date.now();
  saveData();
  renderMatchMaking();
  if (!auto) toast('success', 'จบแมตช์', 'ผู้เล่นสามารถเข้าคิวใหม่ได้');
}

function renderQueue() {
  const wrap = document.getElementById('queueList');
  // Filter buttons
  document.querySelectorAll('#queueFilter .queue-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.f === state.queueFilter);
    b.onclick = () => { state.queueFilter = b.dataset.f; renderQueue(); };
  });

  let list = [...state.queue].sort((a,b) => a.joinedAt - b.joinedAt);
  if (state.queueFilter !== 'all') list = list.filter(q => q.level === state.queueFilter);

  if (list.length === 0) {
    wrap.innerHTML = `<div class="empty-mm">ยังไม่มีผู้เล่นในคิว ${state.queueFilter==='all'?'':'ระดับ '+state.queueFilter} · เข้าคิวเลย!</div>`;
    return;
  }

  wrap.innerHTML = `<div class="queue-list">` + list.map(q => {
    const isSelf = q.id === state.selfQueueId;
    const modeLabel = q.mode === 'single' ? '1v1' : '2v2';
    return `
      <div class="queue-card ${isSelf ? 'queue-self' : ''}">
        <div class="queue-avatar">
          ${initials(q.name)}
          <span class="lv-dot" data-lv="${q.level}">${q.level}</span>
        </div>
        <div class="queue-info">
          <div class="queue-name">${q.name}${isSelf ? ' (คุณ)' : ''}</div>
          <div class="queue-meta">
            <span class="q-mode">${modeLabel}</span>
            รอมา ${fmtAgo(q.joinedAt)}
          </div>
        </div>
        <div class="queue-actions">
          ${isSelf ? `<button class="icon-btn danger" onclick="leaveQueue('${q.id}')">ออก</button>` : ''}
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

function renderMatches() {
  const wrap = document.getElementById('activeMatches');
  const active = state.matches.filter(m => !m.finished);

  if (active.length === 0) {
    wrap.innerHTML = `<div class="empty-mm">ยังไม่มีแมตช์กำลังเล่น — พอมีผู้เล่นพอ ระบบจะจับคู่อัตโนมัติ</div>`;
    return;
  }

  wrap.innerHTML = `<div class="match-list">` + active.map(m => {
    const remaining = Math.floor((m.endsAt - Date.now())/1000);
    const modeLabel = m.mode === 'single' ? '1v1' : '2v2';
    return `
      <div class="match-card" id="match-${m.id}">
        <div class="match-card-head">
          <div class="match-card-title">
            <span class="mc-mode">${modeLabel}</span>
            ระดับ ${m.level}${m.court ? ' · คอร์ท ' + m.court : ''}
          </div>
          <div class="match-card-timer" data-ends="${m.endsAt}" data-id="${m.id}">
            ${fmtMMSS(remaining)}
          </div>
        </div>
        <div class="match-teams">
          <div class="match-team left">
            ${m.team1.map(p => `
              <div class="match-player">
                <div class="mp-avatar">
                  ${initials(p.name)}
                  <span class="lv-dot" data-lv="${p.level}">${p.level}</span>
                </div>
                <div class="mp-name">${p.name}</div>
              </div>
            `).join('')}
          </div>
          <div class="match-vs">VS</div>
          <div class="match-team right">
            ${m.team2.map(p => `
              <div class="match-player">
                <div class="mp-avatar">
                  ${initials(p.name)}
                  <span class="lv-dot" data-lv="${p.level}">${p.level}</span>
                </div>
                <div class="mp-name">${p.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:14px;text-align:right;">
          <button class="match-card-finish" onclick="finishMatch('${m.id}')">จบแมตช์เลย</button>
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

// ===== Match Timer (tick every second) =====
function tickMatches() {
  const timers = document.querySelectorAll('.match-card-timer[data-ends]');
  let anyFinished = false;

  timers.forEach(el => {
    const endsAt = parseInt(el.dataset.ends);
    const id = el.dataset.id;
    const remaining = Math.floor((endsAt - Date.now())/1000);

    if (remaining <= 0) {
      el.classList.add('done');
      el.textContent = '00:00';
      const match = state.matches.find(m => m.id === id);
      if (match && !match.finished) {
        match.finished = true;
        match.endedAt = Date.now();
        anyFinished = true;
      }
    } else {
      el.textContent = fmtMMSS(remaining);
    }
  });

  if (anyFinished) {
    saveData();
    if (state.currentPage === 'matchmaking') renderMatchMaking();
    toast('success', 'หมดเวลา', 'แมตช์ 15 นาทีหมดแล้ว ผู้เล่นเข้าคิวใหม่ได้');
  }
}

// ===== USER =====
function renderUser() {
  const login = document.getElementById('userLogin');
  const dash = document.getElementById('userDash');
  if (state.user.loggedIn) {
    login.style.display = 'none';
    dash.style.display = 'block';
    // Show user info
    const latestBooking = state.bookings
      .filter(b => b.phone === state.user.phone)
      .sort((a,b) => b.createdAt - a.createdAt)[0];
    const displayName = latestBooking ? latestBooking.name : 'ผู้ใช้';
    document.getElementById('userAvatar').textContent = initials(displayName);
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userPhoneDisplay').textContent = state.user.phone;
    renderUserBookings();
  } else {
    login.style.display = 'flex';
    dash.style.display = 'none';
  }
}

function tryUserLogin() {
  const phone = document.getElementById('userPhone').value.trim();
  if (!phone) {
    toast('error', 'กรุณากรอกเบอร์โทร', 'ใส่เบอร์โทรที่ใช้จองคอร์ท');
    return;
  }
  if (!/^[0-9]{9,10}$/.test(phone)) {
    toast('error', 'เบอร์โทรไม่ถูกต้อง', 'กรุณากรอกเบอร์โทร 9–10 หลัก');
    return;
  }
  state.user.loggedIn = true;
  state.user.phone = phone;
  // Find name from latest booking
  const latestBooking = state.bookings
    .filter(b => b.phone === phone)
    .sort((a,b) => b.createdAt - a.createdAt)[0];
  state.user.name = latestBooking ? latestBooking.name : 'ผู้ใช้';
  saveData();
  renderUser();
  toast('success', 'เข้าสู่ระบบ', `ยินดีต้อนรับ ${state.user.name}`);
}

function userLogout() {
  state.user = { loggedIn: false, phone: null, name: null };
  saveData();
  renderUser();
  toast('success', 'ออกจากระบบแล้ว', 'คุณออกจากระบบเรียบร้อย');
}

function renderUserBookings() {
  const wrap = document.getElementById('userBookings');
  if (!state.user.loggedIn) return;

  const list = state.bookings
    .filter(b => b.phone === state.user.phone)
    .sort((a,b) => b.createdAt - a.createdAt);

  if (list.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-ico"><svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/></svg></div><p>ยังไม่มีประวัติการจอง — <a href="booking.html" style="color:var(--red);font-weight:600">จองคอร์ทเลย</a></p></div>`;
    return;
  }

  const statusText = { pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก' };

  wrap.innerHTML = `<div class="booking-list">` + list.map(b => {
    const slotsStr = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `คอร์ท${s.court} · ${fmtSlot(s.hour)}`)
      .join(', ');
    const slotsDetail = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `<div class="detail-slot-row"><span>คอร์ท ${s.court} · ${fmtSlot(s.hour)}</span><span>฿${s.price}</span></div>`)
      .join('');
    const createdAt = new Date(b.createdAt);
    const createdStr = `${createdAt.getDate()}/${createdAt.getMonth()+1}/${createdAt.getFullYear()+543} ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;
    return `
      <div class="booking-item" onclick="toggleBookingDetail('${b.id}')">
        <div>
          <div class="booking-item-code">${b.id} <span class=\"booking-expand-hint\">▸</span></div>
          <div class="booking-item-date">${fmtDate(b.date)}</div>
          <div class="booking-item-details">
            <div class="booking-item-detail">${b.slots.length} คอร์ท</div>
            <div class="booking-item-detail">${slotsStr}</div>
          </div>
        </div>
        <div class="booking-item-right">
          <div class="booking-item-total">฿${b.total.toLocaleString()}</div>
          <span class="status-badge status-${b.status}">${statusText[b.status]}</span>
        </div>
        <div class="booking-detail" id="detail-${b.id}">
          <div class="booking-detail-section">
            <div class="detail-label">รายละเอียดคอร์ทจอง</div>
            ${slotsDetail}
            ${b.addons && b.addons.length ? `
              <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">
                <div style="font-size:12px;color:var(--ink-3);text-transform:uppercase;margin-bottom:8px;font-weight:700;">เช่า/ซื้อเพิ่มเติม</div>
                ${b.addons.map(a => {
                  if (a.type === 'racket') return `<div class="detail-slot-row"><span>เช่าไม้แบด ${a.qty} อัน</span><span>฿${a.price}</span></div>`;
                  if (a.type === 'shuttlecock') return `<div class="detail-slot-row"><span>ซื้อลูกแบด ${a.balls} ลูก</span><span>฿${a.price}</span></div>`;
                  return `<div class="detail-slot-row"><span>${a.type}</span><span>฿${a.price}</span></div>`;
                }).join('')}
              </div>
            ` : ''}
            <div class="detail-slot-row total"><span>ยอดรวม</span><span>฿${b.total.toLocaleString()}</span></div>
          </div>
          <div class="booking-detail-section">
            <div class="detail-label">ข้อมูลผู้จอง</div>
            <div class="detail-info-row"><span>ชื่อ</span><strong>${b.name}</strong></div>
            <div class="detail-info-row"><span>เบอร์โทร</span><strong>${b.phone}</strong></div>
            ${b.note ? `<div class="detail-info-row"><span>หมายเหตุ</span><strong>${b.note}</strong></div>` : ''}
          </div>
          <div class="booking-detail-section">
            <div class="detail-info-row"><span>จองเมื่อ</span><strong>${createdStr}</strong></div>
            <div style="display:flex;justify-content:flex-end;margin-top:16px;">
              <button onclick="downloadBookingImage(state.bookings.find(x => x.id === '${b.id}'))" class="btn btn-primary" style="padding:8px 16px;font-size:12px;">Download Booking</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

// ===== HISTORY =====
function renderHistory() { /* data loaded on search */ }

function searchHistory() {
  const phone = document.getElementById('historyPhone').value.trim();
  const result = document.getElementById('historyResult');
  if (!phone) {
    result.innerHTML = `<div class="empty-state"><div class="empty-ico"><svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/></svg></div><p>กรุณากรอกเบอร์โทร</p></div>`;
    return;
  }
  const list = state.bookings
    .filter(b => b.phone === phone)
    .sort((a,b) => b.createdAt - a.createdAt);

  if (list.length === 0) {
    result.innerHTML = `<div class="empty-state"><div class="empty-ico"><svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/></svg></div><p>ไม่พบประวัติการจองสำหรับเบอร์ ${phone}</p></div>`;
    return;
  }

  const statusText = { pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก' };

  result.innerHTML = `<div class="booking-list">` + list.map(b => {
    const slotsStr = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `คอร์ท${s.court} · ${fmtSlot(s.hour)}`)
      .join(', ');
    const slotsDetail = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `<div class="detail-slot-row"><span>คอร์ท ${s.court} · ${fmtSlot(s.hour)}</span><span>฿${s.price}</span></div>`)
      .join('');
    const createdAt = new Date(b.createdAt);
    const createdStr = `${createdAt.getDate()}/${createdAt.getMonth()+1}/${createdAt.getFullYear()+543} ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;
    return `
      <div class="booking-item" onclick="toggleBookingDetail('${b.id}')">
        <div>
          <div class="booking-item-code">${b.id} <span class=\"booking-expand-hint\">▸</span></div>
          <div class="booking-item-date">${fmtDate(b.date)}</div>
          <div class="booking-item-details">
            <div class="booking-item-detail"><strong>${b.name}</strong></div>
            <div class="booking-item-detail">${b.slots.length} คอร์ท</div>
            <div class="booking-item-detail">${slotsStr}</div>
          </div>
        </div>
        <div class="booking-item-right">
          <div class="booking-item-total">฿${b.total.toLocaleString()}</div>
          <span class="status-badge status-${b.status}">${statusText[b.status]}</span>
        </div>
        <div class="booking-detail" id="detail-${b.id}">
          <div class="booking-detail-section">
            <div class="detail-label">รายละเอียดคอร์ทจอง</div>
            ${slotsDetail}
            <div class="detail-slot-row total"><span>ยอดรวม</span><span>฿${b.total.toLocaleString()}</span></div>
          </div>
          <div class="booking-detail-section">
            <div class="detail-label">ข้อมูลผู้จอง</div>
            <div class="detail-info-row"><span>ชื่อ</span><strong>${b.name}</strong></div>
            <div class="detail-info-row"><span>เบอร์โทร</span><strong>${b.phone}</strong></div>
            ${b.note ? `<div class="detail-info-row"><span>หมายเหตุ</span><strong>${b.note}</strong></div>` : ''}
          </div>
          <div class="booking-detail-section">
            <div class="detail-info-row"><span>จองเมื่อ</span><strong>${createdStr}</strong></div>
            <div class="detail-info-row"><span>สถานะ</span><span class="status-badge status-${b.status}">${statusText[b.status]}</span></div>
          </div>
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

// ===== BOOKING DETAIL TOGGLE =====
function toggleBookingDetail(id) {
  const el = document.getElementById('detail-' + id);
  if (!el) return;
  const item = el.closest('.booking-item');
  const isOpen = el.classList.contains('open');
  // Close all others first
  document.querySelectorAll('.booking-detail.open').forEach(d => {
    d.classList.remove('open');
    d.closest('.booking-item').classList.remove('expanded');
    const hint = d.closest('.booking-item').querySelector('.booking-expand-hint');
    if (hint) hint.textContent = '▸';
  });
  if (!isOpen) {
    el.classList.add('open');
    item.classList.add('expanded');
    const hint = item.querySelector('.booking-expand-hint');
    if (hint) hint.textContent = '▾';
  }
}

// ===== ADMIN DETAIL TOGGLE =====
function toggleAdminDetail(id) {
  const el = document.getElementById('admin-detail-' + id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  // Close all others
  document.querySelectorAll('.admin-detail-row.open').forEach(d => {
    d.classList.remove('open');
    const hint = d.previousElementSibling.querySelector('.booking-expand-hint');
    if (hint) hint.textContent = '▸';
  });
  if (!isOpen) {
    el.classList.add('open');
    const hint = el.previousElementSibling.querySelector('.booking-expand-hint');
    if (hint) hint.textContent = '▾';
  }
}

// ===== ADMIN =====
function renderAdmin() {
  const login = document.getElementById('adminLogin');
  const dash = document.getElementById('adminDash');
  if (state.admin.loggedIn) {
    login.style.display = 'none';
    dash.style.display = 'block';
    renderAdminStats();
    renderAdminTable();
  } else {
    login.style.display = 'flex';
    dash.style.display = 'none';
  }
}

function tryLogin() {
  const pw = document.getElementById('adminPw').value;
  if (pw === CONFIG.adminPassword) {
    state.admin.loggedIn = true;
    renderAdmin();
    toast('success', 'เข้าสู่ระบบ', 'ยินดีต้อนรับเข้าสู่แผง Admin');
  } else {
    toast('error', 'รหัสผ่านผิด', 'กรุณาลองใหม่');
  }
}

function renderAdminStats() {
  const wrap = document.getElementById('adminStats');
  const today = todayStr();
  const todayBookings = state.bookings.filter(b => b.date === today && b.status !== 'cancelled');
  const pending = state.bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = state.bookings
    .filter(b => b.status === 'confirmed')
    .reduce((s,b) => s + b.total, 0);
  const activeMatches = state.matches.filter(m => !m.finished).length;

  wrap.innerHTML = `
    <div class="admin-stat">
      <div class="admin-stat-label">จองวันนี้</div>
      <div class="admin-stat-value">${todayBookings.length}</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat-label">แมตช์กำลังเล่น</div>
      <div class="admin-stat-value">${activeMatches}</div>
    </div>
    <div class="admin-stat">
      <div class="admin-stat-label">รายได้รวม</div>
      <div class="admin-stat-value red">฿${totalRevenue.toLocaleString()}</div>
    </div>
  `;
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTbody');
  const q = document.getElementById('adminFilter').value.toLowerCase().trim();
  const statusFilter = document.getElementById('adminStatusFilter').value;

  let list = [...state.bookings].sort((a,b) => b.createdAt - a.createdAt);
  if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
  if (q) {
    list = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px 20px;color:var(--ink-3)">ไม่พบข้อมูลการจอง</td></tr>`;
    return;
  }

  const statusText = { pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก' };

  tbody.innerHTML = list.map(b => {
    const slotsStr = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `ค.${s.court}·${fmtHour(s.hour)}`)
      .join(', ');

    const slotsDetail = b.slots
      .sort((a,b) => a.court - b.court || a.hour - b.hour)
      .map(s => `<div class="detail-slot-row"><span>คอร์ท ${s.court} · ${fmtSlot(s.hour)}</span><span>฿${s.price}</span></div>`)
      .join('');

    const createdAt = new Date(b.createdAt);
    const createdStr = `${createdAt.getDate()}/${createdAt.getMonth()+1}/${createdAt.getFullYear()+543} ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;

    let actions = '';
    if (b.status === 'cancelled') {
      actions = `<button class="icon-btn ok" onclick="event.stopPropagation();updateStatus('${b.id}','confirmed')">คืนสถานะ</button>`;
    } else {
      actions = `<button class="icon-btn danger" onclick="event.stopPropagation();updateStatus('${b.id}','cancelled')">ยกเลิก</button>`;
    }

    const d = new Date(b.date);
    const shortDate = `${d.getDate()}/${d.getMonth()+1}`;

    return `
      <tr class="admin-row" onclick="toggleAdminDetail('${b.id}')" style="cursor:pointer">
        <td><span class="code">${b.id}</span> <span class="booking-expand-hint">▸</span></td>
        <td>${b.name}</td>
        <td>${b.phone}</td>
        <td>${shortDate}</td>
        <td>${slotsStr}</td>
        <td>฿${b.total.toLocaleString()}</td>
        <td><span class="status-badge status-${b.status}">${statusText[b.status]}</span></td>
        <td><div class="admin-actions">${actions}</div></td>
      </tr>
      <tr class="admin-detail-row" id="admin-detail-${b.id}">
        <td colspan="8">
          <div class="admin-detail-content">
            <div class="admin-detail-col">
              <div class="detail-label">รายละเอียดคอร์ทจอง</div>
              ${slotsDetail}
              ${b.addons && b.addons.length ? b.addons.map(a => {
                if (a.type === 'racket') return `<div class="detail-slot-row"><span>เช่าไม้แบด ${a.qty} อัน</span><span>฿${a.price}</span></div>`;
                if (a.type === 'shuttlecock') return `<div class="detail-slot-row"><span>ซื้อลูกแบด ${a.balls} ลูก</span><span>฿${a.price}</span></div>`;
                return `<div class="detail-slot-row"><span>${a.type}</span><span>฿${a.price}</span></div>`;
              }).join('') : '<div class="detail-slot-row"><span style="color:var(--ink-3)">ไม้แบด/ลูกแบด: ไม่ได้เช่า</span><span></span></div>'}
              <div class="detail-slot-row total"><span>ยอดรวม</span><span>฿${b.total.toLocaleString()}</span></div>
            </div>
            <div class="admin-detail-col">
              <div class="detail-label">ข้อมูลผู้จอง</div>
              <div class="detail-info-row"><span>ชื่อ</span><strong>${b.name}</strong></div>
              <div class="detail-info-row"><span>เบอร์โทร</span><strong>${b.phone}</strong></div>
              <div class="detail-info-row"><span>วันที่จอง</span><strong>${fmtDate(b.date)}</strong></div>
              <div class="detail-info-row"><span>จองเมื่อ</span><strong>${createdStr}</strong></div>
              ${b.note ? `<div class="detail-info-row"><span>หมายเหตุ</span><strong class="admin-note">${b.note}</strong></div>` : '<div class="detail-info-row"><span>หมายเหตุ</span><strong style="color:var(--ink-3)">—</strong></div>'}
            </div>
            <div class="admin-detail-col">
              <div class="detail-label">สถานะ</div>
              <div class="detail-info-row"><span>สถานะปัจจุบัน</span><span class="status-badge status-${b.status}">${statusText[b.status]}</span></div>
              <div class="admin-actions" style="margin-top:12px">${actions}</div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateStatus(id, status) {
  const b = state.bookings.find(x => x.id === id);
  if (!b) return;
  b.status = status;
  saveData();
  renderAdminStats();
  renderAdminTable();
  const msg = { confirmed: 'ยืนยันการจองแล้ว', cancelled: 'ยกเลิกการจองแล้ว' };
  toast('success', 'อัปเดตแล้ว', `${id} · ${msg[status] || 'อัปเดตสถานะ'}`);
}

// ===== INIT =====
function init() {
  loadData();
  loadUserSession();
  state.currentPage = detectCurrentPage();

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.onclick = () => navLinks.classList.toggle('open');
  }

  // Page-specific init
  const page = state.currentPage;

  if (page === 'booking') {
    document.getElementById('btnConfirm').onclick = openModal;
    document.getElementById('modalClose').onclick = closeModal;
    document.querySelector('#bookingModal .modal-backdrop').onclick = closeModal;
    document.getElementById('bookingForm').onsubmit = submitBooking;
    // Add-on checkbox listeners
    document.getElementById('checkRacket').onchange = () => { updateModalSummary(); updateSummary(); };
    document.getElementById('checkShuttlecock').onchange = () => { updateModalSummary(); updateSummary(); };
    // Payment popup listeners
    document.getElementById('paymentClose').onclick = () => {
      document.getElementById('paymentModal').classList.remove('open');
    };
    document.querySelector('#paymentModal .modal-backdrop').onclick = () => {
      document.getElementById('paymentModal').classList.remove('open');
    };
    document.getElementById('btnConfirmPayment').onclick = () => completePayment('promptpay');
    // Success modal listeners
    document.getElementById('successClose').onclick = () => {
      document.getElementById('successModal').classList.remove('open');
    };
    document.querySelector('#successModal .modal-backdrop').onclick = () => {
      document.getElementById('successModal').classList.remove('open');
    };
    document.getElementById('btnDownloadBooking').onclick = () => {
      const bookingId = document.getElementById('successDetails').dataset.bookingId;
      const booking = state.bookings.find(b => b.id === bookingId);
      if (booking) downloadBookingImage(booking);
    };
    // Form validation - toggle button color
    const btnSubmit = document.getElementById('btnSubmit');
    const nameInput = document.querySelector('#bookingForm input[name="phone"]');
    const phoneInput = document.querySelector('#bookingForm input[name="phone"]');
    function checkForm() {
      const name = document.querySelector('#bookingForm input[name="name"]').value.trim();
      const phone = phoneInput.value.trim();
      if (name && phone) {
        btnSubmit.classList.remove('btn-secondary');
        btnSubmit.classList.add('btn-primary');
      } else {
        btnSubmit.classList.remove('btn-primary');
        btnSubmit.classList.add('btn-secondary');
      }
    }
    document.querySelector('#bookingForm input[name="name"]').oninput = checkForm;
    phoneInput.oninput = checkForm;
    // Pre-fill phone/name if user is logged in
    if (state.user.loggedIn) {
      const phoneInput = document.querySelector('#bookingForm input[name="phone"]');
      const nameInput = document.querySelector('#bookingForm input[name="name"]');
      if (phoneInput) phoneInput.value = state.user.phone;
      if (nameInput && state.user.name !== 'ผู้ใช้') nameInput.value = state.user.name;
      checkForm();
    }
    renderBooking();
  }

  if (page === 'matchmaking') {
    document.getElementById('mmForm').onsubmit = joinQueue;
    // Pre-fill name/phone if user is logged in
    if (state.user.loggedIn) {
      const mmNameInput = document.getElementById('mmName');
      const mmPhoneInput = document.getElementById('mmPhone');
      if (mmPhoneInput) mmPhoneInput.value = state.user.phone;
      if (mmNameInput && state.user.name && state.user.name !== 'ผู้ใช้') mmNameInput.value = state.user.name;
    }
    renderMatchMaking();
    // Ticker for match timers + update "waiting X min" every 30s
    setInterval(tickMatches, 1000);
    setInterval(() => {
      if (state.currentPage === 'matchmaking') renderMatchMaking();
    }, 30000);
  }

  if (page === 'history') {
    document.getElementById('btnSearch').onclick = searchHistory;
    document.getElementById('historyPhone').onkeypress = (e) => {
      if (e.key === 'Enter') searchHistory();
    };
    // Auto-fill phone if user is logged in
    if (state.user.loggedIn) {
      document.getElementById('historyPhone').value = state.user.phone;
      searchHistory();
    }
    renderHistory();
  }

  if (page === 'user') {
    document.getElementById('btnUserLogin').onclick = tryUserLogin;
    document.getElementById('userPhone').onkeypress = (e) => {
      if (e.key === 'Enter') tryUserLogin();
    };
    document.getElementById('btnUserLogout').onclick = userLogout;
    renderUser();
  }

  if (page === 'admin') {
    document.getElementById('btnLogin').onclick = tryLogin;
    document.getElementById('adminPw').onkeypress = (e) => {
      if (e.key === 'Enter') tryLogin();
    };
    document.getElementById('btnLogout').onclick = () => {
      state.admin.loggedIn = false;
      document.getElementById('adminPw').value = '';
      renderAdmin();
    };
    document.getElementById('adminFilter').oninput = renderAdminTable;
    document.getElementById('adminStatusFilter').onchange = renderAdminTable;
    renderAdmin();
  }
}

// Expose for inline onclick
window.updateStatus = updateStatus;
window.leaveQueue = leaveQueue;
window.finishMatch = finishMatch;
window.toggleBookingDetail = toggleBookingDetail;
window.toggleAdminDetail = toggleAdminDetail;
window.changeQty = changeQty;

document.addEventListener('DOMContentLoaded', init);
