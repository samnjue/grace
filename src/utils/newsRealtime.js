import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

export const useDistrictNewsSubscription = (districtId) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let subscription;

        const fetchInitialData = async () => {
            if (!districtId) {
                setError('No district selected');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('districtNews')
                    .select('*')
                    .eq('district_id', districtId)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;

                setNews(data || []);
                setError('');
            } catch (err) {
                setError('Check your connection');
            } finally {
                setLoading(false);
            }
        };

        const setupSubscription = () => {
            subscription = supabase
                .channel('district_news_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'districtNews',
                        filter: `district_id=eq.${districtId}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setNews(currentNews => [payload.new, ...currentNews]);
                        } else if (payload.eventType === 'DELETE') {
                            setNews(currentNews =>
                                currentNews.filter(item => item.id !== payload.old.id)
                            );
                        } else if (payload.eventType === 'UPDATE') {
                            setNews(currentNews =>
                                currentNews.map(item =>
                                    item.id === payload.new.id ? payload.new : item
                                )
                            );
                        }
                    }
                )
                .subscribe();
        };

        fetchInitialData();
        if (districtId) {
            setupSubscription();
        }

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [districtId]);

    return { news, loading, error };
};