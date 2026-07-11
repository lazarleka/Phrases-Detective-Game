# Phrases Detective Mobile

Ovo je Capacitor Android verzija aplikacije.

## Prvi put

1. Instaliraj Android Studio.
2. U Android Studio instaliraj Android SDK i napravi emulator ili povezi telefon.
3. U ovom folderu instaliraj pakete:

```bash
npm install
```

4. Ako Android folder ne postoji, napravi ga:

```bash
npx cap add android
```

5. Kopiraj primjer env fajla:

```bash
copy .env.example .env
```

Telefon ne moze koristiti `http://localhost:8081/api`, jer je `localhost` tada sam telefon.

Za Android emulator koristi:

```env
VITE_API_URL=http://10.0.2.2:8081/api
```

Ako testiras na pravom telefonu, stavi IP adresu racunara, npr:

```env
VITE_API_URL=http://192.168.1.20:8081/api
```

Telefon i racunar moraju biti na istoj Wi-Fi mrezi.

## Pokretanje

Backend pokreni u folderu `backend`.

Zatim u ovom folderu:

```bash
npm run mobile:build
npm run mobile:open
```

`mobile:open` otvara Android Studio. U Android Studio izaberi emulator ili telefon i klikni Run.

Moze i direktno iz terminala:

```bash
npm run mobile:run
```

## Poslije izmjena koda

Svaki put kad mijenjas React kod:

```bash
npm run mobile:build
```

Ako je Android Studio vec otvoren, nakon toga samo ponovo pokreni aplikaciju iz Android Studija.

## Korisne komande

```bash
npm run build
npm run mobile:sync
npm run mobile:open
npm run mobile:run
```

## Mobilne notifikacije bez Firebase-a

Aplikacija koristi Capacitor Local Notifications i Android foreground service koji provjerava backend svakih 10 sekundi dok si ulogovan.

Android prikazuje tihu stalnu servisnu notifikaciju sa nazivom aplikacije; to je potrebno da sistem ne uspava provjeru u pozadini.

Notifikacije se prikazuju za:

- novi zahtjev za prijateljstvo
- novi Versus poziv

Firebase nije potreban:

- nema `google-services.json`
- nema Firebase projekta
- nema FCM server key-a
- backend ne salje push na Google/Firebase API

Ako zelis privremeno ugasiti notifikacije, u `.env` dodaj:

```env
VITE_ENABLE_PUSH=false
```

Poslije izmjene dependency-ja ili Capacitor plugina ponovo build/sync Android aplikaciju:

```bash
npm run mobile:build
```

Napomena: bez Firebase-a nema pravog server push-a koji budi potpuno ugasenu aplikaciju. Ova verzija je napravljena da kasni mnogo manje dok Android foreground service radi.
