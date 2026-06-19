# Coding Rules — TypeScript

Rules wajib diikuti di setiap perubahan kode. Tidak ada pengecualian.

---

## 1. Prinsip Dasar

- Tulis kode seperti manusia berpengalaman yang menulis untuk rekan satu tim — bukan untuk membuktikan kecerdasan.
- Jika ada solusi sederhana dan solusi kompleks yang menghasilkan output sama, **selalu pilih yang sederhana**.
- Kode yang dihapus lebih baik daripada kode yang dikomentari. Jangan tinggalkan kode mati.
- Satu file, satu tanggung jawab. Satu fungsi, satu tujuan.

---

## 2. Komentar — Aturan Utama

Komentar wajib ada jika ada **syntax atau logika yang tidak langsung jelas**. Tujuannya agar kode bisa dibaca sambil belajar.

**Komentar yang bagus** menjelaskan *apa yang dilakukan operator/pattern ini* atau *mengapa logika ini dipilih* — bukan hanya mengulang nama fungsinya.

```ts
// ❌ Terlalu obvious — nama fungsinya sudah cukup jelas
// Get user by ID
const user = await getUser(id)

// ✅ Menjelaskan operator yang mungkin asing
// ?? (nullish coalescing) — pakai nilai kanan hanya jika kiri null atau undefined
const user = await getUser(id) ?? createGuestSession()

// ✅ Menjelaskan kenapa pattern ini dipilih
// flatMap = map lalu flat(1) sekaligus — hindari nested array [[...],[...]]
const orders = users.flatMap(u => u.orders)

// ✅ Menjelaskan logika bisnis yang tidak obvious
// Token expired dihitung dari issued_at + 7 hari, bukan dari server time
const isExpired = Date.now() > token.issuedAt + 7 * 24 * 60 * 60 * 1000
```

**Aturan ringkas:**
- Komentar 1 baris per blok logika — tidak perlu setiap baris.
- Jika 1 file penuh komentar di mana-mana, berarti kodenya yang perlu disederhanakan.
- Tidak ada komentar `// TODO` atau `// FIXME` yang ditinggalkan — selesaikan atau buat issue.

---

## 3. TypeScript — Typing

### Gunakan `type` untuk shape data, `interface` untuk kontrak objek/class

```ts
// type — untuk union, alias, atau komposisi
type Status = 'active' | 'inactive' | 'pending'
type UserId = string

// interface — untuk struktur objek yang mungkin di-extend
interface User {
  id: UserId
  name: string
  status: Status
}
```

### Jangan tulis tipe yang bisa di-infer TypeScript

```ts
// ❌ Redundant — TS sudah tahu ini string
const name: string = 'Budi'
const users: User[] = await fetchUsers()

// ✅ Biarkan TS infer sendiri
const name = 'Budi'
const users = await fetchUsers()  // return type sudah ada di fetchUsers
```

### Jangan pakai `any` — gunakan `unknown` jika tipenya benar-benar tidak diketahui

```ts
// ❌ any mematikan type checking sepenuhnya
function parse(data: any) { ... }

// ✅ unknown lebih aman — paksa kita validasi sebelum pakai
function parse(data: unknown) {
  if (typeof data !== 'object' || data === null) return null
  // ...
}
```

### Gunakan `Record`, `Partial`, `Pick` daripada mendefinisikan ulang

```ts
// Record<K, V> — object dengan key bertipe K dan value bertipe V
const cache: Record<string, User> = {}

// Partial<T> — semua field jadi optional, berguna untuk update payload
async function updateUser(id: string, patch: Partial<User>) { ... }

// Pick<T, K> — ambil subset field dari type yang sudah ada
type UserPreview = Pick<User, 'id' | 'name'>
```

### Definisi tipe hanya di satu tempat

```ts
// ❌ Jangan definisikan ulang tipe yang sama di file berbeda
// user-card.tsx: interface User { id: string; name: string }
// user-list.tsx: interface User { id: string; name: string }  ← duplikat

// ✅ Taruh di types/, lalu import
import type { User } from '@/types/user'
```

