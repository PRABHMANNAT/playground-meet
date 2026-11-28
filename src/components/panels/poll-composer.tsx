'use client';
import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { PanelProps } from './types';

export function PollComposer({ send, done }: { send: PanelProps['send']; done: () => void }) {
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState([
    { id: 0, text: '' },
    { id: 1, text: '' },
  ]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(2);
  const options = choices.map((choice) => choice.text.trim());
  const duplicates = new Set(options.filter(Boolean)).size < options.filter(Boolean).length;
  const valid = question.trim() && options.every(Boolean) && !duplicates;
  return (
    <form
      className="poll-compose"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        try {
          if (await send({ type: 'poll', question: question.trim(), options })) done();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Question
        <input
          autoFocus
          required
          value={question}
          maxLength={200}
          placeholder="Ask the meeting…"
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      <fieldset>
        <legend>Answer choices</legend>
        {choices.map((c, i) => (
          <div className="poll-choice" key={c.id}>
            <span aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <input
              aria-label={'Choice ' + (i + 1)}
              required
              value={c.text}
              maxLength={100}
              placeholder={'Choice ' + (i + 1)}
              onChange={(e) =>
                setChoices(choices.map((v) => (v.id === c.id ? { ...v, text: e.target.value } : v)))
              }
            />
            {choices.length > 2 && (
              <button
                type="button"
                className="icon-button"
                aria-label={'Remove choice ' + (i + 1)}
                onClick={() => setChoices(choices.filter((v) => v.id !== c.id))}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {choices.length < 6 && (
          <button
            type="button"
            className="text-button"
            onClick={() => setChoices([...choices, { id: nextId.current++, text: '' }])}
          >
            <Plus size={14} /> Add choice
          </button>
        )}
      </fieldset>
      {duplicates && <small role="alert">Give each choice a different answer.</small>}
      <div className="poll-compose-actions">
        <button className="button primary" disabled={!valid || busy}>
          {busy ? 'Opening…' : 'Open poll'}
        </button>
        <button type="button" className="text-button" disabled={busy} onClick={done}>
          Cancel
        </button>
      </div>
    </form>
  );
}
