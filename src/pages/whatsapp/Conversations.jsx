import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

function WhatsAppConversations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [Step 1] Fetching all contacts from /api/Contacts/getcontacts');
      
      // Step 1: Get all contacts - try without parameters first, then with channelName if needed
      let contactsRes;
      try {
        contactsRes = await whatsappService.contacts.getAll();
      } catch (e) {
        console.log('First attempt failed, trying with channelName=WHATSAPP...');
        contactsRes = await whatsappService.contacts.getAll({ channelName: 'WHATSAPP' });
      }
      console.log('📥 [Step 1] Contacts Response:', contactsRes.data);

      let allContacts = [];
      
      if (contactsRes.data?.dataObj) {
        allContacts = Array.isArray(contactsRes.data.dataObj) ? contactsRes.data.dataObj : [contactsRes.data.dataObj];
      } else if (Array.isArray(contactsRes.data)) {
        allContacts = contactsRes.data;
      } else if (contactsRes.data?.data) {
        allContacts = Array.isArray(contactsRes.data.data) ? contactsRes.data.data : [contactsRes.data.data];
      }

      console.log(`✅ Found ${allContacts.length} contacts`);

      // Step 2: For each contact, get their messages
      const conversationsWithMessages = [];
      
      for (let i = 0; i < Math.min(allContacts.length, 15); i++) { // Limit to 15 to avoid rate limits
        const contact = allContacts[i];
        const phone = contact.contactNo || contact.ContactNo || contact.phone;
        
        if (!phone) continue;
        
        try {
          console.log(`🔍 [Step 2] Fetching messages for ${phone}`);
          // Using both required parameters based on API error
          const messagesRes = await whatsappService.messages.getAll({ 
            contactNo: phone,
            channelName: 'WHATSAPP'
          });
          
          const lastMessage = messagesRes.data?.dataObj?.[0] || messagesRes.data?.[0] || {};
          
          conversationsWithMessages.push({
            id: contact.id || i + 1,
            name: contact.contactName || contact.ContactName || contact.name || `Contact ${i+1}`,
            phone: phone,
            lastMessage: lastMessage.message || lastMessage.body || lastMessage.msgText || "No messages yet",
            timestamp: lastMessage.timestamp || lastMessage.createdAt || new Date().toISOString(),
            unread: 0,
            avatar: `https://i.pravatar.cc/128?u=${phone}`,
            status: 'online',
            isActive: true,
            rawContact: contact,
            rawMessages: messagesRes.data
          });
        } catch (msgErr) {
          console.warn(`Failed to fetch messages for ${phone}:`, msgErr.message);
          // Still add the contact even if messages fail
          conversationsWithMessages.push({
            id: contact.id || i + 1,
            name: contact.contactName || contact.ContactName || contact.name || `Contact ${i+1}`,
            phone: phone,
            lastMessage: "No messages yet",
            timestamp: new Date().toISOString(),
            unread: 0,
            avatar: `https://i.pravatar.cc/128?u=${phone}`,
            status: 'offline',
            isActive: true,
            rawContact: contact
          });
        }
      }

      setConversations(conversationsWithMessages);
      
      if (conversationsWithMessages.length > 0 && !selectedChat) {
        setSelectedChat(conversationsWithMessages[0]);
      }

      if (conversationsWithMessages.length === 0) {
        console.warn('⚠️ No contacts found from /api/Contacts/getcontacts');
        setError('No contacts found in your WhatsApp account.');
        toast.warning('No contacts found');
      } else {
        toast.success(`Loaded ${conversationsWithMessages.length} contacts with message history`);
      }
    } catch (err) {
      console.error('❌ Failed to fetch conversations:', err.response?.data || err.message);
      setError(`API Error: ${err.response?.status || 'Unknown'} - Check console for details`);
      toast.error('Failed to fetch real conversations from Nosnia API');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedChat]);

  const fetchMessages = useCallback(async (chat) => {
    if (!chat) return;
    setLoadingMessages(true);

    try {
      console.log(`📨 [Messages] Fetching for ${chat.phone} using channelName=WHATSAPP`);
      
      // Use same parameters that worked for contacts
      const res = await whatsappService.messages.getAll({ 
        contactNo: chat.phone,
        channelName: 'WHATSAPP'
      });
      
      console.log('📬 [Messages] Response for this contact:', res.data);

      let realMessages = [];
      
      if (res.data?.dataObj) {
        realMessages = Array.isArray(res.data.dataObj) ? res.data.dataObj : [res.data.dataObj];
      } else if (Array.isArray(res.data)) {
        realMessages = res.data;
      } else if (res.data?.data) {
        realMessages = Array.isArray(res.data.data) ? res.data.data : [];
      }

      console.log(`✅ Found ${realMessages.length} messages for this contact`);

      if (realMessages.length > 0) {
        const formattedMessages = realMessages.map((m, i) => ({
          id: m.id || Date.now() + i,
          text: m.message || m.body || m.msgText || m.text || JSON.stringify(m).substring(0, 100),
          isSender: !!(m.fromMe || m.isSender || m.outgoing),
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "Now"
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([{
          id: 1,
          text: "No message history found for this contact in the API response.",
          isSender: false,
          time: "Now"
        }]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch messages:', err.response?.data || err.message);
      setMessages([{
        id: 1,
        text: "Could not load message history. API returned error.",
        isSender: false,
        time: "Now"
      }]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat, fetchMessages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      isSender: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    toast.success('Message sent (demo mode)');
  };

  const filteredConversations = activeTab === 'active' 
    ? conversations.filter(c => c.isActive)
    : conversations;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex flex-1 overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-xl">Conversations</h2>
              <div className="flex gap-2 mt-4">
                {['all', 'active'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-1 text-sm rounded-2xl transition-all ${
                      activeTab === tab 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab === 'all' ? 'All' : 'Active'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="text-6xl mb-6">📭</div>
                  <div className="font-medium text-lg mb-2">No Conversations Found</div>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    The Nosnia API did not return any live contacts or conversations.<br/>
                    Make sure you have active WhatsApp chats or approved templates.
                  </p>
                  <button
                    onClick={fetchConversations}
                    className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm hover:bg-indigo-700"
                  >
                    Retry API Call
                  </button>
                </div>
              ) : (
                filteredConversations.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all ${
                      selectedChat?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <img src={chat.avatar} className="w-11 h-11 rounded-2xl" alt={chat.name} />
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-baseline">
                          <div className="font-medium text-[15px] truncate">{chat.name}</div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(chat.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {chat.lastMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[#f8f9fb] dark:bg-gray-950">
            {selectedChat ? (
              <>
                <div className="h-16 border-b bg-white dark:bg-gray-900 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={selectedChat.avatar} className="w-9 h-9 rounded-2xl" />
                    <div>
                      <div className="font-semibold">{selectedChat.name}</div>
                      <div className="text-xs flex items-center gap-1.5 text-emerald-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedChat.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{selectedChat.phone}</div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-7">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isSender ? 'justify-end' : ''}`}>
                      <div className={`max-w-[65%] px-6 py-3.5 rounded-3xl text-[15px] leading-relaxed ${
                        msg.isSender 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 shadow-sm rounded-bl-none'
                      }`}>
                        {msg.text}
                        <div className={`text-[10px] mt-2 opacity-70 ${msg.isSender ? 'text-right' : ''}`}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-white dark:bg-gray-900 border-t">
                  <div className="flex gap-3">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[15px]"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-10 rounded-3xl font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a conversation from the left
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppConversations;
