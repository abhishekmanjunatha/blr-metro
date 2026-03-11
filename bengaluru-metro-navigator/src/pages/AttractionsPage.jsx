import { AttractionExplorer } from '../components/attractions';
import { useMetroData, useDocumentHead } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';

export default function AttractionsPage() {
  const { isLoading } = useMetroData();

  useDocumentHead({
    title: 'Attractions Near Bengaluru Metro Stations',
    description: 'Discover top tourist attractions, parks, temples, malls and restaurants near Bengaluru Namma Metro stations. Plan your visit with walking directions from the nearest station.',
    path: '/attractions',
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <AttractionExplorer />
    </div>
  );
}
