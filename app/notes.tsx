import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';

export default function NotesScreen() {
    const { dataPath, send } = useLocalSearchParams<{ dataPath: string, send?: string }>();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        (async () => {
            if (dataPath) {
                try {
                    const content = await FileSystem.readAsStringAsync(String(dataPath));
                    setData(JSON.parse(content));
                } catch {
                    // ignore
                }
            }
        })();
    }, [dataPath]);

    useEffect(() => {
        if (send && data) {
            // auto open composer if navigated with send=1
            sendEmail().then();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [send, data]);

    const sendEmail = async () => {
        try {
            const available = await MailComposer.isAvailableAsync();
            if (!available) {
                Alert.alert('E-post ej tillgänglig', 'Ingen E-postklient är konfigurerad på enheten.');
                return;
            }
            const subject = `Mötesanteckningar${data?.title ? ': ' + data.title : ''}`;
            const bodyParts = [
                data?.summary ? `Sammanfattning:\n${data.summary}` : null,
                data?.action_items?.length ? `\n\nÅtgärdspunkter:\n- ${data.action_items.join('\n- ')}` : null,
                data?.transcript ? `\n\nTranskript:\n${data.transcript}` : null,
            ].filter(Boolean);
            const body = bodyParts.join('\n\n');
            await MailComposer.composeAsync({
                subject,
                body,
                attachments: dataPath ? [String(dataPath)] : undefined,
            });
        } catch (e: any) {
            Alert.alert('Fel vid e-post', e?.message || 'Okänt fel');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button title="Dela via e-post" onPress={sendEmail} />
            </View>
            <ScrollView>
                <Text style={{ fontSize: 20, fontWeight: '600' }}>Transkript</Text>
                <Text style={{ marginTop: 8, lineHeight: 20 }}>{data?.transcript || 'Ingen transkript tillgänglig.'}</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 16 }}>Sammanfattning</Text>
                <Text style={{ marginTop: 8, lineHeight: 20 }}>{data?.summary || 'Ingen sammanfattning tillgänglig.'}</Text>
                {data?.action_items?.length ? (
                    <>
                        <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 16 }}>Åtgärdspunkter</Text>
                        {data.action_items.map((it: string, idx: number) => (
                            <Text key={idx}>• {it}</Text>
                        ))}
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
