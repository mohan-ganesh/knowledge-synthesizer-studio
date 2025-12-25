import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch header configuration from the Spring Boot API
 * @param {string} activePage - The current active page identifier
 * @returns {object} - { config, loading, error, refetch }
 */
export const useHeaderConfig = (activePage = 'default') => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_HEADER_API_URL || 'https://mohan-ganesh.appspot.com';
      const response = await fetch(
        `${apiUrl}/api/header/config?activePage=${encodeURIComponent(activePage)}`,
        {
          credentials: 'include', // Important for session cookies
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch header config: ${response.status}`);
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error fetching header config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [activePage]);

  return { config, loading, error, refetch: fetchConfig };
};
