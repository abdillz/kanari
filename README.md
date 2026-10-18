# Simulator Pembuktian Kontak Kanari (alat peraga)

Alat peraga untuk esai "Agunan yang Tidak Pernah Diperjanjikan" (Lomba Esai Nasional Borneo Law Fair XXV). Ini bukan produk dan bukan sistem OJK. Seluruh nama penyelenggara, nomor, pesan, dan angka adalah data simulasi.

## Cara membuka
- Buka `index.html` langsung di browser (tanpa server), atau
- Deploy ke Vercel atau Netlify sebagai situs statis (tanpa build). Tautan hasil deploy dipakai pada Lampiran 8 esai.

## Layar (sesuai Gambar 4 dan Lampiran 8)
| Layar | Alamat | Yang diperagakan |
|---|---|---|
| 1. Penanaman | `#penanaman` | Nomor kanari unik per penyelenggara |
| 2. Pelacakan | `#pelacakan` | Komunikasi masuk dan atribusi ke penyelenggara |
| 3. Uji fungsi | `#uji` | Tiga pertanyaan uji (P1, P2, P3) dan praduga |
| 4. Akibat hukum | `#akibat` | Klarifikasi, kesempatan membantah, sanksi, penghapusan data |

## Cara demo (sekitar dua menit)
1. Layar 1: klik "Pasang semua", lalu "Lanjut ke pelacakan".
2. Layar 2: pesan hari ke-3 diterima nomor kanari B (penagih menyebut tunggakan). Pesan hari ke-2 pada C hanya menanyakan keberadaan. Klik "Ujikan komunikasi ini" pada B.
3. Layar 3: hasil merah, praduga berlaku. Klik tab C untuk membandingkan: hasil hijau, penyelenggara patuh.
4. Layar 4: pilih "Tidak dapat membuktikan" untuk melihat sanksi, atau "Menyerahkan log persetujuan" agar praduga gugur.
5. Ganti "Varian kanari" di kanan atas ke "Kanari Pasif" untuk melihat kasus pemasaran tanpa tunggakan.

## Struktur
```
index.html
css/style.css
js/app.js
```
