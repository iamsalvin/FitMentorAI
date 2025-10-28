import { useState, useRef, useEffect } from 'react';
import { chatApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi! I am your FitMentor assistant. Ask me about workouts, challenges, or how to use the app.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setSending(true);
    try {
      const res = await chatApi.send(next.slice(-8)); // keep context small
      const reply = (res.data?.message || '').trim();
      setMessages((cur) => [...cur, { role: 'assistant', content: reply || '...' }]);
    } catch (e: any) {
      setMessages((cur) => [...cur, { role: 'assistant', content: 'Sorry, I could not respond right now.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {open && (
          <Card className="w-[320px] h-[440px] shadow-xl border-primary/20">
            <CardHeader>
              <CardTitle>FitMentor Assistant</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[360px] flex flex-col">
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex items-center gap-2">
                <Input
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send();
                  }}
                />
                <Button onClick={send} disabled={sending || !input.trim()}>Send</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <button
          aria-label="Open chat"
          onClick={() => setOpen((v) => !v)}
          className="relative h-14 w-14 rounded-full shadow-lg border bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center overflow-hidden"
        >
          <img src="/placeholder.svg" alt="Chat" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <span className="relative font-semibold">Chat</span>
        </button>
      </div>
    </>
  );
}


