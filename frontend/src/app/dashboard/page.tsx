"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useSocket } from "@/context/SocketContext";
import SharedCanvas from "@/components/SharedCanvas";
import { getBackendUrl } from "@/lib/backend";

type ChatTarget = {
  id: string;
  label: string;
  detail: string;
  kind: "channel" | "friend";
  color: string;
};

type ChatMessage = {
  roomId: string;
  sender: string;
  messageText: string;
  timestamp: string;
};

type AuthUser = {
  id: string;
  username: string;
  email: string;
};

type Moment = {
  id: string;
  name: string;
  handle: string;
  time: string;
  initials: string;
  avatar: string;
  image: string;
  title: string;
  likes: string;
  comments: string;
  comment: string;
};

const channels: ChatTarget[] = [
  { id: "general", label: "general", detail: "The everyday room", kind: "channel", color: "bg-lime-300" },
  { id: "announcements", label: "announcements", detail: "News from the crew", kind: "channel", color: "bg-orange-300" },
  { id: "film-club", label: "film-club", detail: "Watchlist and reviews", kind: "channel", color: "bg-sky-300" },
];

const friends: ChatTarget[] = [
  { id: "maya", label: "Maya Chen", detail: "Active now", kind: "friend", color: "bg-fuchsia-300" },
  { id: "jules", label: "Jules Okafor", detail: "Active 12m ago", kind: "friend", color: "bg-yellow-200" },
  { id: "noah", label: "Noah Williams", detail: "Active 1h ago", kind: "friend", color: "bg-cyan-300" },
];

const initialMoments: Moment[] = [];

function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-slate-900 ${color} ${small ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"}`}>
      {initials}
    </span>
  );
}

function Rail() {
  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-white/5 bg-[#151a1a] py-5 text-white shadow-[12px_0_40px_rgba(15,22,20,0.08)] md:flex">
      <button className="mb-6 flex h-11 w-11 items-center justify-center rounded-[15px] bg-lime-300 text-lg font-black text-slate-900 transition-transform hover:scale-105" aria-label="Pulse Hub home">
        p
      </button>
      <div className="flex flex-col items-center gap-3">
        {["bg-lime-300", "bg-orange-300", "bg-sky-300", "bg-fuchsia-300"].map((color, index) => (
          <button key={color} className={`h-11 w-11 rounded-full border-2 border-transparent ${color} text-xs font-black text-slate-900 transition-all hover:rounded-[15px] hover:border-white/60`} aria-label={`Community ${index + 1}`}>
            {index === 0 ? "PX" : index === 1 ? "C" : index === 2 ? "R" : "M"}
          </button>
        ))}
      </div>
      <div className="my-5 h-px w-8 bg-white/10" />
      <button className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/30 text-xl text-white/60 hover:border-lime-300 hover:text-lime-300" aria-label="Add community">
        +
      </button>
      <div className="mt-auto flex flex-col items-center gap-4">
        <button className="text-lg text-white/50 hover:text-white" aria-label="Settings">•••</button>
        <Avatar initials="AK" color="bg-white" />
      </div>
    </aside>
  );
}

