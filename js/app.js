(function () {
  "use strict";

  /* ====== Data simulasi ====== */
  var LENDERS = [
    { id: "A", name: "Pindar Simulasi A", entity: "PT Aksara Dana Simulasi", lic: "Berizin (simulasi)", canary: "0800-0000-A01" },
    { id: "B", name: "Pindar Simulasi B", entity: "PT Bahtera Kredit Simulasi", lic: "Berizin (simulasi)", canary: "0800-0000-B02" },
    { id: "C", name: "Pindar Simulasi C", entity: "PT Cakra Pendanaan Simulasi", lic: "Berizin (simulasi)", canary: "0800-0000-C03" }
  ];

  var VARIANTS = {
    pasif: { label: "Kanari Pasif", text: "Pengguna uji melunasi tepat waktu. Yang dipantau: pemakaian kontak darurat di luar penagihan (pemasaran, kebocoran data)." },
    relawan: { label: "Kanari Relawan", text: "Konsumen yang sedang menunggak dan mengadu ke OJK mengganti kontak daruratnya dengan nomor kanari secara sukarela." },
    aktif: { label: "Kanari Aktif", text: "Pengguna uji meminjam nominal terkecil dan menunggak terkendali. Hanya untuk penyelenggara berisiko tinggi dengan indikasi kuat." }
  };

  // Atribut pesan: afterDelinquency (P1), revealsDebt (P2), consentDoc & limited (P3)
  var EVENTS = {
    pasif: [
      { id: "B1", lender: "B", day: 4, sender: "Tim pemasaran Pindar Simulasi B", channel: "Pesan singkat",
        text: "Promo pinjaman baru untuk Anda. Ajukan sekarang, cair dalam 5 menit.",
        afterDelinquency: false, revealsDebt: false, consentDoc: false, limited: false }
    ],
    relawan: null, aktif: null
  };
  var CASE_EVENTS = [
    { id: "B1", lender: "B", day: 3, sender: "Penagih pihak ketiga (PT Tagih Simulasi)", channel: "Pesan singkat",
      text: "Selamat siang. Saudara X menunggak Rp1.200.000. Mohon diingatkan agar segera melunasi.",
      afterDelinquency: true, revealsDebt: true, consentDoc: false, limited: false },
    { id: "C1", lender: "C", day: 2, sender: "Petugas layanan Pindar Simulasi C", channel: "Panggilan telepon (ringkasan)",
      text: "Apakah Bapak/Ibu mengetahui cara menghubungi Saudara X? Kami belum dapat menghubunginya.",
      afterDelinquency: true, revealsDebt: false, consentDoc: true, limited: true }
  ];
  EVENTS.relawan = CASE_EVENTS; EVENTS.aktif = CASE_EVENTS;

  /* ====== State ====== */
  var DEFAULT = { variant: "aktif", installed: {}, selected: null, rebuttal: null };
  var state = load();

  function load() {
    try { var s = JSON.parse(sessionStorage.getItem("kk-state")); if (s && s.installed) return s; } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { try { sessionStorage.setItem("kk-state", JSON.stringify(state)); } catch (e) {} }

  var app = document.getElementById("app");
  var variantSel = document.getElementById("variant");
  variantSel.value = state.variant;
  variantSel.addEventListener("change", function () {
    state.variant = variantSel.value; state.selected = null; state.rebuttal = null; save(); render();
  });
  document.getElementById("reset").addEventListener("click", function () {
    state = JSON.parse(JSON.stringify(DEFAULT)); variantSel.value = state.variant; save(); location.hash = "#penanaman"; render();
  });

  /* ====== Helpers ====== */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lender(id) { return LENDERS.filter(function (l) { return l.id === id; })[0]; }
  function allInstalled() { return LENDERS.every(function (l) { return state.installed[l.id]; }); }
  function events() { return EVENTS[state.variant]; }
  function evalEvent(e) {
    var p3 = e.consentDoc && e.limited;
    var met = (e.afterDelinquency || e.revealsDebt) && !p3;
    return { p1: e.afterDelinquency, p2: e.revealsDebt, p3: p3, met: met };
  }
  function route() { return (location.hash || "#penanaman").slice(1); }
  function go(r) { location.hash = "#" + r; }

  /* ====== Layar 1: Penanaman ====== */
  function vPenanaman() {
    var v = VARIANTS[state.variant];
    var n = LENDERS.filter(function (l) { return state.installed[l.id]; }).length;
    var h = '<div class="head"><div class="eyebrow">Layar 1 dari 4</div><h2>Penanaman Nomor Kanari</h2>' +
      '<p>Petugas pengawas mencantumkan nomor kanari yang unik untuk setiap penyelenggara sebagai kontak darurat. Karena satu nomor hanya diberikan kepada satu penyelenggara, setiap komunikasi yang masuk dapat diatribusikan.</p></div>';
    h += '<div class="card" style="margin-bottom:14px"><span class="pill blue">' + esc(v.label) + '</span> <span class="hint" style="margin-left:6px">' + esc(v.text) + '</span></div>';
    h += '<div class="grid c3">';
    LENDERS.forEach(function (l) {
      var on = !!state.installed[l.id];
      h += '<div class="card lender' + (on ? ' installed' : '') + '"><h3>' + esc(l.name) + '</h3><div class="meta">' + esc(l.entity) + '</div>' +
        '<dl><dt>Status izin</dt><dd>' + esc(l.lic) + '</dd><dt>Nomor kanari</dt><dd><span class="mono">' + esc(l.canary) + '</span></dd>' +
        '<dt>Peran nomor</dt><dd>Kontak darurat pengguna uji</dd></dl>' +
        (on ? '<span class="pill green">Terpasang sebagai kontak darurat</span>' :
          '<button class="btn sm" data-install="' + l.id + '">Pasang nomor kanari</button>') + '</div>';
    });
    h += '</div>';
    h += '<div class="actions"><span class="hint">' + n + ' dari 3 nomor terpasang.</span><span class="spacer"></span>' +
      '<button class="btn sec" id="installAll"' + (allInstalled() ? ' hidden' : '') + '>Pasang semua</button>' +
      '<button class="btn" id="next"' + (allInstalled() ? '' : ' disabled') + '>Lanjut ke pelacakan</button></div>';
    h += '<div class="note"><b>Batas etika.</b> Nomor kanari adalah nomor milik pengawas sehingga persetujuan pemilik nomor terpenuhi. Varian aktif hanya dipakai sebagai upaya terakhir (Lampiran 15).</div>';
    return h;
  }
  function bPenanaman() {
    app.querySelectorAll("[data-install]").forEach(function (b) {
      b.addEventListener("click", function () { state.installed[b.getAttribute("data-install")] = true; save(); render(); });
    });
    var ia = document.getElementById("installAll");
    if (ia) ia.addEventListener("click", function () { LENDERS.forEach(function (l) { state.installed[l.id] = true; }); save(); render(); });
    document.getElementById("next").addEventListener("click", function () { go("pelacakan"); });
  }

  /* ====== Layar 2: Pelacakan ====== */
  function vPelacakan() {
    var h = '<div class="head"><div class="eyebrow">Layar 2 dari 4</div><h2>Pelacakan Komunikasi Masuk</h2>' +
      '<p>Garis waktu pesan dan panggilan yang diterima nomor kanari. Setiap baris langsung menunjuk penyelenggara yang memiliki nomor tersebut.</p></div>';
    if (!allInstalled()) {
      return h + '<div class="empty">Nomor kanari belum terpasang. Selesaikan Layar 1 terlebih dahulu.<div class="actions" style="justify-content:center"><button class="btn" id="back">Ke Layar 1</button></div></div>';
    }
    var ev = events().slice().sort(function (a, b) { return a.day - b.day; });
    h += '<div class="card" style="margin-bottom:14px"><span class="pill blue">' + esc(VARIANTS[state.variant].label) + '</span> ' +
      '<span class="hint" style="margin-left:6px">' + (state.variant === "pasif" ? "Tidak ada tunggakan pada periode pemantauan." : "Tunggakan pengguna uji dimulai pada hari ke-1.") + '</span></div>';
    h += '<div class="grid c2" style="grid-template-columns:2fr 1fr"><div><ul class="timeline">';
    h += '<li><div class="when">Hari ke-0</div><div class="who">Pemasangan selesai</div>Tiga nomor kanari terpasang sebagai kontak darurat.</li>';
    ev.forEach(function (e) {
      var l = lender(e.lender), r = evalEvent(e);
      h += '<li class="' + (r.met ? 'alert' : '') + '"><div class="when">Hari ke-' + e.day + ' &middot; ' + esc(e.channel) + '</div>' +
        '<div class="who">Diterima nomor <span class="mono">' + esc(l.canary) + '</span> &rarr; atribusi: <b>' + esc(l.name) + '</b><br>Pengirim: ' + esc(e.sender) + '</div>' +
        '<blockquote>&ldquo;' + esc(e.text) + '&rdquo;</blockquote>' +
        '<div class="row"><button class="btn sm" data-test="' + e.id + '">Ujikan komunikasi ini</button></div></li>';
    });
    h += '<li class="ok"><div class="when">Hari ke-14</div><div class="who">Akhir periode pemantauan</div>' +
      '<b>Pindar Simulasi A:</b> tidak ada komunikasi yang masuk ke nomor kanari.</li>';
    h += '</ul></div>';
    h += '<aside class="card"><h3 style="font-size:16px;margin-bottom:8px">Ringkasan per penyelenggara</h3><div class="tbl-wrap"><table><thead><tr><th>Penyelenggara</th><th>Komunikasi</th></tr></thead><tbody>';
    LENDERS.forEach(function (l) {
      var c = events().filter(function (e) { return e.lender === l.id; }).length;
      h += '<tr><td>' + esc(l.name) + '</td><td>' + (c ? '<span class="pill amber">' + c + ' masuk</span>' : '<span class="pill gray">0</span>') + '</td></tr>';
    });
    h += '</tbody></table></div><p class="hint" style="margin-top:10px">Nomor kanari tidak pernah dipakai untuk keperluan lain, sehingga setiap komunikasi dapat ditelusuri ke satu penyelenggara.</p></aside></div>';
    h += '<div class="actions"><button class="btn sec" id="back">Kembali</button></div>';
    return h;
  }
  function bPelacakan() {
    var b = document.getElementById("back"); if (b) b.addEventListener("click", function () { go("penanaman"); });
    app.querySelectorAll("[data-test]").forEach(function (x) {
      x.addEventListener("click", function () { state.selected = x.getAttribute("data-test"); state.rebuttal = null; save(); go("uji"); });
    });
  }

  /* ====== Layar 3: Uji Fungsi ====== */
  function vUji() {
    var h = '<div class="head"><div class="eyebrow">Layar 3 dari 4</div><h2>Penerapan Uji Fungsi</h2>' +
      '<p>Tiga pertanyaan uji diterapkan pada isi komunikasi. Praduga agunan sosial berlaku apabila P1 atau P2 dijawab &ldquo;Ya&rdquo; dan P3 dijawab &ldquo;Tidak&rdquo;.</p></div>';
    if (!allInstalled()) return h + '<div class="empty">Selesaikan Layar 1 terlebih dahulu.<div class="actions" style="justify-content:center"><button class="btn" id="back">Ke Layar 1</button></div></div>';
    var ev = events();
    if (!state.selected || !ev.some(function (e) { return e.id === state.selected; })) state.selected = ev[0].id;
    var e = ev.filter(function (x) { return x.id === state.selected; })[0];
    var l = lender(e.lender), r = evalEvent(e);
    h += '<div class="tabs">';
    ev.forEach(function (x) {
      h += '<button class="tab' + (x.id === e.id ? ' on' : '') + '" data-tab="' + x.id + '">' + esc(lender(x.lender).name) + ' &middot; hari ke-' + x.day + '</button>';
    });
    h += '</div>';
    h += '<div class="card"><div class="hint" style="margin-bottom:6px">Komunikasi yang diuji &middot; diterima <span class="mono">' + esc(l.canary) + '</span> (' + esc(l.name) + ')</div>' +
      '<blockquote style="margin:0 0 6px;padding:10px 14px;background:#f5f7fa;border-left:3px solid #aab6c8;font-style:italic">&ldquo;' + esc(e.text) + '&rdquo;</blockquote>' +
      '<div class="hint">Pengirim: ' + esc(e.sender) + '</div></div>';
    function q(code, title, desc, yes) {
      return '<div class="q"><div class="code">' + code + '</div><div><h4>' + title + '</h4><p>' + desc + '</p></div><div><span class="pill ' + (yes ? 'red' : 'gray') + '">' + (yes ? 'Ya' : 'Tidak') + '</span></div></div>';
    }
    h += '<div class="card" style="margin-top:14px">';
    h += q("P1", "Apakah pihak ketiga dihubungi setelah terjadi tunggakan?", e.afterDelinquency ? "Komunikasi diterima setelah hari ke-1 tunggakan." : "Tidak ada tunggakan pada saat komunikasi diterima.", e.afterDelinquency);
    h += q("P2", "Apakah komunikasi mengungkap kewajiban debitur?", e.revealsDebt ? "Pesan menyebut tunggakan dan jumlahnya." : "Pesan tidak menyebut utang atau tunggakan.", e.revealsDebt);
    h += q("P3", "Apakah ada persetujuan terdokumentasi dan isi terbatas pada konfirmasi keberadaan?", e.consentDoc && e.limited ? "Persetujuan pemilik nomor tercatat dan isi hanya menanyakan keberadaan." : "Tidak ada persetujuan terdokumentasi atau isi melampaui konfirmasi keberadaan.", e.consentDoc && e.limited);
    h += '</div>';
    if (r.met) {
      h += '<div class="verdict met"><h3>Praduga agunan sosial berlaku</h3>Penyelenggara dianggap memanfaatkan pihak ketiga untuk menekan pengguna dan wajib membuktikan sebaliknya (usulan Pasal 62A dan 62B).</div>';
    } else if (!r.p1 && !r.p2) {
      h += '<div class="verdict notmet"><h3>Uji fungsi tidak terpenuhi</h3>Komunikasi bukan penagihan. Namun, pemakaian kontak darurat untuk pemasaran perlu ditelaah terpisah sebagai dugaan penggunaan data di luar tujuan (UU PDP).</div>';
    } else {
      h += '<div class="verdict notmet"><h3>Uji fungsi tidak terpenuhi</h3>Komunikasi terbatas pada konfirmasi keberadaan dengan persetujuan terdokumentasi (usulan Pasal 62D). Penyelenggara patuh.</div>';
    }
    h += '<div class="rule"><b>Rumusan usulan.</b> Pasal 62A: PUJK dilarang memanfaatkan pihak selain Konsumen, dengan cara dan melalui saluran apa pun, untuk menimbulkan tekanan agar Konsumen memenuhi kewajibannya. Pasal 62B: praduga gugur apabila PUJK membuktikan persetujuan terdokumentasi dan isi komunikasi terbatas pada konfirmasi keberadaan.</div>';
    h += '<div class="actions"><button class="btn sec" id="back">Kembali</button><span class="spacer"></span>' +
      '<button class="btn" id="next">' + (r.met ? 'Lanjut ke akibat hukum' : 'Lihat tindak lanjut') + '</button></div>';
    return h;
  }
  function bUji() {
    var b = document.getElementById("back"); if (b) b.addEventListener("click", function () { go(allInstalled() ? "pelacakan" : "penanaman"); });
    var n = document.getElementById("next"); if (n) n.addEventListener("click", function () { go("akibat"); });
    app.querySelectorAll("[data-tab]").forEach(function (t) {
      t.addEventListener("click", function () { state.selected = t.getAttribute("data-tab"); state.rebuttal = null; save(); render(); });
    });
  }

  /* ====== Layar 4: Akibat Hukum ====== */
  function vAkibat() {
    var h = '<div class="head"><div class="eyebrow">Layar 4 dari 4</div><h2>Jalur Akibat Hukum</h2>' +
      '<p>Urutan tindak lanjut setelah praduga berlaku, termasuk kesempatan membantah bagi penyelenggara.</p></div>';
    if (!allInstalled()) return h + '<div class="empty">Selesaikan Layar 1 terlebih dahulu.<div class="actions" style="justify-content:center"><button class="btn" id="back">Ke Layar 1</button></div></div>';
    var ev = events();
    var e = ev.filter(function (x) { return x.id === state.selected; })[0] || ev[0];
    var l = lender(e.lender), r = evalEvent(e);
    h += '<div class="card" style="margin-bottom:14px"><span class="pill ' + (r.met ? 'red' : 'green') + '">' + esc(l.name) + ' &middot; hari ke-' + e.day + '</span> ' +
      '<span class="hint" style="margin-left:6px">' + (r.met ? 'Praduga agunan sosial berlaku.' : 'Uji fungsi tidak terpenuhi.') + '</span></div>';
    if (!r.met) {
      h += '<div class="empty"><b>Tidak ada tindak lanjut agunan sosial.</b><br>Komunikasi ini tidak memenuhi uji fungsi. Pilih komunikasi lain di Layar 3 untuk melihat jalur akibat hukum.' +
        '<div class="actions" style="justify-content:center"><button class="btn" id="toUji">Kembali ke uji fungsi</button></div></div>';
      return h;
    }
    var reb = state.rebuttal; // null | "gagal" | "berhasil"
    var step = function (cls, title, desc, right) {
      return '<li class="' + cls + '"><div><h4>' + title + '</h4><p>' + desc + '</p></div><div>' + (right || '') + '</div></li>';
    };
    h += '<div class="card"><ol class="steps">';
    h += step("done", "Permintaan klarifikasi", "OJK meminta penjelasan tertulis, data penugasan penagih, dan log pemrosesan dari " + esc(l.name) + ".", '<span class="pill green">Selesai</span>');
    if (reb === null) {
      h += step("stop", "Kesempatan membuktikan sebaliknya", "Beban pembuktian berada pada penyelenggara (usulan Pasal 62B). Pilih hasil simulasi:",
        '<button class="btn sm" id="rebFail">Tidak dapat membuktikan</button> <button class="btn sm sec" id="rebOk">Menyerahkan log persetujuan</button>');
      h += step("wait", "Sanksi administratif", "Berdasarkan Pasal 62 ayat (4) POJK 22/2023 (usulan Pasal 62C ayat (2)).", "");
      h += step("wait", "Perintah penghapusan data", "Data pribadi pihak ketiga yang dipakai wajib dihapus (usulan Pasal 62C ayat (1)).", "");
      h += step("wait", "Pembatasan kegiatan penagihan", "Dikenakan bila pelanggaran berulang dalam 12 bulan (usulan Pasal 62C ayat (3)).", "");
    } else if (reb === "berhasil") {
      h += step("done", "Penyelenggara membantah", "Log persetujuan terdokumentasi dan rekaman yang membatasi isi komunikasi diserahkan.", '<span class="pill green">Diterima</span>');
      h += step("done", "Praduga gugur", "Perkara ditutup. Penyelenggara yang patuh tidak dirugikan oleh praduga.", '<span class="pill green">Ditutup</span>');
    } else {
      h += step("done", "Penyelenggara tidak dapat membuktikan", "Tidak ada log persetujuan pemilik nomor dan isi komunikasi menyebut kewajiban pengguna uji.", '<span class="pill red">Praduga tetap</span>');
      h += step("done", "Sanksi administratif", "Berdasarkan Pasal 62 ayat (4) POJK 22/2023 (usulan Pasal 62C ayat (2)). Denda dan perintah perbaikan penagihan pihak ketiga.", '<span class="pill amber">Dijatuhkan</span>');
      h += step("done", "Perintah penghapusan data", "Data pribadi pihak ketiga yang dipakai dihapus dan penghapusan dilaporkan.", '<span class="pill amber">Diperintahkan</span>');
      h += step("wait", "Pembatasan kegiatan penagihan", "Dikenakan bila pelanggaran berulang dalam 12 bulan (usulan Pasal 62C ayat (3)).", '<span class="pill gray">Bersyarat</span>');
    }
    h += '</ol></div>';
    h += '<div class="note"><b>Catatan metodologis.</b> Hasil kanari memicu pemeriksaan dan bukan satu-satunya dasar sanksi. Penyelenggara tetap dijamin haknya untuk membantah (Lampiran 7, tahap 7).</div>';
    h += '<div class="actions"><button class="btn sec" id="toUji">Kembali ke uji fungsi</button><span class="spacer"></span><button class="btn sec" id="restart">Ulangi dari Layar 1</button></div>';
    return h;
  }
  function bAkibat() {
    var b = document.getElementById("back"); if (b) b.addEventListener("click", function () { go("penanaman"); });
    var t = document.getElementById("toUji"); if (t) t.addEventListener("click", function () { go("uji"); });
    var rf = document.getElementById("rebFail"); if (rf) rf.addEventListener("click", function () { state.rebuttal = "gagal"; save(); render(); });
    var ro = document.getElementById("rebOk"); if (ro) ro.addEventListener("click", function () { state.rebuttal = "berhasil"; save(); render(); });
    var rs = document.getElementById("restart"); if (rs) rs.addEventListener("click", function () { state.installed = {}; state.selected = null; state.rebuttal = null; save(); go("penanaman"); });
  }

  /* ====== Router ====== */
  var VIEWS = { penanaman: [vPenanaman, bPenanaman], pelacakan: [vPelacakan, bPelacakan], uji: [vUji, bUji], akibat: [vAkibat, bAkibat] };
  var ORDER = ["penanaman", "pelacakan", "uji", "akibat"];

  function render() {
    var r = route(); if (!VIEWS[r]) r = "penanaman";
    app.innerHTML = VIEWS[r][0]();
    VIEWS[r][1]();
    document.querySelectorAll(".stepper a").forEach(function (a) {
      var s = a.getAttribute("data-step"), i = ORDER.indexOf(s), cur = ORDER.indexOf(r);
      a.classList.toggle("active", s === r);
      a.classList.toggle("done", i < cur);
    });
    document.title = "Simulator Kontak Kanari";
  }
  window.addEventListener("hashchange", function () { render(); window.scrollTo(0, 0); });
  render();
})();
