import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import LogScreen from '../screens/LogScreen';
import AuraScreen from '../screens/AuraScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const icons: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Home: { on: 'heart', off: 'heart-outline' },
  Calendar: { on: 'calendar', off: 'calendar-outline' },
  Log: { on: 'create', off: 'create-outline' },
  Aura: { on: 'sparkles', off: 'sparkles-outline' },
  Insights: { on: 'stats-chart', off: 'stats-chart-outline' },
  Settings: { on: 'settings', off: 'settings-outline' },
};

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text, fontWeight: '800' },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? icons[route.name].on : icons[route.name].off}
              size={size}
              color={color}
            />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Log" component={LogScreen} />
        <Tab.Screen
          name="Aura"
          component={AuraScreen}
          options={{ headerShown: false, tabBarHideOnKeyboard: true }}
        />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

