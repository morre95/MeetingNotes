import { Stack } from "expo-router";

export default function RootLayout() {
    return <Stack
        screenOptions={{
            headerStyle: {
                backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}>
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="meetings" options={{}} />
        <Stack.Screen name="record" options={{}} />
        <Stack.Screen name="notes" options={{}} />
        <Stack.Screen name="recordings" options={{ title: 'Inspelningar' }} />
    </Stack>;
}
