import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAppData } from '../../context/AppDataContext';
import { useCycleInfo } from '../../hooks/useCycleInfo';
import Page from '../../components/home/Page';
import IntimacySection from '../../components/home/IntimacySection';

export default function LovePage() {
  const { updateSettings } = useAppData();
  const { p, phase, chance } = useCycleInfo();
  const navigation = useNavigation<any>();

  if (!p.hasData || !phase) {
    return <Page><Text style={{ color: colors.muted }}>Log a period to see this.</Text></Page>;
  }

  return (
    <Page padded={false}>
      <IntimacySection
        phase={phase}
        chance={chance}
        onHide={() => {
          updateSettings({ showIntimacy: false });
          navigation.goBack();
        }}
        onAsk={() => navigation.navigate('Aura')}
      />
    </Page>
  );
}
