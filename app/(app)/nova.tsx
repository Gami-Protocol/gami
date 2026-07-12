import { Check, Send, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GScreen, NovaMascot } from '@/components/gami';
import { executeNovaProposal } from '@/lib/chain';
import { haptics } from '@/lib/haptics';
import { getNovaAgent } from '@/lib/nova-agents';
import { type ChatMessage, NOVA_SUGGESTIONS, novaOpener, novaReplyLive } from '@/lib/nova';
import type { NovaProposal } from '@/lib/nova-tools';
import { usePrivyBridge } from '@/lib/privy-bridge';

let idSeq = 0;
const nextId = () => `m${(idSeq += 1)}`;

function Bubble({
  msg,
  pending,
  onApprove,
  onCancel,
}: {
  msg: ChatMessage;
  pending: boolean;
  onApprove: (proposal: NovaProposal) => void;
  onCancel: (messageId: string) => void;
}) {
  const isNova = msg.role === 'nova';
  return (
    <View className={`mb-3 max-w-[82%] ${isNova ? 'self-start' : 'self-end'}`}>
      {isNova && msg.agentId ? (
        <Text className="text-purple mb-1 font-mono text-[9px] uppercase tracking-widest">
          {getNovaAgent(msg.agentId).name}
        </Text>
      ) : null}
      <View className={`rounded-2xl px-4 py-3 ${isNova ? 'bg-surface' : 'bg-purple'}`}>
        <Text
          className={`font-body text-[14px] ${isNova ? 'text-ink' : 'text-white'}`}
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {msg.text}
        </Text>
      </View>
      {msg.trace?.map((step) => (
        <View key={`${msg.id}-${step.toolId}`} className="mt-1 flex-row items-center gap-1.5 px-2">
          <Check size={11} color={step.status === 'completed' ? '#3DF5A0' : '#FF5A6F'} />
          <Text className="text-ink-mute font-mono text-[10px]">{step.label}</Text>
        </View>
      ))}
      {msg.proposal ? (
        <View className="border-purple/50 bg-surface mt-2 rounded-2xl border p-4">
          <Text className="text-purple font-mono text-[10px] tracking-widest">
            TRANSACTION PREVIEW
          </Text>
          <Text className="text-ink mt-2 font-mono text-[13px]">
            {msg.proposal.kind === 'gami_transfer'
              ? `Send ${msg.proposal.amount} GAMI`
              : 'Claim vested GAMI'}
          </Text>
          {msg.proposal.kind === 'gami_transfer' ? (
            <Text className="text-ink-mute mt-1 font-mono text-[10px]" numberOfLines={1}>
              To: {msg.proposal.to}
            </Text>
          ) : null}
          <Text className="text-ink-mute mt-1 font-mono text-[10px]">
            Network: {msg.proposal.chain}
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              disabled={pending}
              onPress={() => onApprove(msg.proposal!)}
              className="bg-purple flex-1 items-center rounded-xl py-2.5 disabled:opacity-50"
            >
              <Text className="font-mono text-[11px] font-bold text-white">
                {pending ? 'OPENING PRIVY…' : 'REVIEW + SIGN'}
              </Text>
            </Pressable>
            <Pressable
              disabled={pending}
              onPress={() => onCancel(msg.id)}
              className="border-hairline items-center rounded-xl border px-3 py-2.5"
            >
              <X size={15} color="#A09CB8" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function Nova() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const privy = usePrivyBridge();

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
      .then((result) => {
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: 'nova',
            text: result.reply,
            agentId: result.activeAgent,
            trace: result.trace,
            proposal: result.proposal,
          },
        ]);
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

  const cancelProposal = (messageId: string) => {
    haptics.light();
    setMessages((items) =>
      items.map((item) => (item.id === messageId ? { ...item, proposal: undefined } : item)),
    );
  };

  const approveProposal = async (proposal: NovaProposal) => {
    setPendingProposal(proposal.id);
    try {
      const provider = await privy.getWalletProvider();
      const account = privy.walletAddress;
      if (!provider || !account?.startsWith('0x')) {
        throw new Error('Sign in with Privy to approve this wallet action.');
      }
      const hash = await executeNovaProposal(
        provider,
        account as `0x${string}`,
        proposal,
      );
      haptics.success();
      setMessages((items) => [
        ...items.map((item) =>
          item.proposal?.id === proposal.id ? { ...item, proposal: undefined } : item,
        ),
        {
          id: nextId(),
          role: 'nova',
          agentId: 'wallet',
          text: `Privy submitted the approved transaction: ${hash.slice(0, 10)}…`,
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Transaction not submitted',
        error instanceof Error ? error.message : 'The wallet rejected this action.',
      );
    } finally {
      setPendingProposal(null);
    }
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
            3 specialist agents can prepare actions. You review; Privy signs.
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
            <Bubble
              key={m.id}
              msg={m}
              pending={pendingProposal === m.proposal?.id}
              onApprove={(proposal) => void approveProposal(proposal)}
              onCancel={cancelProposal}
            />
          ))}
          {typing ? (
            <View className="bg-surface mb-3 max-w-[60%] self-start rounded-2xl px-4 py-3">
              <Text className="text-ink-mute font-mono text-[14px]">NOVA is typing…</Text>
            </View>
          ) : null}
        </ScrollView>

        {messages.length <= 1 ? (
          <View className="shrink-0">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                gap: 8,
                paddingBottom: 8,
                alignItems: 'center',
              }}
            >
              {NOVA_SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  className="border-hairline bg-surface self-start rounded-full border px-3.5 py-2"
                >
                  <Text numberOfLines={1} className="text-ink-dim font-mono text-[12px]">
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
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
