import React, { useEffect, useState } from 'react';
import {Button, SafeAreaView, Text, View, Alert, TextInput, Pressable} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    useAudioRecorder,
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { transcribeAndSummarize } from '@/lib/aiService';
import {RecordingItem} from "@/types/common";

export default function RecordScreen() {
    const params = useLocalSearchParams<{ eventId: string; title: string }>();
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);
    const [uri, setUri] = useState<string | null>(null);
    const [status, setStatus] = useState('Redo att spela in');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(params.title || 'Möte');
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (!status.granted) {
                Alert.alert('Permission to access microphone was denied');
            }

            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });
        })();
    }, []);


    const startRecording = async () => {
        setStatus('Förbereder...');
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setStatus('Spelar in...');
    };

    const stopRecording = async () => {
        setStatus('Stoppar...');
        await audioRecorder.stop();
        const fileUri = recorderState.url;
        if (fileUri) {
            setUri(fileUri);
            setStatus('Transkriberar och sammanfattar...');
            try {
                const audioBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
                const result = await transcribeAndSummarize({ base64: audioBase64, filename: 'meeting.m4a', title: currentTitle });
                // Persist simple JSON locally next to the audio
                const outPath = fileUri.replace(/\.[^/.]+$/, '') + '.json';
                console.log('Writing to', outPath);
                await FileSystem.writeAsStringAsync(outPath, JSON.stringify(result, null, 2));

                if (params.eventId !== "") {
                    const item : RecordingItem = {
                        id: params.eventId,
                        title: currentTitle,
                    };

                    const itemPath = `${FileSystem.bundleDirectory}/assets/data/recordings.json`;
                    const data = JSON.parse(await FileSystem.readAsStringAsync(itemPath));
                    if (!data && data.items.length <= 0) data.items = [];
                    data.items.push(item);
                    await FileSystem.writeAsStringAsync(itemPath, JSON.stringify(data, null, 2));
                }

                setStatus('Klart!');
                router.push({ pathname: './notes', params: { dataPath: outPath } });
            } catch (e: any) {
                setStatus('Fel: ' + (e?.message || 'Okänt fel'));
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>

            <Pressable onPress={() => setIsEditingTitle(true)}>
                {isEditingTitle ? (
                    <TextInput
                        style={{fontSize: 18, fontWeight: '600', borderBottomWidth: 1, borderColor: '#ccc', padding: 4}}
                        value={currentTitle}
                        onChangeText={setCurrentTitle}
                        onBlur={() => setIsEditingTitle(false)}
                        autoFocus
                    />
                ) : (
                    <Text style={{fontSize: 18, fontWeight: '600'}}>{currentTitle}</Text>
                )}
            </Pressable>
            <Text style={{ marginTop: 8 }}>{status}</Text>
            <View style={{ height: 16 }} />
            {!recorderState.isRecording ? (
                <Button title="Starta inspelning" onPress={startRecording} />
            ) : (
                <Button title="Stoppa inspelning" onPress={stopRecording} color="#d00" />
            )}
            {uri ? <Text style={{ marginTop: 12, color: '#666' }}>Sparad: {uri}</Text> : null}
        </SafeAreaView>
    );
}
