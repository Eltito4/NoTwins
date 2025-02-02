import { AddItemModal } from './AddItemModal';

// Replace the DressScrapingModal usage with AddItemModal
{showScrapingModal && (
  <AddItemModal
    onClose={() => setShowScrapingModal(false)}
    onSubmit={handleAddDress}
    isEventCreator={isEventCreator}
  />
)}