---

## 4. Anti-Pattern AI (Larangan Keras)

### Naming Terlalu Verbose

```ts
// ❌ Jangan
const fetchAndProcessUserDataFromDatabase = async (): Promise<User[]> => {}
const isUserAuthenticationTokenValidAndNotExpired: boolean = true

// ✅ Boleh
const fetchUsers = async (): Promise<User[]> => {}
const isTokenValid = true
```

### Destructuring Tidak Perlu

```ts
// ❌ Alias yang tidak menambah kejelasan
const { data: responseData } = await fetchUser()
const { id: userId, name: userName } = responseData

// ✅ Langsung pakai
const user = await fetchUser()
```

### Guard Clause Berlapis

```ts
// ❌ Jangan — TS sudah punya optional chaining
if (data !== null && data !== undefined && data.items !== undefined && data.items.length > 0) { ... }

// ✅ Optional chaining (?.) — aman diakses meski nilai di tengah undefined/null
if (data?.items?.length) { ... }
```

### Abstraksi Prematur

```ts
// ❌ Wrapper yang hanya dipakai sekali tidak perlu ada
const createUserProcessor = (config: Config) => (user: User) => processUser(user, config)

// ✅ Langsung
processUser(user, config)
```

### Error Handling Generik

```ts
// ❌ Pesan error tidak actionable
} catch (error) {
  console.error('An error occurred while processing the request:', error)
}

// ✅ Spesifik — tahu dari mana error berasal
} catch (err) {
  // instanceof untuk narrow type error agar bisa akses .message
  throw new Error(`fetchUser failed: ${err instanceof Error ? err.message : String(err)}`)
}
```

---

## 5. DRY — No Duplication

- **Tiga kali = abstraksi.** Jika logika yang sama muncul tiga kali, buat fungsi/helper.
- Konstanta yang dipakai lebih dari sekali harus ada di satu file.
- Tipe yang sama tidak boleh didefinisikan ulang — import dari `types/`.

```ts
// ❌ Logika format tanggal tersebar di 3 file
const date = new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })

// ✅ Satu tempat — utils/date.ts
export const formatDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
```

- URL, API key, limit angka — tidak boleh hardcode di lebih dari satu tempat. Gunakan `constants/` atau `.env`.

---

## 6. Struktur File & Folder

```
src/
  components/     # UI components — satu file per komponen
  features/       # Logika bisnis per fitur
  utils/          # Pure functions tanpa side effect
  hooks/          # Custom React hooks
  types/          # Semua type & interface terpusat
  constants/      # Nilai konstan global (bukan env)
  api/            # Semua fetch/HTTP calls
```

- Nama file: `kebab-case.ts` untuk module/utils, `PascalCase.tsx` untuk komponen React.
- Nama folder: selalu `kebab-case`.
- Jangan buat folder `helpers`, `misc`, atau `common` — terlalu ambigu, masukkan ke folder yang tepat.
- `index.ts` hanya boleh berisi re-export — tidak ada logika di dalamnya.

---

## 7. Naming Convention

| Konteks | Format | Contoh |
|---|---|---|
| Variable / parameter | camelCase | `userList`, `isLoading` |
| Fungsi | camelCase, awali verb | `getUser`, `formatDate` |
| Konstanta global | SCREAMING_SNAKE | `MAX_RETRIES`, `BASE_URL` |
| Type / Interface | PascalCase | `UserProfile`, `ApiResponse` |
| Komponen React | PascalCase | `UserCard`, `NavBar` |
| CSS class | kebab-case | `user-card`, `nav-bar` |
| Boolean | prefix `is`, `has`, `can` | `isActive`, `hasError` |
| Generic type param | huruf kapital pendek | `T`, `K`, `TData` |

- Jangan singkat nama tanpa alasan: `usr`, `tmp`, `fn` — tidak boleh. Index loop `i`, `j` masih oke.
- Jangan encode tipe ke nama: `userArray`, `nameString` — TypeScript sudah handle ini.

