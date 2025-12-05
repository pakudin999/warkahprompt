import React, { useState, useCallback, memo, useRef } from 'react';
import { Sparkles, Heart, Aperture, RefreshCw, Layers, User, ScanFace, Check } from 'lucide-react';
import { generateStyleAnalysis, generateBatchPoses } from './services/geminiService';
import { AnalyzerState, PoseState, AlertState, LoadingState } from './types';
import { InfoButton, CopyButton, ImageUploadArea, AlertModal, LoadingModal } from './components/UI';

// --- UTILS ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- TAB COMPONENTS ---

interface TabProps {
    showModal: (title: string, message: string) => void;
    showLoadingModal: (title: string, message: string) => void;
    hideLoadingModal: () => void;
    onReset: () => void;
}

const StyleAnalyzerTab = memo(({ showModal, showLoadingModal, hideLoadingModal, formData, setFormData, onReset }: TabProps & { formData: AnalyzerState, setFormData: React.Dispatch<React.SetStateAction<AnalyzerState>> }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadedFile, generatedPrompt } = formData;

    const handleFile = useCallback((file: File) => {
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showModal('Format Tidak Sah', 'Sila muat naik fail gambar JPG atau PNG sahaja.');
            return;
        }
        if (uploadedFile) URL.revokeObjectURL(uploadedFile.previewUrl);
        setFormData((prev) => ({...prev, uploadedFile: { file, previewUrl: URL.createObjectURL(file) }}));
    }, [showModal, uploadedFile, setFormData]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData((prev) => ({...prev, uploadedFile: null, generatedPrompt: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadedFile) {
            showModal('Tiada Gambar', 'Sila muat naik gambar rujukan gaya kahwin terlebih dahulu.');
            return;
        }
        showLoadingModal('Analisis Gaya...', 'AI sedang membaca tekstur, pencahayaan, dan mood...');
        setFormData((prev) => ({...prev, generatedPrompt: ''}));
        try {
            const base64ImageData = await fileToBase64(uploadedFile.file);
            const prompt = await generateStyleAnalysis(base64ImageData, uploadedFile.file.type);
            setFormData((prev) => ({...prev, generatedPrompt: prompt}));
        } catch (error) {
            console.error(error);
            showModal('Ralat', 'Sistem gagal memproses gambar. Pastikan API key sah.');
        } finally {
            hideLoadingModal();
        }
    };

    return (
        <div className="animate-in slide-in-from-right-5 duration-500">
             <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-lg font-serif text-slate-200">Analisis Style & Tone</h3>
                <InfoButton title="Info Analisis">
                     <p>AI akan menganalisis estetik gambar (warna, lighting, mood) dan menghasilkan satu prompt utama untuk ditiru.</p>
                </InfoButton>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <ImageUploadArea 
                    uploadedFile={uploadedFile}
                    isDragging={isDragging}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    fileInputRef={fileInputRef}
                    handleFile={handleFile}
                    onRemove={handleRemove}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="submit" disabled={!uploadedFile} className="flex-1 w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 hover:shadow-amber-500/20 hover:-translate-y-0.5 group text-sm">
                        {uploadedFile ? <Sparkles size={18} className="animate-pulse" /> : <Aperture size={18} />}
                        <span className="tracking-wide">ANALISIS STYLE</span>
                    </button>
                    <button type="button" onClick={onReset} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium py-3.5 px-4 rounded-xl transition duration-300 border border-slate-700 hover:border-slate-500">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </form>

            {generatedPrompt && (
                <div className="mt-10 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-serif text-white flex items-center gap-2"><Check className="text-emerald-500" size={16} /> Prompt Hasil Analisis</h2>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">AI Model v6.0</span>
                    </div>
                    <div className="relative bg-slate-900/80 rounded-xl p-1 border border-slate-700/50 shadow-2xl backdrop-blur-sm overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                        <textarea value={generatedPrompt} className="w-full bg-transparent border-0 text-slate-300 focus:ring-0 resize-none p-5 font-mono text-xs md:text-sm leading-loose" rows={8} readOnly />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <CopyButton textToCopy={generatedPrompt} label="SALIN" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const PoseGeneratorTab = memo(({ showModal, showLoadingModal, hideLoadingModal, formData, setFormData, onReset }: TabProps & { formData: PoseState, setFormData: React.Dispatch<React.SetStateAction<PoseState>> }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadedFile, posePrompts } = formData;

    const handleFile = useCallback((file: File) => {
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showModal('Format Tidak Sah', 'Sila muat naik fail gambar JPG atau PNG sahaja.');
            return;
        }
        if (uploadedFile) URL.revokeObjectURL(uploadedFile.previewUrl);
        setFormData((prev) => ({...prev, uploadedFile: { file, previewUrl: URL.createObjectURL(file) }}));
    }, [showModal, uploadedFile, setFormData]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData((prev) => ({...prev, uploadedFile: null, posePrompts: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadedFile) {
            showModal('Tiada Gambar', 'Sila muat naik gambar rujukan tema terlebih dahulu.');
            return;
        }
        showLoadingModal('Menjana Variasi...', 'AI sedang mencipta 8 jenis pose profesional & candid...');
        setFormData((prev) => ({...prev, posePrompts: null }));
        try {
            const base64ImageData = await fileToBase64(uploadedFile.file);
            const prompts = await generateBatchPoses(base64ImageData, uploadedFile.file.type);
            setFormData((prev) => ({...prev, posePrompts: prompts }));
        } catch (error) {
            console.error(error);
            showModal('Ralat', 'Sistem gagal menjana pose. Pastikan API key sah.');
        } finally {
            hideLoadingModal();
        }
    };

    return (
        <div className="animate-in slide-in-from-right-5 duration-500">
            <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-lg font-serif text-slate-200">Variasi Pose & Angle</h3>
                <InfoButton title="Batch Pose">
                     <p>Muat naik gambar tema, dan AI akan menjana 8 variasi prompt berbeza (Candid, Romantic, Artistic, dll) mengikut estetik gambar tersebut.</p>
                </InfoButton>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <ImageUploadArea 
                    uploadedFile={uploadedFile}
                    isDragging={isDragging}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    fileInputRef={fileInputRef}
                    handleFile={handleFile}
                    onRemove={handleRemove}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="submit" disabled={!uploadedFile} className="flex-1 w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 hover:shadow-amber-500/20 hover:-translate-y-0.5 group text-sm">
                        {uploadedFile ? <Layers size={18} className="animate-pulse" /> : <ScanFace size={18} />}
                        <span className="tracking-wide">JANA 8 VARIASI POSE</span>
                    </button>
                    <button type="button" onClick={onReset} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium py-3.5 px-4 rounded-xl transition duration-300 border border-slate-700 hover:border-slate-500">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </form>

            {posePrompts && (
                <div className="mt-10 space-y-4 animate-in slide-in-from-bottom-10 duration-700">
                    <h2 className="text-sm font-serif text-white flex items-center gap-2 mb-4"><Check className="text-emerald-500" size={16} /> Senarai Batch Prompt (8 Variasi)</h2>
                    
                    {posePrompts.map((item, index) => (
                        <div key={index} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-colors group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{index + 1}. {item.title}</span>
                                <CopyButton textToCopy={item.prompt} label="SALIN" />
                            </div>
                            <p className="font-mono text-xs text-slate-300 leading-relaxed opacity-90">{item.prompt}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default function App() {
    const [activeTab, setActiveTab] = useState<'analyzer' | 'poses'>('analyzer');
    
    // State berasingan untuk setiap tab supaya data tak hilang bila tukar tab
    const [analyzerData, setAnalyzerData] = useState<AnalyzerState>({ uploadedFile: null, generatedPrompt: '' });
    const [poseData, setPoseData] = useState<PoseState>({ uploadedFile: null, posePrompts: null });

    const [alert, setAlert] = useState<AlertState>({ show: false, title: '', message: '' });
    const [loading, setLoading] = useState<LoadingState>({ show: false, title: '', message: '' });

    const showModal = useCallback((title: string, message: string) => setAlert({ show: true, title, message }), []);
    const showLoadingModal = useCallback((title: string, message: string) => setLoading({ show: true, title, message }), []);
    const hideLoadingModal = useCallback(() => setLoading(prev => ({ ...prev, show: false })), []);

    const handleResetAnalyzer = useCallback(() => setAnalyzerData({ uploadedFile: null, generatedPrompt: '' }), []);
    const handleResetPose = useCallback(() => setPoseData({ uploadedFile: null, posePrompts: null }), []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 selection:bg-amber-500/30 selection:text-amber-200">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-xl mx-auto">
                <AlertModal show={alert.show} title={alert.title} message={alert.message} onClose={() => setAlert(prev => ({ ...prev, show: false }))} />
                <LoadingModal show={loading.show} title={loading.title} message={loading.message} />

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8 space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Heart className="text-amber-500 fill-amber-500" size={16} />
                        <span className="text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">Sistem Pintar</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">WARKAH KASIH</h1>
                    <p className="text-slate-400 text-sm font-light tracking-wide max-w-lg mx-auto">Analisis Gaya Kahwin & Penjana Prompt Profesional</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-900/80 rounded-2xl mb-8 border border-slate-800 backdrop-blur-sm relative">
                    <button 
                        onClick={() => setActiveTab('analyzer')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analyzer' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Aperture size={16} /> Analisis Style
                    </button>
                    <button 
                        onClick={() => setActiveTab('poses')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'poses' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <User size={16} /> Variasi Pose
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-slate-900/20 rounded-3xl p-1">
                    {activeTab === 'analyzer' ? (
                        <StyleAnalyzerTab 
                            showModal={showModal} 
                            showLoadingModal={showLoadingModal} 
                            hideLoadingModal={hideLoadingModal} 
                            formData={analyzerData} 
                            setFormData={setAnalyzerData} 
                            onReset={handleResetAnalyzer} 
                        />
                    ) : (
                        <PoseGeneratorTab 
                            showModal={showModal} 
                            showLoadingModal={showLoadingModal} 
                            hideLoadingModal={hideLoadingModal} 
                            formData={poseData} 
                            setFormData={setPoseData} 
                            onReset={handleResetPose} 
                        />
                    )}
                </div>

                <div className="text-center mt-12 pb-8 border-t border-slate-800/50 pt-8">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-600 mb-2">DIKUASAKAN OLEH</p>
                    <p className="text-xs text-slate-500 font-mono">@konten_beban</p>
                </div>
            </div>
        </div>
    );
}