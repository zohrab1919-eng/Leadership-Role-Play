export default function ChatBubble({ role, content, name }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isUser ? 'bg-amber text-navy' : 'bg-white/20 text-white'
      }`}>
        {name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <p className={`text-[11px] text-white/40 mb-1 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
          {name}
        </p>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-amber text-navy rounded-br-none font-medium'
            : 'bg-white/10 text-white rounded-bl-none'
        }`}>
          {content}
        </div>
      </div>
    </div>
  );
}