---

## 8. Fungsi

- Maksimal **20 baris** per fungsi. Lebih dari itu, pecah jadi subfungsi.
- Maksimal **3 parameter**. Lebih dari itu, gunakan objek dengan tipe.
- Tidak ada side effect tersembunyi — fungsi `get*` tidak boleh mengubah state.

```ts
// ❌ Terlalu banyak tanggung jawab dalam satu fungsi
async function handleUserSubmit(form: FormData, db: DB, cache: Cache, logger: Logger) {
  // validate + save + clear cache + log — semua campur
}

// ✅ Satu fungsi, satu hal — mudah di-test satu per satu
async function submitUser(form: FormData) {
  const validated = validateUserForm(form)
  await saveUser(validated)
  await invalidateUserCache(validated.id)
}
```

---

## 9. Readability

### Early Return — Jangan Nest Dalam-Dalam

```ts
// ❌ Logic utama terkubur di dalam 3 level if
function processOrder(order: Order | null) {
  if (order) {
    if (order.items.length > 0) {
      if (order.isPaid) {
        // logic utama di level 3 — susah dibaca
      }
    }
  }
}

// ✅ Early return — tolak kondisi buruk duluan, logic utama di atas
function processOrder(order: Order | null) {
  if (!order) return
  if (!order.items.length) return
  if (!order.isPaid) return
  // logic utama di level 0
}
```

### Jangan Chain Lebih dari 3 Method

```ts
// ❌ Satu baris panjang — susah di-debug kalau ada error
const result = data.users.filter(u => u.active).map(u => u.orders).flat().filter(o => o.paid)

// ✅ Simpan intermediate result — nama variable jadi dokumentasi
const activeUsers = data.users.filter(u => u.active)
// flatMap = map + flat(1) sekaligus — hasilnya array orders tanpa nested
const allOrders = activeUsers.flatMap(u => u.orders)
const paidOrders = allOrders.filter(o => o.paid)
```

### Spasi & Grupasi
- Satu baris kosong antara blok logika yang berbeda.
- Urutan import: builtin Node → library eksternal → alias internal (`@/`) → path relatif.
- Satu baris kosong setelah blok import.

---

## 10. Integritas Logika — Jangan Kejar "Tidak Error"

> **Prinsip:** Program yang crash dengan jelas lebih baik daripada program yang jalan tapi diam-diam salah.

AI sering mengambil jalan pintas demi membuat program tidak melempar error — tapi hasilnya: bug tersembunyi, data yang salah diproses, dan masalah yang makin sulit dilacak. Semua pola di bawah ini **dilarang keras**.

---

### 10.1 Jangan Swallow Error

Menangkap error lalu tidak melakukan apa-apa, atau mengembalikan nilai default secara diam-diam, adalah cara paling berbahaya menyembunyikan bug.

```ts
// ❌ Error ditelan — caller tidak tahu ada yang salah
async function getUser(id: string) {
  try {
    return await fetchUser(id)
  } catch {
    return null  // null ini artinya apa? not found? server error? network down?
  }
}

// ✅ Biarkan error naik, atau lempar ulang dengan konteks yang jelas
async function getUser(id: string) {
  // error dari fetchUser dibiarkan naik ke caller — caller yang memutuskan cara handle-nya
  return await fetchUser(id)
}

// ✅ Kalau memang perlu catch, lempar ulang dengan informasi yang lebih kaya
async function getUser(id: string) {
  try {
    return await fetchUser(id)
  } catch (err) {
    // wrap error agar stack trace tetap ada tapi konteks bertambah
    throw new Error(`getUser(${id}) failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
```

---

### 10.2 Jangan Bypass TypeScript

TS memberikan error karena ada yang memang tidak aman. Mem-bypass TS bukan solusi — itu menunda kerusakan.

```ts
// ❌ as — memaksa tipe tanpa validasi apapun, sama sekali tidak aman
const user = response.data as User

