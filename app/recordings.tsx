import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, Button, Platform, TextInput, Modal, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';

// Simple types for recordings and folders
export type RecordingMeta = {
  id: string;
  title: string;
  createdAt: string; // ISO string
  audioPath: string; // file URI
  dataPath: string; // json result path
  folder?: string; // folder name
};

export type Folder = {
  name: string;
  description?: string;
};

// We will persist a lightweight index file under FileSystem.documentDirectory
const INDEX_FILE = (FileSystem.documentDirectory || '') + 'recordings-index.json';

export default function RecordingsScreen() {
  const [items, setItems] = useState<RecordingMeta[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const router = useRouter();

  // Load index (if exists) and also attempt to discover orphan .json next to audio
  useEffect(() => {
    void loadIndex();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, RecordingMeta[]> = {};
    for (const it of items) {
      const key = it.folder || 'Osorterat';
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    // sort by createdAt desc within
    Object.values(map).forEach(arr => arr.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    // return as array of [folder, items]
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]));
  }, [items]);

  const loadIndex = async () => {
    try {
      setLoading(true);
      const exists = await FileSystem.getInfoAsync(INDEX_FILE);
      if (exists.exists) {
        const content = await FileSystem.readAsStringAsync(INDEX_FILE);
        const parsed = JSON.parse(content);
        setItems(parsed.items || []);
        setFolders(parsed.folders || []);
      } else {
        // initialize
        await saveIndex([], []);
      }
    } catch (e) {
      console.error('Error loading index', e);
    } finally {
      setLoading(false);
    }
  };

  const saveIndex = async (newItems: RecordingMeta[], newFolders: Folder[]) => {
    setItems(newItems);
    setFolders(newFolders);
    const payload = JSON.stringify({ items: newItems, folders: newFolders }, null, 2);
    await FileSystem.writeAsStringAsync(INDEX_FILE, payload);
  };

  const addFolder = async (name: string) => {
    if (!name.trim()) return;
    if (folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) return;
    const newList = [...folders, { name: name.trim() }];
    await saveIndex(items, newList);
  };

  const moveToFolder = async (recId: string, folderName?: string) => {
    const idx = items.findIndex(it => it.id === recId);
    if (idx === -1) return;
    const copy = items.slice();
    copy[idx] = { ...copy[idx], folder: folderName };
    await saveIndex(copy, folders);
  };

  const renderFolderBlock = (folderName: string, data: RecordingMeta[]) => (
    <View key={folderName} style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{folderName}</Text>
      {data.map(item => (
        <View key={item.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontWeight: '500' }}>{item.title}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Visa anteckningar" onPress={() => router.push({ pathname: './notes', params: { dataPath: item.dataPath } })} />
            <Button title="Flytta" onPress={() => setMoveTarget(item.id)} />
          </View>
        </View>
      ))}
    </View>
  );

  const [moveTarget, setMoveTarget] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.select({ ios: 0, android: 24, default: 0 }) }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Inspelade möten</Text>
        <Text style={{ color: '#666', marginTop: 6 }}>Organisera inspelningar i kataloger.</Text>
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          <Button title="Ny katalog" onPress={() => setShowNewFolder(true)} />
          <Button title="Uppdatera" onPress={loadIndex} disabled={loading} />
        </View>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={([name]) => name}
        renderItem={({ item: [name, recs] }) => renderFolderBlock(name, recs)}
      />

      <Modal visible={showNewFolder} transparent animationType="slide" onRequestClose={() => setShowNewFolder(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: 'white', padding: 16, width: '80%', borderRadius: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Skapa ny katalog</Text>
            <TextInput value={newFolderName} onChangeText={setNewFolderName} placeholder="Namn" style={{ borderWidth: 1, borderColor: '#ccc', marginTop: 8, padding: 8, borderRadius: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button title="Avbryt" onPress={() => { setShowNewFolder(false); setNewFolderName(''); }} />
              <Button title="Skapa" onPress={async () => { await addFolder(newFolderName); setShowNewFolder(false); setNewFolderName(''); }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!moveTarget} transparent animationType="fade" onRequestClose={() => setMoveTarget(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setMoveTarget(null)}>
          <View style={{ backgroundColor: 'white', width: '80%', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Flytta till katalog</Text>
            <FlatList
              data={[{ name: 'Osorterat' }, ...folders]}
              keyExtractor={(f) => f.name}
              renderItem={({ item }) => (
                <Pressable onPress={async () => { await moveToFolder(moveTarget!, item.name === 'Osorterat' ? undefined : item.name); setMoveTarget(null); }}>
                  <View style={{ paddingVertical: 12 }}>
                    <Text>{item.name}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
