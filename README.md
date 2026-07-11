# GS RERP — WMS va Logistika boshqaruv tizimi

Xitoy (Yiwu, Guangzhou) ↔ O'zbekiston (Toshkent) yo'nalishida yuk konsolidatsiya va tashish biznesi uchun ombor (WMS) va logistika boshqaruv veb-ilovasi.

## Stack

- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma ORM
- Auth.js (NextAuth v5), rolga asoslangan kirish
- Tailwind CSS

## Rollar

- **admin** — barcha bo'limlarga kirish, foydalanuvchi va joylashuvlarni boshqarish
- **warehouse** — kirim (intake), stock, Excel import
- **logistics** — mashina/konteyner, yuklash workspace, yetkazib berish solishtiruvi
- **accounting** — xarajatlar, hisobotlar, yetkazib berish solishtiruvi

## Lokal ishga tushirish

1. Bog'liqliklarni o'rnatish:
   ```bash
   npm install
   ```
2. `.env.example`dan `.env` yarating va `DATABASE_URL`, `AUTH_SECRET`ni to'ldiring:
   ```bash
   cp .env.example .env
   ```
3. PostgreSQL ma'lumotlar bazasini yarating (agar mavjud bo'lmasa), so'ng migratsiyalarni ishga tushiring:
   ```bash
   npm run db:migrate
   ```
4. Boshlang'ich ma'lumotlarni (admin foydalanuvchi + joylashuvlar: Yiwu, Guangzhou, Qashqar/Ulug'chat, Andijon, Toshkent) yuklash:
   ```bash
   npm run db:seed
   ```
   Standart admin login: `admin@gsrerp.local` / parol: `admin123` (yoki `.env`dagi `SEED_ADMIN_PASSWORD`).
5. Dev serverni ishga tushirish:
   ```bash
   npm run dev
   ```

## Asosiy oqim

1. **Mijozlar** — mijoz shipping-mark kodini (masalan `GS370`) yaratish
2. **Kirim (Ombor)** — tovar qabul qilish: o'lcham, og'irlik, qadoqlash turi (hajm avtomatik hisoblanadi)
3. **Yuklash** — mashina/konteyner uchun yuklash hodisasi ochish, omordagi partiyalardan qisman/to'liq miqdor ajratish (bo'lib yuklash tarixi audit sifatida saqlanadi), xarajat va yo'l bosqichlarini qo'shish
4. **Yetkazib berish (Места)** — yakuniy joy-soni solishtiruvi
5. **Hisobotlar** — mijoz bo'yicha kirim/yuklangan/qolgan/yetkazilgan ko'rinishi
6. **Excel import** — mavjud tarixiy 装车清单/库存清单 fayllarni yuklash (ustunlar avtomatik aniqlanadi)

## Foydali buyruqlar

```bash
npm run lint        # ESLint
npm run build        # production build
npm run db:studio    # Prisma Studio (ma'lumotlar bazasini ko'rish)
```

## Deploy

Tavsiya etilgan: Vercel (ilova) + Neon yoki boshqa managed PostgreSQL. `DATABASE_URL` va `AUTH_SECRET` environment variable sifatida sozlanishi kerak.

## Keyingi bosqich

Client-portal (mijozlar o'z yukini kuzatishi uchun) — ichki tizim barqaror ishlagandan keyin qo'shiladi. `Client.portalUserId` maydoni shu maqsad uchun tayyorlab qo'yilgan.
