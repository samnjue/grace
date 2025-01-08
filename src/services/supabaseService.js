import { supabase } from "../utils/supabase";

export const fetchVerseOfTheDay = async () => {
    const { data, error } = await supabase.from('VOTD').select('*').single();
    if (error) throw error;
    return data;
};

export const fetchDistrictNews = async (district) => {
    const { data, error } = await supabase.from('districtNews').select('*').eq('district_id', district).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const fetchSundayGuide = async (church) => {
    const { data, error } = await supabase.from('sundayGuide').select('*').eq('church_id', church).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};
