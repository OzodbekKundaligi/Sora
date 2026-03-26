import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Mic, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addTeacherContent, getTeacherContent, removeTeacherContent } from '../lib/localData';

type ContentType = 'lesson' | 'quiz' | 'listening' | 'writing' | 'speaking';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = React.useState(() => getTeacherContent());
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [body, setBody] = React.useState('');
  const [level, setLevel] = React.useState('A1');
  const [contentType, setContentType] = React.useState<ContentType>('lesson');

  if (!user) {
    return null;
  }

  if (user.role !== 'teacher') {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg bg-surface-container-lowest rounded-4xl p-8 border border-outline-variant/10 shadow-sm text-center">
          <h1 className="text-2xl font-extrabold text-on-surface">Teacher access only</h1>
          <p className="mt-3 text-on-surface-variant">This dashboard is for teacher/admin accounts. Use an account with an email that includes admin or teacher.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-5 px-5 py-3 rounded-2xl bg-primary text-white font-bold">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  function submitContent() {
    if (!title.trim() || !description.trim() || !body.trim()) {
      return;
    }

    const next = addTeacherContent({
      title: title.trim(),
      description: description.trim(),
      body: body.trim(),
      level,
      contentType,
      createdBy: user.name,
    });
    setItems((current) => [next, ...current]);
    setTitle('');
    setDescription('');
    setBody('');
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-primary">Teacher Dashboard</div>
            <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Add lessons, drills, and teacher notes</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-primary">Create content</div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none">
              {['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none">
              {['lesson', 'quiz', 'listening', 'writing', 'speaking'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} placeholder="Teacher content body" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none" />
          <button onClick={submitContent} className="w-full rounded-2xl bg-primary text-white font-bold py-3.5 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Publish teacher content
          </button>
        </section>

        <section className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-4xl p-8 border border-outline-variant/10 shadow-sm text-on-surface-variant">
              Teacher content will appear here after you publish the first item.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">{item.level} • {item.contentType}</div>
                    <h2 className="mt-2 text-xl font-extrabold text-on-surface">{item.title}</h2>
                    <p className="mt-2 text-on-surface-variant">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setItems(removeTeacherContent(item.id))}
                    className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 rounded-[1.25rem] bg-surface-container-low p-4 text-on-surface whitespace-pre-wrap">
                  {item.body}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-widest text-on-surface-variant">
                  <BookOpen className="w-4 h-4" />
                  {item.createdBy}
                  <Mic className="w-4 h-4 ml-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