// ❌ ! (non-null assertion) — "percaya sama saya ini pasti ada" tanpa bukti
const name = user!.profile!.name

// ❌ @ts-ignore / @ts-expect-error — mematikan type checker untuk baris itu
// @ts-ignore
user.methodThatDoesNotExist()

// ❌ any — mematikan type checking sepenuhnya
function process(data: any) { ... }

// ✅ Validasi dulu, baru akses — type guard membuat TS yakin
function isUser(data: unknown): data is User {
  // typeof dan 'in' adalah cara TS memverifikasi struktur object secara runtime
  return typeof data === 'object' && data !== null && 'id' in data && 'name' in data
}

const raw = await response.json()
if (!isUser(raw)) throw new Error('Response bukan User yang valid')
const user = raw  // TS sudah tahu ini User di sini
```

---

### 10.3 Jangan Pakai Fallback untuk Data yang Seharusnya Ada

Fallback `?? []` atau `|| 0` boleh dipakai **hanya jika data memang opsional secara desain**. Jika data itu *harus* ada, fallback menyembunyikan bahwa pipeline data-mu patah.

```ts
// ❌ Kenapa items bisa undefined? Ini seharusnya selalu ada dari API
const items = response.items ?? []
// sekarang items = [] padahal API harusnya return data — bug tersembunyi

// ❌ Kenapa userId bisa undefined di titik ini?
const id = user?.id ?? 'unknown'
// 'unknown' diteruskan ke query database — hasilnya pasti salah

// ✅ Tanya "kenapa ini bisa undefined?" — kalau tidak boleh undefined, validasi di atas
if (!response.items) throw new Error('API tidak mengembalikan items — cek kontrak API')
const items = response.items

// ✅ Kalau memang opsional secara desain, dokumentasikan kenapa
// user.displayName opsional — user boleh tidak set nama tampilan
const label = user.displayName ?? user.email
```

**Aturan praktis:** Sebelum menulis `?? sesuatu`, tanya dulu — *"apakah ini memang boleh tidak ada?"* Kalau jawabannya tidak, jangan pakai fallback, throw error.

---

### 10.4 Jangan Silent Skip

`if (x) doThing()` tanpa `else` atau `throw` artinya: kalau `x` tidak ada, program lanjut seolah tidak terjadi apa-apa. Ini sama berbahayanya dengan swallow error.

```ts
// ❌ Kalau user tidak ada, fungsi selesai tanpa melakukan apa-apa
// tidak ada error, tidak ada log, tidak ada tanda — caller tidak tahu
function sendWelcomeEmail(user?: User) {
  if (user) {
    emailService.send(user.email, 'Welcome!')
  }
}

// ✅ Kalau user harus ada, lempar error — jangan diam
function sendWelcomeEmail(user: User) {
  // handle ketidakhadiran user di layer atas (caller), bukan di sini
  emailService.send(user.email, 'Welcome!')
}

// ✅ Kalau kondisi gagal memang perlu diketahui, log atau throw secara eksplisit
function applyDiscount(cart: Cart, coupon?: Coupon) {
  if (!coupon) {
    // eksplisit — caller tahu tidak ada kupon yang diaplikasikan
    return cart
  }
  return applyCode(cart, coupon.code)
}
```

---

### 10.5 Fix Root Cause, Bukan Symptom

Saat ada error `Cannot read properties of undefined`, solusinya bukan menambah `?.` — solusinya adalah mencari **mengapa data itu bisa undefined di titik tersebut**.

```ts
// Skenario: error "Cannot read properties of undefined (reading 'name')"
// pada baris: const name = order.customer.name

// ❌ Patch symptom — error hilang tapi masalah sesungguhnya tidak terselesaikan
const name = order?.customer?.name ?? 'Unknown'

// ✅ Investigasi dulu
// Pertanyaan yang harus dijawab:
// 1. Apakah customer memang bisa null secara desain? (misal: guest checkout)
// 2. Atau apakah ada bug di query database yang tidak join tabel customer?
// 3. Atau apakah ada race condition di mana order diakses sebelum customer di-load?

