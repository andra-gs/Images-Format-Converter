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

Repository sudah mencapai rilis stabil pertama `v1.0.0`. Jangan menganggap Phase 7 masih aktif. Untuk pekerjaan lanjutan, identifikasi apakah permintaan termasuk bugfix, maintenance, atau pengembangan versi berikutnya. Jangan mengubah tag atau aset release `v1.0.0`.

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
- Phase 7: Testing and Documentation, selesai pada 2026-11-26. Release stabil pertama `v1.0.0` juga sudah diterbitkan pada 2026-11-26.
- Release: https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0
- Tag commit: `df882784d4bd18854067663191bc4b00dae5c0d5`.
- Known issue pada `v1.0.0`: startup skeleton terakhir dilaporkan selalu menggunakan tema terang, meskipun dark theme dipilih. Catat sebagai pekerjaan maintenance dan jangan mengklaim sudah diperbaiki sebelum ada perubahan serta pengujian ulang.
- Metadata Management tetap menjadi deferred backlog tanpa owner atau branch.
- Post-v1.0.0 roadmap: Phase 8 Image to PDF, Phase 9 PDF to Image, Phase 10 DOCX to PDF (research/prototype gate), dan Phase 11 PDF document management, Phase 12 unified document workflow, dan Phase 13 final QA/documentation/release. Semua masih planned, belum diimplementasikan. Target roadmap adalah v2.0.0.
- Jangan menambahkan PDF/DOCX ke image capability registry sebagai raster codec. Rancang document-processing layer terpisah dan pertahankan local-first. Kandidat library di Technical Specification belum disetujui.
- DOCX-to-PDF harus melewati fidelity test corpus dan decision gate. Mammoth.js/docx-preview bukan bukti rendering setara Microsoft Word. Legacy DOC belum termasuk scope. Jika fidelity gate gagal, DOCX-to-PDF ditunda dan tidak masuk supported-format matrix.
- Pembagian kerja Phase 8–13: Andra (andra-gs) bertanggung jawab atas engine dokumen, evaluasi library, validasi, kontrak data, batas resource, dan automated tests. Farrel (FarrelPtrv) bertanggung jawab atas UI, interaksi, integrasi UI-engine, browser/UI QA, dan dokumentasi pengguna. Engine PR di-merge lebih dahulu, lalu branch UI diperbarui dari main terbaru sebelum integrasi.

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
