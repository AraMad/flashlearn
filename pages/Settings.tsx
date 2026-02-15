
import React, { useState, useEffect, useRef } from 'react';
import { DataStore, BackupPayload } from '../store';
import { Download, Upload, ShieldCheck, Database, Calendar, FileJson, AlertCircle, Loader2, ChevronLeft, Shield } from 'lucide-react';

interface SettingsProps {
  onBack?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [backupInfo, setBackupInfo] = useState<{ timestamp: number, filename: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ 
    type: 'success' | 'error', 
    message: string, 
    stats?: { sets: number, cards: number } 
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBackupInfo(DataStore.getBackupInfo());
  }, []);

  const handleExport = () => {
    DataStore.exportData();
    setBackupInfo(DataStore.getBackupInfo());
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("Importing data will OVERWRITE all your current flashcards and progress. Are you sure?")) {
      setIsImporting(true);
      setImportProgress(10);
      setImportStatus(null);

      try {
        const text = await file.text();
        setImportProgress(70);
        
        await new Promise(resolve => setTimeout(resolve, 600));

        const payload: BackupPayload = JSON.parse(text);
        const success = await DataStore.importData(file);
        setImportProgress(100);

        if (success) {
          setImportStatus({ 
            type: 'success', 
            message: 'Data restored successfully!',
            stats: {
              sets: payload.data.sets.length,
              cards: payload.data.cards.length
            }
          });
        } else {
          setImportStatus({ type: 'error', message: 'Import failed. The file signature is invalid or data is corrupt.' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Failed to parse the backup file. Please ensure it is a valid JSON export from FlashLearn.' });
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (showPrivacy) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 border-b border-slate-900 pb-4 sticky top-0 bg-slate-950 z-10 pt-2">
          <button 
            onClick={() => setShowPrivacy(false)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-slate-100">Privacy Policy</h2>
        </div>

        <div className="prose prose-invert max-w-none text-slate-400 space-y-6 pb-20">
          <section>
            <p className="text-sm">Last updated: February 15, 2026</p>
            <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
            <p>We use Your Personal Data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Interpretation and Definitions</h3>
            <h4 className="font-bold text-slate-200">Interpretation</h4>
            <p>The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            <h4 className="font-bold text-slate-200">Definitions</h4>
            <p>For the purposes of this Privacy Policy:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
              <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our") refers to StarkSoft, Kropyvnytskyi, Ukraine, 25009.</li>
              <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website.</li>
              <li><strong>Country</strong> refers to: Ukraine</li>
              <li><strong>Device</strong> means any device that can access the Service.</li>
              <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
              <li><strong>Service</strong> refers to the Website.</li>
              <li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself.</li>
              <li><strong>Website</strong> refers to FlashLearn, accessible from https://aramad.github.io/flashlearn/.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Collecting and Using Your Personal Data</h3>
            <h4 className="font-bold text-slate-200">Types of Data Collected</h4>
            <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You.</p>
            <h4 className="font-bold text-slate-200">Usage Data</h4>
            <p>Usage Data is collected automatically when using the Service. This may include IP addresses, browser type, browser version, and pages visited.</p>
            <h4 className="font-bold text-slate-200">Tracking Technologies and Cookies</h4>
            <p>We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. You can instruct Your browser to refuse all Cookies, but some parts of the service may not function correctly.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Use of Your Personal Data</h3>
            <p>The Company may use Personal Data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service.</li>
              <li>To manage Your Account and registration.</li>
              <li>For the performance of a contract.</li>
              <li>To contact You regarding updates or informative communications.</li>
              <li>To provide news and special offers.</li>
              <li>To manage Your requests.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Retention of Your Personal Data</h3>
            <p>The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. Account information is typically retained for the duration of your account relationship plus up to 24 months.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Children's Privacy</h3>
            <p>Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, You can contact us:</p>
            <p>By email: <span className="text-indigo-400 font-bold">hello@starksoft.online</span></p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Settings</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup Section */}
        <section className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6 relative overflow-hidden">
          {isImporting && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
              <h4 className="text-xl font-bold text-slate-100 mb-2">Restoring Your Data</h4>
              <p className="text-sm text-slate-400 mb-6">Validating backup and rebuilding your library...</p>
              <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">{importProgress}%</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Backup & Restore</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Data Management</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed">
              Securely export your study sets, flashcards, and progress to a file and save locally
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleExport}
                disabled={isImporting}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-900/20 disabled:opacity-50"
              >
                <Download size={20} />
                Export Data
              </button>
              
              <button 
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 text-slate-100 font-bold rounded-xl hover:bg-slate-700 transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <Upload size={20} />
                Import Data
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>

            {importStatus && (
              <div className={`p-4 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2 border ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
                  : 'bg-red-950/20 border-red-900/50 text-red-400'
              }`}>
                <div className="flex items-start gap-3">
                  {importStatus.type === 'success' ? <ShieldCheck size={20} className="mt-0.5 shrink-0" /> : <AlertCircle size={20} className="mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-sm font-bold">{importStatus.message}</p>
                    {importStatus.stats && (
                      <p className="text-xs opacity-70 mt-1">
                        Restored <span className="font-bold">{importStatus.stats.sets}</span> sets and <span className="font-bold">{importStatus.stats.cards}</span> cards.
                      </p>
                    )}
                  </div>
                </div>
                {importStatus.type === 'success' && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all w-fit"
                  >
                    Refresh Library Now
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Latest Backup Information</h4>
            {backupInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FileJson size={16} className="text-indigo-400" />
                  <span className="text-slate-300 font-medium truncate">{backupInfo.filename}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-slate-500">{new Date(backupInfo.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 italic">No backups found on this device.</p>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="space-y-8 flex flex-col h-full">
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 mb-2">Security Note</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Backup files are signed with a security signature to prevent accidental corruption. Everything is kept locally on your browser.
              </p>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-end py-10 space-y-6">
              <div className="text-center opacity-20 grayscale">
                <Database size={48} className="text-slate-400 mb-4 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">FlashLearn v1.0.0</p>
              </div>

              <button 
                onClick={() => setShowPrivacy(true)}
                className="text-xs text-slate-500 hover:text-indigo-400 underline transition-colors"
              >
                Privacy Policy
              </button>
           </div>
        </section>
      </div>
    </div>
  );
};
