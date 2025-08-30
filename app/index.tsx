import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Meeting Notes</Text>
      <Text style={{ marginTop: 8, textAlign: 'center' }}>Spela in möten från din kalender och få transkript och sammanfattningar med AI.</Text>
      <View style={{ height: 16 }} />
      <Link href="./meetings" style={{ color: '#1e90ff', fontSize: 18 }}>Gå till möten</Link>
    </SafeAreaView>
  );
}
