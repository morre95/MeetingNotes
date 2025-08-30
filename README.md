# MeetingNotes – Mötesinspelning med AI-transkribering och sammanfattning

En Expo/React Native-app som:
- listar kommande möten från din kalender,
- kan spela in möten utan kalenderhändelse (ad-hoc),
- spelar in ljud under mötet,
- skickar ljudet till AI för transkribering,
- och genererar mötesanteckningar och sammanfattning.

## Krav och valda tjänster
- Kalender: expo-calendar
- Inspelning: expo-audio
- Lagring: expo-file-system
- E-post: expo-mail-composer
- AI:
  - Transkribering: OpenAI gpt-4o-mini-transcribe (audio/transcriptions)
  - Sammanfattning: OpenAI gpt-4o-mini (chat/completions)

Du kan byta leverantör i `lib/aiService.ts` om du föredrar t.ex. AssemblyAI.

## Kom igång
1. Klona branch och installera beroenden
   ```bash
   git clone https://github.com/morre95/MeetingNotes.git
   ```
    ```bash
   npm install
   ```
2. Konfigurera API-nyckel
   - Sätt OpenAI nyckeln till `EXPO_PUBLIC_OPENAI_API_KEY` i expo EAS portalen.
   - Om du vil köra appen lokalt kör `eas env:pull --environment development` i konsolen
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
- Inspelade Möten (/records): visar inspelade möten.

## Felsökning
- Om transkribering/sammanfattning misslyckas: kontrollera att `EXPO_PUBLIC_OPENAI_API_KEY` är korrekt.
- På simulatorer kan kalenderåtkomst/inspelning vara begränsad; testa helst på fysisk enhet.
