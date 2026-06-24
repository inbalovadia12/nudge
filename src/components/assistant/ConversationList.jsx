import { Plus, MessageCircle, Trash2 } from 'lucide-react';

export default function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNew}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors mb-3"
      >
        <Plus className="w-4 h-4" /> New chat
      </button>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors group cursor-pointer ${activeId === conv.id ? 'bg-surface-2' : 'hover:bg-surface-2/50'}`}
            onClick={() => onSelect(conv.id)}
          >
            <MessageCircle className={`w-4 h-4 flex-shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${activeId === conv.id ? 'text-foreground' : 'text-muted-foreground'}`}>{conv.title}</p>
              {conv.last_message_preview && (
                <p className="text-xs text-muted-foreground/60 truncate">{conv.last_message_preview}</p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/5 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}