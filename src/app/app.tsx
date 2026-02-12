import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { PlusCircle, BookOpen, Loader2, Calendar, LogOut, GitCommit, Map as MapIcon, Sparkles, Printer, UserCircle, Heart, Bot, Target } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { DiaryEntryForm, type DiaryEntry } from './components/diary-entry-form';
import { AIChatView } from './components/ai-chat-view';
import { TimelineView } from './components/timeline-view';
import { CalendarView } from './components/calendar-view';
import { MapView } from './components/map-view';
import { InsightsView } from './components/insights-view';
import { MilestonesView } from './components/milestones-view';
import { ExportMenu } from './components/export-menu';
import { ChangelogView } from './components/changelog-view';
import { PrintShopView } from './components/print-shop-view';
import { AccountView } from './components/account-view';
import { CoupleSplitView } from './components/couple-split-view';
import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import { FriendProvider } from './context/FriendContext';
import { ThemeSelector } from './components/theme-selector';
import { InstallButton } from './components/install-button';
import { WelcomeModal } from './components/welcome-modal';
import { Footer } from './components/footer';
import { AboutView, PrivacyView, TermsView } from './components/legal-pages';
import { SubscriptionView } from './components/subscription-view';
import { fetchEntries, createEntry, deleteEntry, updateEntry } from './utils/api';
import { useAuth } from './context/AuthContext';
import { useGroup } from './context/GroupContext';
import { supabase } from './utils/supabaseClient';
import { LoginForm } from './components/auth/login-form';

import { useTranslation } from 'react-i18next';
import { ReloadPrompt } from './components/reload-prompt';

