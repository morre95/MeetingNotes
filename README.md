# MeetingNotes – Mötesinspelning med AI-transkribering och sammanfattning

En Expo/React Native-app som:
- listar kommande möten från din kalender,
- spelar in ljud under mötet,
- skickar ljudet till AI för transkribering,
- och genererar mötesanteckningar och sammanfattning.

## Krav och valda tjänster
- Kalender: expo-calendar
- Inspelning: expo-audio
- Lagring: expo-file-system
- AI:
  - Transkribering: OpenAI Whisper (v1/audio/transcriptions)
  - Sammanfattning: OpenAI GPT-4o-mini (chat/completions)

Du kan byta leverantör i `lib/aiService.ts` om du föredrar t.ex. AssemblyAI.

## Kom igång
1. Installera beroenden
   ```bash
   npm install
   ```
2. Konfigurera API-nyckel
   - Öppna `app.json` och sätt `expo.extra.OPENAI_API_KEY` till din nyckel.
3. Starta appen
   ```bash
   npx expo start
   ```

## Behörigheter
Appen begär tillgång till kalendern (för att läsa möten) och mikrofon (för inspelning). iOS kräver InfoPlist-nycklar; Android kräver motsvarande tillstånd. Dessa är redan tillagda i `app.json`.

## Flöde i appen
- Start (/) -> "Gå till möten"
- Möten (/meetings): listar kommande event och visar pågående möte om något pågår. Tryck "Spela in".
- Inspelning (/record): starta/stoppa inspelning. När du stoppar skickas filen till AI.
- Anteckningar (/notes): visar transkript, sammanfattning och åtgärdspunkter.

## Felsökning
- Om transkribering/sammanfattning misslyckas: kontrollera att `OPENAI_API_KEY` är korrekt.
- På simulatorer kan kalenderåtkomst/inspelning vara begränsad; testa helst på fysisk enhet.
