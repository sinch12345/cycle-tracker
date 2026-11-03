import { useCycleInfo } from '../../hooks/useCycleInfo';
import { Phase } from '../../utils/prediction';
import Page from '../../components/home/Page';
import DidYouKnow from '../../components/cards/DidYouKnow';

export default function CardsPage() {
  const { phase, showIntimacy, today } = useCycleInfo();
  return (
    <Page padded={false}>
      <DidYouKnow phase={(phase ?? 'follicular') as Phase} showLove={showIntimacy} today={today} />
    </Page>
  );
}
