# Starter Prompt: Images Format Converter

Saya ingin melanjutkan pengembangan proyek **Images Format Converter**.

Repository:
https://github.com/andra-gs/Images-Format-Converter

## Sumber acuan wajib

Baca dan ikuti dokumen berikut sebelum memberi rekomendasi atau mengubah kode:

1. `AGENTS.md` di root repository. Ini adalah instruksi utama untuk ChatGPT coding agent.
2. `README.md`
3. `docs/PROJECT_CONTEXT.md`
4. `docs/TECHNICAL_SPECIFICATION.md`
5. `docs/DEVELOPMENT_ROADMAP.md`
6. `docs/DEVELOPMENT_LOG.md`

Gunakan dokumentasi terbaru dari branch `main`. Jangan mengandalkan salinan lama jika repository sudah terhubung.

## Tugas awal

1. Identifikasi GitHub username developer yang sedang menggunakan sesi ini. Jangan menebak dari pemilik repository atau akun ChatGPT.
2. Periksa branch aktif dan kondisi repository terbaru.
3. Baca status fase dan riwayat perubahan pada Development Roadmap serta Development Log.
4. Tentukan tugas yang sesuai dengan username berdasarkan tabel kepemilikan di `AGENTS.md`.
5. Pastikan tugas tersebut memang belum selesai atau belum dikerjakan. Jangan menganggap tugas yang direncanakan sudah diimplementasikan.
6. Pelajari file kode yang relevan sebelum mengusulkan perubahan.
7. Identifikasi kontrak API dan file bersama yang perlu dikoordinasikan dengan anggota lain.

## Status pengembangan

- Phase 0 sampai Phase 6: selesai dan sudah terintegrasi ke branch `main`.
- Phase 5: Image Manipulation, selesai melalui PR #5.
- Phase 6: Image Optimization & Export Workflow, selesai melalui PR #7 dan PR #9. PR #9 melaporkan 156/156 automated tests lulus, production build berhasil, GitHub Actions lulus, dan integrated browser checks selesai.
- Phase 7: Testing, Documentation, and Release, tahap berikutnya dan belum dimulai.
- Known issue: startup skeleton terakhir dilaporkan selalu menggunakan tema terang, meskipun dark theme dipilih. Perlu diperbaiki dan diuji ulang.
- Metadata Management tetap menjadi deferred backlog tanpa owner atau branch.

Rincian tugas, file target, kriteria selesai, branch, dan urutan merge tersedia di `docs/DEVELOPMENT_ROADMAP.md`.

## Aturan kerja

- Kerjakan hanya tanggung jawab GitHub username yang sudah teridentifikasi.
- Jangan mengubah pembagian tugas tanpa persetujuan pemilik proyek.
- Jangan bekerja langsung pada branch `main`.
- Gunakan feature branch yang ditentukan untuk fase terkait, dibuat dari `main` terbaru.
- Sepakati kontrak API, format data, error handling, dan resource ownership sebelum integrasi lintas modul.
- Jangan mengubah modul milik anggota lain tanpa koordinasi.
- Pertahankan pemrosesan gambar sepenuhnya lokal di browser.
- Pertahankan arsitektur Vanilla JavaScript, HTML5, CSS3, Vite, Web Workers, dan conversion pipeline yang sudah ada.
- Tambahkan automated tests untuk perubahan.
- Jalankan `npm test`, `npm run build`, dan pemeriksaan browser yang relevan sebelum Pull Request.
- Jangan mengklaim perubahan, commit, push, build, atau tes berhasil jika belum diverifikasi.
- Perbarui dokumentasi hanya berdasarkan perubahan dan pengujian yang benar-benar dilakukan.

## Format respons pertama

Berikan:
- GitHub username yang teridentifikasi.
- Ringkasan kondisi repository dan branch.
- Fase aktif dan tugas yang menjadi tanggung jawab developer.
- File kode dan dokumentasi yang perlu dibaca.
- Ketergantungan atau kontrak API yang harus disepakati.
- Rencana implementasi bertahap.

Jangan langsung mengubah kode sebelum pemeriksaan awal dan rencana kerja selesai. Jika ada keputusan penting yang belum disepakati dan dapat menyebabkan konflik integrasi, tanyakan terlebih dahulu.
