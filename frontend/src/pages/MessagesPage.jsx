import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { PaperAirplaneIcon, MapPinIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sellerId = searchParams.get('sellerId');
  const adId = searchParams.get('adId');

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
    if (sellerId && adId) {
      startThread();
    }
  }, [sellerId, adId]);

  useEffect(scrollToBottom, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startThread = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/messages/thread/${sellerId}/${adId}`);
      setActiveConv({ _id: data.conversationId, other: data.seller, ad: { _id: adId } });
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConv = async (conv) => {
    try {
      setLoading(true);
      setActiveConv(conv);
      const { data } = await api.get(`/messages/${conv.conversationId || conv._id}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    try {
      const { data } = await api.post('/messages', {
        receiverId: activeConv.other._id,
        adId: activeConv.ad._id,
        text: inputText
      });
      setMessages([...messages, data]);
      setInputText('');
      fetchConversations(); // refresh sidebar
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-wrapper container-custom flex flex-col md:grid md:grid-cols-[320px_1fr]" style={{ height: 'calc(100vh - 84px)', gap: 0, padding: 0, overflow: 'hidden', background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, margin: '20px auto' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fcfcfd' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontWeight: 800, fontSize: 18 }}>All Chats</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>No active chats yet.</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.conversationId} 
                onClick={() => selectConv(conv)}
                style={{ 
                  padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                  background: activeConv?.conversationId === conv.conversationId ? 'white' : 'transparent',
                  borderLeft: activeConv?.conversationId === conv.conversationId ? '4px solid #3e6fe1' : '4px solid transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    {conv.other.profilePhoto ? (
                      <img src={conv.other.profilePhoto} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <UserCircleIcon style={{ width: 44, height: 44, color: '#9ca3af' }} />
                    )}
                    {conv.unreadCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, background: '#3e6fe1', borderRadius: '50%', border: '2px solid white' }}></span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.other.name}</h4>
                    <p style={{ fontSize: 12, color: conv.unreadCount > 0 ? '#1a1a2e' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: conv.unreadCount > 0 ? 800 : 400 }}>
                      {conv.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to="/messages" className="sm:hidden"><ChevronLeftIcon style={{ width: 24, height: 24 }} /></Link>
                {activeConv.other.profilePhoto ? (
                  <img src={activeConv.other.profilePhoto} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <UserCircleIcon style={{ width: 40, height: 40, color: '#9ca3af' }} />
                )}
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 15 }}>{activeConv.other.name}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#6b7280' }}>
                    <MapPinIcon style={{ width: 12, height: 12 }} /> {activeConv.other.city}
                  </div>
                </div>
              </div>
              {activeConv.ad && (
                <Link to={`/ads/${activeConv.ad._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none' }}>
                  {activeConv.ad.images?.[0] && <img src={activeConv.ad.images[0]} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeConv.ad.title}</span>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', background: '#f7f8fa', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => {
                const isMe = msg.sender._id === user._id || msg.sender === user._id;
                return (
                  <div key={i} className={`chat-bubble ${isMe ? 'sent' : 'received'}`}>
                    {msg.text}
                    <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
                <input 
                  autoFocus
                  className="input-field" 
                  placeholder="Type a message..." 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  style={{ borderRadius: 999, height: 44 }}
                />
                <button type="submit" className="btn-primary" style={{ height: 44, width: 44, padding: 0, justifyContent: 'center', borderRadius: '50%' }}>
                  <PaperAirplaneIcon style={{ width: 20, height: 20 }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: 16 }}>
            <ChatBubbleLeftRightIcon style={{ width: 80, height: 80, color: '#f3f4f6' }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>Welcome to OLX Chats</h3>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Select a conversation to start messaging sellers or buyers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
