import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import MoodPage from '../screens/home/MoodPage';
import CardsPage from '../screens/home/CardsPage';
import CyclePage from '../screens/home/CyclePage';
import BodyPage from '../screens/home/BodyPage';
import LovePage from '../screens/home/LovePage';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        headerTintColor: colors.primary,
        headerTitleAlign: 'center',
        headerBackTitle: 'Home',
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MoodPage" component={MoodPage} options={{ title: 'Mood & streak' }} />
      <Stack.Screen name="CardsPage" component={CardsPage} options={{ title: 'Did you know?' }} />
      <Stack.Screen name="CyclePage" component={CyclePage} options={{ title: 'Your cycle' }} />
      <Stack.Screen name="BodyPage" component={BodyPage} options={{ title: 'Your body today' }} />
      <Stack.Screen name="LovePage" component={LovePage} options={{ title: 'Love & intimacy' }} />
    </Stack.Navigator>
  );
}