// Kalau customer boleh null (guest checkout) → tipenya harus mencerminkan itu
interface Order {
  customer: Customer | null  // eksplisit di tipe, bukan disembunyikan
}
// lalu handle null secara bermakna:
const name = order.customer ? order.customer.name : 'Guest'

// Kalau customer seharusnya selalu ada → validasi di layer data fetching
const order = await getOrder(id)
if (!order.customer) throw new Error(`Order ${id} tidak memiliki customer — data korup`)
```

---

### 10.6 Error Harus Punya Konteks yang Cukup

Error message adalah dokumentasi runtime. Tulis seolah kamu yang akan men-debug ini jam 2 pagi.

```ts
// ❌ Tidak membantu sama sekali
throw new Error('Invalid data')
throw new Error('Something went wrong')
throw new Error('Error')

// ✅ Cukup konteks untuk tahu di mana, apa, dan kenapa
throw new Error(`createOrder: userId "${userId}" tidak ditemukan di database`)
throw new Error(`parseConfig: field "apiUrl" wajib ada tapi tidak ditemukan di config.json`)
throw new Error(`uploadFile: ukuran file ${fileSizeKb}KB melebihi batas ${MAX_FILE_SIZE_KB}KB`)
```

---

## 11. Aturan Perubahan Kode

1. **Jangan ubah yang tidak diminta** — refactor di luar scope task = tidak dilakukan.
2. **Cek duplikasi dulu** — sebelum buat fungsi baru, cari apakah sudah ada di `utils/`.
3. **Hapus kode lama** — jika mengganti implementasi, hapus yang lama. Jangan tinggalkan commented-out code.
4. **Jangan tambah dependency baru** tanpa persetujuan eksplisit.
5. **Jangan buat file baru** jika logika bisa masuk ke file yang sudah ada secara natural.
6. **Tidak ada `console.log`** yang tertinggal — gunakan logger yang proper atau hapus.

---

## 12. Batas Ukuran

| Item | Batas |
|---|---|
| Baris per file | ≤ 300 baris |
| Baris per fungsi | ≤ 20 baris |
| Parameter per fungsi | ≤ 3 |
| Nesting level | ≤ 3 level |
| Panjang satu baris | ≤ 100 karakter |

Jika melebihi batas, refactor — bukan tambah exception.

---

## 13. Yang Tidak Boleh Dilakukan AI

**Scope & perubahan:**
- Jangan tambahkan fitur yang tidak diminta.
- Jangan ganti library yang sudah ada tanpa alasan eksplisit.
- Jangan tulis ulang file yang tidak relevan dengan task.

**TypeScript:**
- Jangan annotate tipe di setiap baris jika TS sudah bisa infer sendiri.
- Jangan definisikan `interface` dan `type` untuk hal yang sama di file berbeda.
- Jangan gunakan `as`, `!`, `any`, atau `@ts-ignore` untuk menghilangkan TS error — perbaiki akar masalahnya.

**Error & logika:**
- Jangan tambahkan `try/catch` di setiap fungsi — handle error hanya di layer yang tepat.
- Jangan swallow error dengan `catch` yang return `null` atau nilai default secara diam-diam.
- Jangan tambahkan `?? []`, `?? 0`, `?? ''` pada data yang seharusnya selalu ada — cari tahu kenapa bisa undefined.
- Jangan patch symptom (tambah `?.` atau fallback) sebelum menginvestigasi root cause.
- Jangan buat kondisi `if (x)` tanpa `else` atau `throw` jika absennya `x` adalah kondisi yang perlu ditangani.
- Jangan tulis error message yang generik — selalu sertakan konteks: fungsi apa, nilai apa, kenapa salah.

**Komentar & gaya:**
- Jangan tambahkan komentar di setiap baris — hanya di bagian yang logika atau syntaxnya tidak obvious.
- Jangan generate kode "defensive" berlebihan (null check berlapis, fallback yang tidak perlu).
