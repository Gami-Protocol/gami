import { Tabs } from 'expo-router';
import { CircleUser, Home, Sparkles, Target } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function AppTabLayout() {
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar StatusBar accepts a string style prop, not a style object */}
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: '#0E0E12' },
          tabBarStyle: {
            backgroundColor: '#16161E',
            borderTopColor: '#2A2A38',
            borderTopWidth: 1,
            height: 88,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#B14BFF',
          tabBarInactiveTintColor: '#6B6880',
          tabBarLabelStyle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color }) => <Home color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: 'QUESTS',
            tabBarIcon: ({ color }) => <Target color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="nova"
          options={{
            title: 'NOVA',
            tabBarIcon: () => (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#6E3CFB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -4,
                }}
              >
                <Sparkles color="#fff" size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'PROFILE',
            tabBarIcon: ({ color }) => <CircleUser color={color} size={22} />,
          }}
        />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="send" options={{ href: null }} />
        <Tabs.Screen name="receive" options={{ href: null }} />
        <Tabs.Screen name="badges" options={{ href: null }} />
        <Tabs.Screen name="scan" options={{ href: null }} />
      </Tabs>
    </>
  );
}
