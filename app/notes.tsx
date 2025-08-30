import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function NotesScreen() {
    const { dataPath } = useLocalSearchParams<{ dataPath: string }>();
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

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
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
