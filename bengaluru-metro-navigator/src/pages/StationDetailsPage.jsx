import { StationDetails } from '../components/stations';
import { useMetroData, useDocumentHead } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';
import { useParams } from 'react-router-dom';

export default function StationDetailsPage() {
  const { isLoading } = useMetroData();
  const { id } = useParams();
  const stationName = id ? id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  useDocumentHead({
    title: stationName ? `${stationName} Metro Station — Details, Facilities & Nearby` : 'Station Details',
    description: stationName ? `${stationName} Namma Metro station — view platform info, interchange details, nearby attractions, connecting bus routes and facilities.` : 'Bengaluru Metro station details and facilities.',
    path: `/stations/${id || ''}`,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <StationDetails />
    </div>
  );
}
