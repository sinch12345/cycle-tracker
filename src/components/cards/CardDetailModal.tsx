import { Modal } from 'react-native';
import { Card } from '../../content/cards';
import CardDetailView from './CardDetailView';

export default function CardDetailModal({ card, onClose }: { card: Card | null; onClose: () => void }) {
  return (
    <Modal visible={!!card} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {card ? <CardDetailView card={card} onBack={onClose} backLabel="Close" /> : null}
    </Modal>
  );
}
