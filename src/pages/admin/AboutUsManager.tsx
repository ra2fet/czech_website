import React, { useState, useEffect } from 'react';
import {
    Save,
    Loader2,
    Image as ImageIcon,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';

interface AboutUsTranslation {
    hero_title: string;
    hero_subtitle: string;
    story_title: string;
    story_content: string;
    story_footer: string;
    vision_title: string;
    vision_description: string;
    mission_title: string;
    mission_description: string;
    sustainability_quote: string;
}

interface AboutUsData {
    id: number | null;
    image_url: string;
    translations: { [key: string]: AboutUsTranslation };
}

export function AboutUsManager() {
    const { languages, loadingLanguages } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<AboutUsData>({
        id: null,
        image_url: '',
        translations: {}
    });

    useEffect(() => {
        if (!loadingLanguages) {
            fetchAboutUs();
        }
    }, [loadingLanguages]);

    const fetchAboutUs = async () => {
        setLoading(true);
        try {
            const response = await config.axios.get('about-us/admin');
            const fetchedData = response.data;

            const initialTranslations: { [key: string]: AboutUsTranslation } = {};
            languages.forEach(lang => {
                initialTranslations[lang.code] = {
                    hero_title: fetchedData.translations?.[lang.code]?.hero_title || '',
                    hero_subtitle: fetchedData.translations?.[lang.code]?.hero_subtitle || '',
                    story_title: fetchedData.translations?.[lang.code]?.story_title || '',
                    story_content: fetchedData.translations?.[lang.code]?.story_content || '',
                    story_footer: fetchedData.translations?.[lang.code]?.story_footer || '',
                    vision_title: fetchedData.translations?.[lang.code]?.vision_title || '',
                    vision_description: fetchedData.translations?.[lang.code]?.vision_description || '',
                    mission_title: fetchedData.translations?.[lang.code]?.mission_title || '',
                    mission_description: fetchedData.translations?.[lang.code]?.mission_description || '',
                    sustainability_quote: fetchedData.translations?.[lang.code]?.sustainability_quote || '',
                };
            });

            setData({
                id: fetchedData.id,
                image_url: fetchedData.image_url || '',
                translations: initialTranslations
            });
        } catch (error) {
            toast.error('Error fetching About Us content');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await config.axios.put('about-us', {
                image_url: data.image_url,
                translations: data.translations
            });
            toast.success('About Us content updated successfully');
        } catch (error) {
            toast.error('Error updating About Us content');
            console.error('Error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTranslationChange = (langCode: string, field: keyof AboutUsTranslation, value: string) => {
        setData(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [langCode]: {
                    ...prev.translations[langCode],
                    [field]: value
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">About Us Management</h2>
                    <p className="text-gray-500 text-sm">Update the main "About Us" page content across all languages.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary flex items-center shadow-lg"
                >
                    {submitting ? (
                        <Loader2 size={20} className="animate-spin mr-2" />
                    ) : (
                        <Save size={20} className="mr-2" />
                    )}
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center space-x-2 bg-gray-50/50">
                    <ImageIcon size={20} className="text-primary-600" />
                    <h3 className="font-semibold text-gray-800">Media & Globals</h3>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Story Image URL</label>
                    <input
                        type="url"
                        value={data.image_url}
                        onChange={(e) => setData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    />
                    {data.image_url && (
                        <div className="mt-4 aspect-video w-48 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                            <img src={data.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                {languages.map(lang => (
                    <div key={lang.code} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center px-6">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 size={18} className={data.translations[lang.code]?.hero_title ? 'text-green-500' : 'text-gray-300'} />
                                <h3 className="font-bold text-gray-800">{lang.name} Content</h3>
                            </div>
                            <span className="text-xs font-mono uppercase bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                {lang.code}
                            </span>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Hero Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary-700 border-b pb-2">Hero Section</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hero Title</label>
                                    <input
                                        type="text"
                                        value={data.translations[lang.code]?.hero_title || ''}
                                        onChange={(e) => handleTranslationChange(lang.code, 'hero_title', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hero Subtitle</label>
                                    <textarea
                                        value={data.translations[lang.code]?.hero_subtitle || ''}
                                        onChange={(e) => handleTranslationChange(lang.code, 'hero_subtitle', e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Story Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary-700 border-b pb-2">Our Story</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Story Title</label>
                                    <input
                                        type="text"
                                        value={data.translations[lang.code]?.story_title || ''}
                                        onChange={(e) => handleTranslationChange(lang.code, 'story_title', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Story Content (Rich Text / Multiple Paragraphs)</label>
                                    <textarea
                                        value={data.translations[lang.code]?.story_content || ''}
                                        onChange={(e) => handleTranslationChange(lang.code, 'story_content', e.target.value)}
                                        rows={8}
                                        placeholder="Write story content here. Use new lines for paragraphs."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-sans"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Story Footer (Italic Highlight)</label>
                                    <input
                                        type="text"
                                        value={data.translations[lang.code]?.story_footer || ''}
                                        onChange={(e) => handleTranslationChange(lang.code, 'story_footer', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none italic"
                                    />
                                </div>
                            </div>

                            {/* Vision Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary-700 border-b pb-2">Vision & Mission</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vision Title</label>
                                        <input
                                            type="text"
                                            value={data.translations[lang.code]?.vision_title || ''}
                                            onChange={(e) => handleTranslationChange(lang.code, 'vision_title', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vision Description</label>
                                        <textarea
                                            value={data.translations[lang.code]?.vision_description || ''}
                                            onChange={(e) => handleTranslationChange(lang.code, 'vision_description', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 md:pt-10">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mission Title</label>
                                        <input
                                            type="text"
                                            value={data.translations[lang.code]?.mission_title || ''}
                                            onChange={(e) => handleTranslationChange(lang.code, 'mission_title', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mission Description</label>
                                        <textarea
                                            value={data.translations[lang.code]?.mission_description || ''}
                                            onChange={(e) => handleTranslationChange(lang.code, 'mission_description', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sustainability Summary */}
                            <div className="md:col-span-2 space-y-4 border-t pt-6 bg-primary-50/30 -mx-6 px-6 pb-6">
                                <h4 className="font-semibold text-primary-700">Sustainability Highlight Quote</h4>
                                <textarea
                                    value={data.translations[lang.code]?.sustainability_quote || ''}
                                    onChange={(e) => handleTranslationChange(lang.code, 'sustainability_quote', e.target.value)}
                                    rows={2}
                                    placeholder="Quote shown at the bottom of the page..."
                                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4 pb-12">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary flex items-center shadow-lg px-8 py-3"
                >
                    {submitting ? (
                        <Loader2 size={24} className="animate-spin mr-2" />
                    ) : (
                        <Save size={24} className="mr-2" />
                    )}
                    Save All Changes
                </button>
            </div>
        </div>
    );
}
