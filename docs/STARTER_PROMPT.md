# Starter Prompt: Images Format Converter

Saya ingin memulai pengembangan proyek **Images Format Converter** berdasarkan dokumentasi proyek yang tersedia di Project ini.

Tolong jadikan file berikut sebagai sumber acuan utama:
- `README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/TECHNICAL_SPECIFICATION.md`
- `docs/DEVELOPMENT_ROADMAP.md`
- `docs/DEVELOPMENT_LOG.md`
- `docs/CHATGPT_PROJECT_INSTRUCTIONS.md`

## Tugas awal

1. Pahami tujuan, batasan, arsitektur, teknologi, daftar format, dan roadmap proyek.
2. Jika repository GitHub sudah terhubung, periksa kondisi repository dan file yang sudah ada sebelum mengusulkan perubahan. Jika belum terhubung, jangan menganggap repository sudah tersedia.
3. Bandingkan kondisi repository dengan Phase 0 pada roadmap.
4. Buat daftar langkah implementasi Phase 0 yang konkret dan berurutan.
5. Identifikasi keputusan teknis yang masih perlu diuji, terutama pemilihan library HEIC/HEIF, TIFF, GIF, BMP, serta dukungan browser.
6. Jangan langsung membuat seluruh aplikasi atau melompat ke conversion engine.
7. Jangan mengubah kesepakatan arsitektur tanpa menjelaskan alasan dan meminta persetujuan saya jika perubahan tersebut berdampak besar.

## Batasan penting

- Gunakan Vanilla JavaScript, HTML5, CSS3, dan Vite.
- Semua pemrosesan gambar harus berlangsung lokal di browser.
- Tidak menggunakan backend, database, cloud storage, atau remote image-conversion API.
- Gunakan pendekatan modular.
- Gunakan Web Workers untuk pekerjaan berat yang sesuai, dengan fallback.
- Sediakan light mode dan dark mode.
- Kembangkan secara bertahap sesuai roadmap.
- Jangan mengklaim fitur sudah berfungsi sebelum diuji dengan file gambar nyata.

Mulai dengan memberikan:
- Ringkasan pemahaman proyek.
- Pemeriksaan kondisi repository (jika akses tersedia).
- Checklist Phase 0.
- Struktur folder final yang disarankan untuk tahap awal.
- Perintah terminal untuk menginisialisasi proyek.
- Daftar keputusan yang masih perlu dikonfirmasi.

Setelah itu, tunggu persetujuan saya sebelum melakukan perubahan besar atau melanjutkan ke implementasi berikutnya.

## Multi-developer task assignment

Before starting implementation, identify which GitHub account the current developer uses. The team assignments are:

| GitHub username | Phase 5 | Phase 6 |
|---|---|---|
| `andra-gs` | Image Transformation | Image Optimization |
| `Adit1945-web` | Image Adjustment | Metadata Management |
| `FarrelPtrv` | Editor UI and Integration | Export Presets and UI |

Read `docs/DEVELOPMENT_ROADMAP.md`, `docs/PROJECT_CONTEXT.md`, `docs/TECHNICAL_SPECIFICATION.md`, and `docs/CHATGPT_PROJECT_INSTRUCTIONS.md` before implementation. Work only on the identified developer's assigned module. If the GitHub username is unknown, ask for it instead of guessing. Use the assigned feature branch, coordinate shared API contracts before coding, submit a Pull Request to `main`, and follow the merge order in the Development Roadmap.

The detailed task lists, expected behavior, primary files, tests, completion criteria, branch names, and integration requirements are defined in `docs/DEVELOPMENT_ROADMAP.md`. These assignments are planning decisions; do not describe them as implemented features or already-created branches.
