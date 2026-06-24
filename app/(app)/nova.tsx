import { Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GScreen, NovaMascot } from '@/components/gami';
import { haptics } from '@/lib/haptics';
import { type ChatMessage, NOVA_SUGGESTIONS, novaOpener, novaReplyLive } from '@/lib/nova';

let idSeq = 0;
const nextId = () => `m${(idSeq += 1)}`;

function Bubble({ msg }: { msg: ChatMessage }) {
  const isNova = msg.role === 'nova';
  return (
    <View className={`mb-3 max-w-[82%] ${isNova ? 'self-start' : 'self-end'}`}>
      <View className={`rounded-2xl px-4 py-3 ${isNova ? 'bg-surface' : 'bg-purple'}`}>
        <Text
          className={`font-body text-[14px] ${isNova ? 'text-ink' : 'text-white'}`}
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

export default function Nova() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages([{ id: nextId(), role: 'nova', text: novaOpener() }]);
  }, []);

  const scrollEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    haptics.light();
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: clean };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    scrollEnd();
    void novaReplyLive(clean, history)
      .then((reply) => {
        setMessages((m) => [...m, { id: nextId(), role: 'nova', text: reply }]);
      })
      .catch(() => {
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: 'nova',
            text: 'my brain glitched for a sec — try that again?',
          },
        ]);
      })
      .finally(() => {
        setTyping(false);
        scrollEnd();
      });
  };

  return (
    <GScreen>
      <View className="border-hairline flex-row items-center gap-3 border-b px-5 pt-1 pb-3">
        <NovaMascot size={36} mood="happy" still />
        <View>
          <Text
            className="font-display text-ink text-[18px] font-bold"
            style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            NOVA
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="bg-green h-1.5 w-1.5 rounded-full" />
            <Text className="text-ink-mute font-mono text-[10px]">AI AGENT · ONLINE</Text>
          </View>
        </View>
      </View>

      <View className="border-hairline bg-surface/40 border-b px-5 py-2">
        <Text className="text-ink-mute font-mono text-[10px] leading-4">
          NOVA suggests — you approve. It never moves funds or signs.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
          onContentSizeChange={scrollEnd}
        >
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {typing ? (
            <View className="bg-surface mb-3 max-w-[60%] self-start rounded-2xl px-4 py-3">
              <Text className="text-ink-mute font-mono text-[14px]">NOVA is typing…</Text>
            </View>
          ) : null}
        </ScrollView>

        {messages.length <= 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
          >
            {NOVA_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                className="border-hairline bg-surface rounded-full border px-3.5 py-2"
              >
                <Text className="text-ink-dim font-mono text-[12px]">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View className="border-hairline flex-row items-center gap-2 border-t px-4 py-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask NOVA anything…"
            placeholderTextColor="#6B6880"
            className="border-hairline bg-surface font-body text-ink flex-1 rounded-full border px-4 py-3 text-[15px]"
            style={{ fontFamily: 'Inter_400Regular' }}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => send(input)}
            className="bg-purple h-12 w-12 items-center justify-center rounded-full"
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GScreen>
  );
}
