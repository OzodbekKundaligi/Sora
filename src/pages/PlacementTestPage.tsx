import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { savePlacementTestResult } from '../lib/localData';
import { evaluatePlacementAnswers, getPlacementQuestions } from '../services/academy';

export default function PlacementTestPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<ReturnType<typeof evaluatePlacementAnswers> | null>(null);

  if (!user) {
    return null;
  }

  const questions = getPlacementQuestions();

  function submitTest() {
    const answerIds = Object.values(answers);
    if (answerIds.length !== questions.length) {
      return;
    }

    const evaluation = evaluatePlacementAnswers(answerIds);
    setResult(evaluation);
    const nextUser = savePlacementTestResult(user.id, {
      ...evaluation,
      completedAt: new Date().toISOString(),
    });
    if (nextUser) {
      updateUser(nextUser);
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-primary">Placement Test</div>
            <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Start from the right level</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <section className="rounded-[2rem] p-6 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/15">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest opacity-80">Sora AI</div>
              <h1 className="mt-2 text-3xl font-extrabold">Find your best starting point</h1>
              <p className="mt-3 text-white/85 max-w-2xl">
                Answer these quick questions honestly. This step is required before Sora opens your roadmap, daily mission, and full practice path.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
          </div>
        </section>

        {questions.map((question, index) => (
          <section key={question.id} className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Question {index + 1}</div>
            <h2 className="mt-2 text-xl font-extrabold text-on-surface">{question.prompt}</h2>
            <div className="mt-5 grid gap-3">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                  className={`rounded-[1.25rem] border-2 p-4 text-left transition-all ${
                    answers[question.id] === option.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-container-low border-outline-variant/10 text-on-surface'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={submitTest}
            disabled={Object.keys(answers).length !== questions.length}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-white ${
              Object.keys(answers).length !== questions.length ? 'bg-outline/50' : 'bg-primary shadow-lg shadow-primary/25'
            }`}
          >
            Finish placement test
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold bg-surface-container-low text-on-surface"
          >
            Back to login
          </button>
        </div>

        {result && (
          <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Your result</div>
                <h3 className="mt-2 text-2xl font-extrabold text-on-surface">Recommended level: {result.level}</h3>
                <p className="mt-2 text-on-surface-variant">Placement score: {result.score}. Sora will now tune lessons and missions to this level.</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {result.recommendedFocus.map((focus) => (
                    <div key={focus} className="rounded-[1.25rem] bg-surface-container-low p-4">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Target className="w-4 h-4" />
                        {focus}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-3 rounded-2xl bg-primary text-white font-bold"
                  >
                    Go to dashboard
                  </button>
                  <button
                    onClick={() => navigate('/practice', { state: { tab: 'roleplay' } })}
                    className="px-5 py-3 rounded-2xl bg-secondary-container text-white font-bold"
                  >
                    Start speaking
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