function ContextSidebar({ selectedId, onSelect }: { selectedId: string | null; onSelect: (target: ChatTarget) => void }) {
  return (
    <aside className="w-full shrink-0 border-b border-[#d9ddd4] bg-[#f4f5ef]/95 px-5 py-5 backdrop-blur md:w-64 md:border-b-0 md:border-r md:px-4 lg:w-72">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Your space</p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900">The Commons</h1>
        </div>
        <button className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-white hover:text-slate-900" aria-label="More space options">•••</button>
      </div>

      <div className="mb-6 rounded-xl border border-[#dde1d8] bg-white/80 p-3 shadow-[0_8px_24px_rgba(34,44,35,0.05)]">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
          <span>COMMUNITY ONLINE</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">A small corner for big ideas, good links, and daily moments.</p>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Channels</h2>
          <button className="text-lg leading-none text-slate-400 hover:text-slate-900" aria-label="Add channel">+</button>
        </div>
        <div className="space-y-1">
          {channels.map((channel) => (
            <button key={channel.id} onClick={() => onSelect(channel)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${selectedId === channel.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`}>
              <span className="text-base font-light text-slate-400">#</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{channel.label}</span>
              {selectedId === channel.id && <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Direct messages</h2>
          <button className="text-lg leading-none text-slate-400 hover:text-slate-900" aria-label="Start direct message">+</button>
        </div>
        <div className="space-y-1">
          {friends.map((friend) => (
            <button key={friend.id} onClick={() => onSelect(friend)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${selectedId === friend.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`}>
              <span className="relative"><Avatar initials={friend.label.split(" ").map((name) => name[0]).join("")} color={friend.color} small /><span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#f5f6f1] bg-lime-400" /></span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{friend.label}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function MomentCard({ moment }: { moment: (typeof initialMoments)[number] }) {
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([moment.comment]);

  const renderMentionText = (text: string) => text.split(/(@\[[\w.-]+\])/g).map((part, index) => part.match(/^@\[[\w.-]+\]$/) ? <span key={`${part}-${index}`} className="font-bold text-lime-700">{part}</span> : part);

  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextComment = commentText.trim();
    if (!nextComment) return;
    setComments((current) => [...current, `you ${nextComment}`]);
    setCommentText("");
  };

  return (
    <article className="group overflow-hidden rounded-[20px] border border-[#dfe3db] bg-white/95 shadow-[0_12px_34px_rgba(34,44,35,0.07)] transition-shadow hover:shadow-[0_18px_45px_rgba(34,44,35,0.11)]">
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar initials={moment.initials} color={moment.avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{moment.name}</p>
          <p className="text-xs text-slate-400">{moment.handle} · {moment.time}</p>
        </div>
        <button className="text-lg text-slate-400 hover:text-slate-900" aria-label="Moment options">•••</button>
      </div>
      <div className={`relative mx-3 aspect-[1.35] overflow-hidden rounded-[14px] bg-gradient-to-br ${moment.image} transition-transform duration-500 group-hover:scale-[1.01]`}>
        <div className="absolute -right-10 top-8 h-44 w-44 rounded-full border-[26px] border-white/30" />
        <div className="absolute bottom-[-35px] left-8 h-32 w-64 rotate-[-12deg] rounded-[50%] bg-white/30 blur-sm" />
        <span className="absolute bottom-4 left-4 rounded-md bg-white/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 backdrop-blur-sm">Moment / 0{moment.id === "market-morning" ? "1" : "2"}</span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <p className="text-sm leading-6 text-slate-700">{moment.title}</p>
        <div className="mt-4 flex items-center gap-5 text-xs font-semibold text-slate-500">
          <button onClick={() => setLiked((current) => !current)} className={`flex items-center gap-1.5 ${liked ? "text-rose-500" : "hover:text-rose-500"}`} aria-label={`Like moment, ${moment.likes} likes`}><span className="text-xl leading-none">{liked ? "♥" : "♡"}</span>{Number(moment.likes) + (liked ? 1 : 0)}</button>
          <button className="flex items-center gap-1.5 hover:text-slate-900" aria-label={`Comment, ${moment.comments} comments`}><span className="text-lg leading-none">◌</span>{moment.comments}</button>
          <button className="ml-auto text-lg text-slate-400 hover:text-slate-900" aria-label="Share moment">↗</button>
        </div>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {comments.map((comment, index) => <p key={`${comment}-${index}`}><span className="font-bold text-slate-800">{comment.split(" ")[0]}</span>{" "}{renderMentionText(comment.split(" ").slice(1).join(" "))}</p>)}
          <form onSubmit={addComment} className="flex items-center gap-2 pt-1">
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment or @[username]" className="min-w-0 flex-1 bg-transparent py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400" />
            <button type="submit" className="text-[10px] font-bold uppercase tracking-wider text-lime-700 hover:text-slate-900">Post</button>
          </form>
        </div>
      </div>
    </article>
  );
}

function PostComposer({ user, onPost }: { user: AuthUser; onPost: (caption: string) => void }) {
  const [caption, setCaption] = useState("");

  const submitPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caption.trim()) return;
    onPost(caption.trim());
    setCaption("");
  };

  return (
    <form onSubmit={submitPost} className="mb-6 rounded-[20px] border border-[#dfe3db] bg-white/90 p-5 shadow-[0_10px_28px_rgba(34,44,35,0.05)]">
      <div className="flex items-start gap-3">
        <Avatar initials={user.username.slice(0, 2).toUpperCase()} color="bg-lime-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Share a moment, {user.username}</p>
          <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={2} placeholder="What is moving through your world? Use @[username] to mention someone." className="mt-2 w-full resize-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Public to The Commons</span>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-lime-600">Publish moment</button>
      </div>
    </form>
  );
}

function ChatWindow({ target, messages, onBack, onSend }: { target: ChatTarget; messages: ChatMessage[]; onBack: () => void; onSend: (messageText: string) => void }) {
  const [message, setMessage] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);
  const isChannel = target.kind === "channel";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const messageText = message.trim();

    if (!messageText) {
      return;
    }

    onSend(messageText);
    setMessage("");
  };

  return (
    <section className="flex min-h-[620px] flex-1 flex-col overflow-hidden rounded-[20px] border border-[#dfe3db] bg-white/95 shadow-[0_12px_34px_rgba(34,44,35,0.07)]">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button onClick={onBack} className="mr-1 text-xl text-slate-400 hover:text-slate-900 md:hidden" aria-label="Back to Moments">←</button>
        {isChannel ? <span className="text-2xl font-light text-slate-400">#</span> : <Avatar initials={target.label.split(" ").map((name) => name[0]).join("")} color={target.color} small />}
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">{target.label}</h2>
          <p className="text-xs text-slate-400">{isChannel ? target.detail : "Usually replies in a few minutes"}</p>
        </div>
        <button onClick={() => setShowCanvas((current) => !current)} className={`rounded-lg px-2 py-1 text-xs font-bold ${showCanvas ? "bg-lime-300 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}`} aria-label="Toggle shared canvas">Canvas</button>
        <button className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900" aria-label="Chat options">•••</button>
      </header>
      <div className="flex flex-1 flex-col justify-end gap-5 overflow-y-auto bg-[#fcfcfa] p-5">
        {showCanvas && <SharedCanvas roomId={target.id} />}
        <div className="mx-auto mb-auto py-12 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isChannel ? target.color : "bg-slate-900 text-white"} text-xl font-black ${isChannel ? "text-slate-900" : ""}`}>{isChannel ? "#" : target.label.slice(0, 1)}</div>
          <p className="text-sm font-bold text-slate-900">{isChannel ? `Welcome to #${target.label}` : `A quiet place for you and ${target.label.split(" ")[0]}`}</p>
          <p className="mt-1 text-xs text-slate-400">{isChannel ? "This is the beginning of the conversation." : "Send a note to start the conversation."}</p>
        </div>
        <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">{isChannel ? "Anyone up for sharing a highlight from today?" : "Hey! I saw your latest Moment. So good."}</div>
        <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-6 text-white">I am in. Let me find something worth sharing.</div>
        {messages.map((chatMessage) => (
          <div key={`${chatMessage.timestamp}-${chatMessage.sender}`} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${chatMessage.sender === "currentUser" ? "self-end rounded-br-md bg-lime-300 text-slate-900" : "self-start rounded-bl-md bg-slate-100 text-slate-700"}`}>
            {chatMessage.messageText}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-slate-100 p-4">
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Message ${isChannel ? `#${target.label}` : target.label.split(" ")[0]}`} className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-lime-300 placeholder:text-slate-400 focus:ring-2" />
        <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-lg font-bold text-slate-900 hover:bg-lime-400" aria-label="Send message">↗</button>
      </form>
    </section>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null);
  const [feedMoments, setFeedMoments] = useState(initialMoments);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { socket, isConnected } = useSocket();
  const apiUrl = getBackendUrl();

  useEffect(() => {
    const savedUser = window.localStorage.getItem("pulse-user");
    if (savedUser) {
      startTransition(() => setUser(JSON.parse(savedUser) as AuthUser));
    }
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !selectedTarget) {
      return;
    }

    socket.emit("join_room", selectedTarget.id);
  }, [socket, isConnected, selectedTarget]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiUrl}/api/posts/feed`)
      .then((response) => response.ok ? response.json() as Promise<{ items: Array<{ _id: string; author: string; caption?: string; timestamp: string; likes?: string[]; comments?: unknown[] }> }> : Promise.reject(new Error("Feed unavailable")))
      .then((data) => {
        if (cancelled) return;
        setFeedMoments(data.items.map((post) => ({
          id: post._id,
          name: typeof post.author === "string" ? post.author : "Pulse member",
          handle: "@member",
          time: new Date(post.timestamp).toLocaleDateString(),
          initials: "PH",
          avatar: "bg-lime-300",
          image: "from-lime-200 via-emerald-100 to-sky-200",
          title: post.caption ?? "",
          likes: String(post.likes?.length ?? 0),
          comments: String(post.comments?.length ?? 0),
          comment: "",
        })));
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [apiUrl]);

  useEffect(() => {
    if (!selectedTarget) {
      return;
    }

    let cancelled = false;
    fetch(`${apiUrl}/api/rooms/${selectedTarget.id}/messages`)
      .then((response) => response.ok ? response.json() as Promise<ChatMessage[]> : Promise.reject(new Error("Messages unavailable")))
      .then((roomMessages) => {
        if (!cancelled) setMessages((current) => [...current.filter((message) => message.roomId !== selectedTarget.id), ...roomMessages]);
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [apiUrl, selectedTarget]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleReceiveMessage = (incomingMessage: ChatMessage) => {
      if (!selectedTarget || incomingMessage.roomId !== selectedTarget.id) {
        return;
      }

      setMessages((currentMessages) => [...currentMessages, incomingMessage]);
    };

    socket.on("receive_msg", handleReceiveMessage);

    return () => {
      socket.off("receive_msg", handleReceiveMessage);
    };
  }, [socket, selectedTarget]);

  const handleSendMessage = (messageText: string) => {
    if (!socket || !isConnected || !selectedTarget) {
      return;
    }

    socket.emit("send_msg", selectedTarget.id, user?.id, messageText);
  };

  const handleCreatePost = async (caption: string) => {
    if (!user) return;
    const response = await fetch(`${apiUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: user.id, caption, mediaUrls: [] }),
    });
    if (response.ok) {
      const post = await response.json() as { _id: string; timestamp: string; caption: string };
      setFeedMoments((current) => [{ id: post._id, name: user.username, handle: `@${user.username}`, time: "Just now", initials: user.username.slice(0, 2).toUpperCase(), avatar: "bg-lime-300", image: "from-lime-200 via-emerald-100 to-sky-200", title: post.caption, likes: "0", comments: "0", comment: "" }, ...current]);
    }
  };

  return (
    <main className="min-h-screen bg-[#e9ebe5] text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Rail />
        <ContextSidebar selectedId={selectedTarget?.id ?? null} onSelect={setSelectedTarget} />
        <section className="min-w-0 flex-1 px-4 py-5 sm:px-8 lg:px-14 lg:py-10">
          <div className="mx-auto max-w-3xl">
            <header className="mb-7 flex items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                  <span>Friday, October 18</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-lime-700">Pulse Hub</span>
                </div>
                <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">{selectedTarget ? selectedTarget.kind === "channel" ? `#${selectedTarget.label}` : selectedTarget.label : "Moments"}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider sm:flex ${isConnected ? "border-lime-200 bg-lime-50 text-lime-700" : "border-slate-200 bg-white/70 text-slate-400"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-lime-500" : "bg-slate-300"}`} />
                  {isConnected ? "Live" : "Offline"}
                </span>
                <button onClick={() => setSelectedTarget(null)} className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${selectedTarget ? "border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900" : "border-slate-900 bg-slate-900 text-white"}`}>Feed</button>
              </div>
            </header>
            {selectedTarget ? <ChatWindow target={selectedTarget} messages={messages.filter((message) => message.roomId === selectedTarget.id)} onBack={() => setSelectedTarget(null)} onSend={handleSendMessage} /> : user ? <div><PostComposer user={user} onPost={handleCreatePost} /><div className="space-y-6">{feedMoments.map((moment) => <MomentCard key={moment.id} moment={moment} />)}</div></div> : <div className="rounded-[20px] border border-[#dfe3db] bg-white/90 p-8 text-center shadow-[0_10px_28px_rgba(34,44,35,0.05)]"><p className="text-sm font-bold text-slate-900">Sign in to share your world.</p><a href="/login" className="mt-4 inline-block rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">Open sign in</a></div>}
          </div>
        </section>
      </div>
    </main>
  );
}