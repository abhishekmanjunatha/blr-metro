import { StationList } from '../components/stations';
import { useMetroData, useDocumentHead } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';

export default function StationsPage() {
  const { isLoading } = useMetroData();

  useDocumentHead({
    title: 'All Bengaluru Metro Stations — Purple, Green & Yellow Lines',
    description: 'Browse all 83 Bengaluru Namma Metro stations across Purple, Green and Yellow lines. View station details, facilities, interchange info and nearby attractions.',
    path: '/stations',
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <StationList />
    </div>
  );
}
