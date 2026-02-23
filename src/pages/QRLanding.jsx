import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export default function QRLanding() {
  const { qrId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const redirect = async () => {
      try {
        // Fetch QR details
        const response = await fetch(`/api/qr/details/${qrId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Add tracking params to destination URL
          const destUrl = new URL(data.destinationUrl);
          destUrl.searchParams.append('ipause_scan', qrId);
          destUrl.searchParams.append('sessionId', searchParams.get('sessionId') || '');
          
          // Redirect immediately (no delay)
          window.location.replace(destUrl.toString());
        } else {
          window.location.replace('https://ipauseads.com');
        }
      } catch (err) {
        window.location.replace('https://ipauseads.com');
      }
    };

    redirect();
  }, [qrId, searchParams]);

  return null;
}
