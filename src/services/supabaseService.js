import { supabase } from "../utils/supabase";

export const fetchVerseOfTheDay = async () => {
    const { data, error } = await supabase
        .from('VOTD')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error) throw error;
    return data;
};

export const fetchVerseHistory = async (limit = 20) => {
    const { data, error } = await supabase
        .from('VOTD')
        .select('*')
        .order('created_at', { ascending: false })
    //.limit(limit);
    if (error) throw error;
    return data;
};

export const fetchDistrictNews = async (district) => {
    const { data, error } = await supabase.from('districtNews').select('*').eq('district_id', district).order('created_at', { ascending: false }).limit(3);
    if (error) throw error;
    return data;
};

export const fetchDistrictNewsScreen = async (district) => {
    const { data, error } = await supabase
        .from('districtNews')
        .select(`
            id,
            title,
            content,
            created_at,
            user_id,
            users (
                display_name
            )
        `)
        .eq('district_id', district)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        date: item.created_at,
        user_id: item.user_id,
        user_name: item.users?.display_name || 'Anonymous',
    }));
};

export const deleteNewsItem = async (newsItemId) => {
    try {
        const { data, error } = await supabase
            .from('districtNews')
            .delete()
            .eq('id', newsItemId);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error deleting news item:', error);
        throw new Error('Error deleting the news item');
    }
};


export const fetchSundayGuide = async (church) => {
    const { data, error } = await supabase.from('sundayGuide').select('*').eq('church_id', church).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};
