import React, { useEffect, useMemo, useState } from 'react';
import { Button, FlatList, Platform, SafeAreaView, Text, View } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';

interface MeetingEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarId: string;
}

export default function MeetingsScreen() {
  const [permission, setPermission] = useState<Calendar.PermissionResponse | null>(null);
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const perm = await Calendar.requestCalendarPermissionsAsync();
      setPermission(perm);
      if (perm.status === 'granted') {
        void loadUpcoming();
      }
    })();
  }, []);

  const now = useMemo(() => new Date(), []);

  const loadUpcoming = async () => {
    try {
      setLoading(true);
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (!cals.length) return;
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const allEvents = await Calendar.getEventsAsync(cals.map(c => c.id), start, end);
      const mapped: MeetingEvent[] = allEvents
        .filter(e => e.availability !== 'free')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .map(e => ({ id: e.id, title: e.title || 'Untitled', startDate: new Date(e.startDate), endDate: new Date(e.endDate), calendarId: e.calendarId }));
      setEvents(mapped);
    } finally {
      setLoading(false);
    }
  };

  const currentMeeting = useMemo(() => {
    return events.find(e => now >= e.startDate && now <= e.endDate);
  }, [events, now]);

  if (!Device.isDevice) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Calendar access requires a real device.</Text>
      </SafeAreaView>
    );
  }

  if (!permission || permission.status !== 'granted') {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>Appen behöver tillgång till kalendern för att hitta möten.</Text>
        <Button title="Begär behörighet" onPress={async () => setPermission(await Calendar.requestCalendarPermissionsAsync())} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.select({ ios: 0, android: 24, default: 0 }) }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Möten</Text>
        {currentMeeting ? (
          <View style={{ marginTop: 8 }}>
            <Text>Pågående: {currentMeeting.title}</Text>
            <Button title="Spela in detta möte" onPress={() => router.push({ pathname: './record', params: { eventId: currentMeeting.id, title: currentMeeting.title, start: currentMeeting.startDate.toISOString(), end: currentMeeting.endDate.toISOString() } })} />
          </View>
        ) : (
          <Text style={{ marginTop: 8 }}>Inget pågående möte just nu.</Text>
        )}
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadUpcoming}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' }}>
            <Text style={{ fontWeight: '500' }}>{item.title}</Text>
            <Text style={{ color: '#666', marginVertical: 6 }}>{item.startDate.toLocaleString()} - {item.endDate.toLocaleString()}</Text>
            <Button title="Spela in" onPress={() => router.push({ pathname: './record', params: { eventId: item.id, title: item.title, start: item.startDate.toISOString(), end: item.endDate.toISOString() } })} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