export default function App() {
  return (
    <ThemeProvider>
      <GroupProvider>
        <FriendProvider>
          <AppContent />
          <ReloadPrompt />
          <Toaster position="top-center" reverseOrder={false} />
        </FriendProvider>
      </GroupProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { currentGroupId } = useGroup();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const FloatingAIButton = () => (
    <button
      onClick={() => setIsAIChatOpen(true)}
      className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-40 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
    >
      <Bot className="w-6 h-6 animate-pulse" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Chat with Memories
      </span>
    </button>
  );

  // Load entries from server on mount
  useEffect(() => {
    if (user?.id) {
      loadEntries();
    }
  }, [user?.id]);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await fetchEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('photo-diary-entries');
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing stored entries:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry(entry: DiaryEntry, targetGroups: string[] = ['private']) {
    try {
      setSaving(true);
      const payload = {
        photo: entry.photo,
        caption: entry.caption,
        mood: entry.mood,
        date: entry.date,
        location: entry.location,
        tags: entry.tags || [],
        aiTags: entry.aiTags || [],
        palette: entry.palette,
      };

      const promises = [];

      // 1. Save to Private (Edge Function / API) if selected
      if (targetGroups.includes('private')) {
        console.log('Saving to Private Diary...');
        promises.push(createEntry(payload).then(newEntry => {
          setEntries(prev => [newEntry, ...prev]);
        }));
      }

      // 2. Save to Groups (Supabase) if selected
      const groupIds = targetGroups.filter(id => id !== 'private');
      if (groupIds.length > 0 && user) {
        console.log('Saving to Groups:', groupIds);
        const groupInserts = groupIds.map(async (groupId) => {
          const { error } = await supabase.from('diary_entries').insert({
            user_id: user.id,
            group_id: groupId,
            photo_url: payload.photo,
            caption: payload.caption,
            mood: payload.mood,
            location: payload.location,
            date: payload.date
          });
          
          if (error) {
            console.error(`Error saving to group ${groupId}:`, error);
            throw new Error(`Failed to save to group: ${error.message}`);
          }
        });
        promises.push(...groupInserts);
      }

      await Promise.all(promises);
      
      toast.success('Memory saved successfully!', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      
      // Navigate based on context
      if (targetGroups.includes('private') && targetGroups.length === 1) {
        navigate('/');
      } else {
        navigate('/map'); // Go to map to see group entries
      }

    } catch (error) {
      console.error('Failed to create entry:', error);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEntry(entry: DiaryEntry, targetGroups: string[]) {
    try {
      setSaving(true);
      const payload = {
        photo: entry.photo,
        caption: entry.caption,
        mood: entry.mood,
        date: entry.date,
        location: entry.location,
        tags: entry.tags || [],
        aiTags: entry.aiTags || [],
        palette: entry.palette,
      };
      console.log('Updating entry with payload:', payload);

      // Note: Update currently only supports updating Personal Entries in Edge Function
      // Group Entry updates are more complex (need to update Supabase row)
      // For now, we only update the personal copy if it exists.
      
      const updatedEntry = await updateEntry(entry.id, payload);

      setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
      toast.success('Memory updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error('Failed to update entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Memory deleted.');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry. Please try again.');
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const isAddOrEdit = location.pathname === '/add' || location.pathname.startsWith('/edit');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Photo Diary</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Capture your daily moments</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <InstallButton />
              {/* Theme Selector */}
              <ThemeSelector />

              {/* Export Menu */}
              {!isAddOrEdit && <ExportMenu entries={entries} />}

              {/* Navigation Tabs */}
              <nav className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto transition-colors">
                <button
                  onClick={() => navigate('/')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.timeline')}</span>
                </button>
                <button
                  onClick={() => navigate('/calendar')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/calendar'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.calendar')}</span>
                </button>
                <button
                  onClick={() => navigate('/map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/map'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.map')}</span>
                </button>
                <button
                  onClick={() => navigate('/couple')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/couple'
                      ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.couple')}</span>
                </button>
                
                {/* Milestones Button - Replaces Capsule */}
                <button
                  onClick={() => navigate('/milestones')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/milestones'
                      ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.milestones')}</span>
                </button>

                <button
                  onClick={() => navigate('/insights')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/insights'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.insights')}</span>
                </button>
                <button
                  onClick={() => navigate('/print')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/print'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.print')}</span>
                </button>
                <button
                  onClick={() => navigate('/changelog')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/changelog'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <GitCommit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.logs')}</span>
                </button>
                <button
                  onClick={() => navigate('/add')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    location.pathname === '/add'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.add')}</span>
                </button>
              </nav>

              <button
                onClick={() => navigate('/account')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
                title={t('nav.account')}
              >
                <UserCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <TimelineView 
              entries={entries} 
              onDeleteEntry={handleDeleteEntry} 
              loading={loading}
            />
          } />
          <Route path="/calendar" element={
            <CalendarView 
              entries={entries} 
              onDeleteEntry={handleDeleteEntry} 
            />
          } />
          <Route path="/couple" element={<CoupleSplitView />} />
          <Route path="/map" element={<MapView entries={entries} />} />
          <Route path="/insights" element={<InsightsView entries={entries} />} />
          <Route path="/milestones" element={<MilestonesView entries={entries} />} />
          <Route path="/print" element={<PrintShopView entries={entries} />} />
          <Route path="/account" element={<AccountView />} />
          <Route path="/changelog" element={<ChangelogView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="/terms" element={<TermsView />} />
          <Route path="/subscription" element={<SubscriptionView />} />
          <Route path="/add" element={
            <div className="max-w-2xl mx-auto">
              <DiaryEntryForm onSave={handleAddEntry} saving={saving} />
            </div>
          } />
          <Route path="/edit/:id" element={
            <div className="max-w-2xl mx-auto">
              {/* Logic to find entry by ID */}
              <EditEntryWrapper entries={entries} onSave={handleUpdateEntry} saving={saving} loading={loading} />
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Action Button - Mobile */}
      {!isAddOrEdit && location.pathname !== '/changelog' && (
        <button
          onClick={() => navigate('/add')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center md:hidden z-50"
          aria-label="Add new entry"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      )}

      {!isAddOrEdit && <FloatingAIButton />}

      <AIChatView 
        entries={entries}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      <WelcomeModal />
      <Footer />
    </div>
  );
}

// Wrapper to handle finding the entry for editing
function EditEntryWrapper({ entries, onSave, saving, loading }: { entries: DiaryEntry[], onSave: (entry: DiaryEntry, targetGroups: string[]) => void, saving: boolean, loading: boolean }) {
  const { id } = useParams();
  const entry = entries.find(e => e.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-900">Entry not found</h3>
        <p className="text-gray-500 mt-2">The memory you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <DiaryEntryForm initialData={entry} onSave={onSave} saving={saving} isEdit />;
}
