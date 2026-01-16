import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../utils/api';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hi! I\'m your school assistant. How can I help you today? 👋',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const commonQuestions = [
    'About the school',
    'Admission process',
    'Fees structure',
    'Contact us',
    'Facilities',
    'Contact information'
  ];

  const getBotResponse = async (userMessage) => {
    try {
      const response = await api.post('/chat', {
        message: userMessage
      }).catch(() => null);
      
      if (response?.data) {
        return response.data.response || getLocalResponse(userMessage);
      }
      return getLocalResponse(userMessage);
    } catch (error) {
      console.error('Chat error:', error);
      return getLocalResponse(userMessage);
    }
  };

  const getLocalResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    const responses = {
      'about': 'Sadhana Memorial School is a premier educational institution dedicated to nurturing young minds with quality education and holistic development.',
      'admission': 'For admission inquiries, please contact our admissions office at admission@sadhanamemorialschool.edu or call 040-XXXX-XXXX',
      'fees': 'Our fee structure varies by class. Please visit the Fees section on the dashboard or contact our office for detailed information.',
      'contact': 'Contact us at: Email: office@sadhanamemorialschool.edu | Phone: 040-XXXX-XXXX | Address: Hyderabad, Telangana',
      'facilities': 'We offer excellent facilities including science labs, computer labs, sports grounds, library, and more!',
      'principal': 'Our Principal is Gorla Lakshmin Devi, Vice Principal is Gorla Rajulu, and Academic Coordinator is Gorla Ramna.',
      'timings': 'School timings are generally 8:00 AM to 2:30 PM. Please contact for exact timings for your class.',
      'transport': 'Yes, we provide transport facilities across Hyderabad. Contact our office for route and fare information.',
      'sports': 'We have excellent sports programs including cricket, badminton, athletics, and more!',
      'default': 'I\'m here to help! Ask me about admissions, fees, facilities, contact information, or anything else about our school.'
    };

    for (const [key, response] of Object.entries(responses)) {
      if (key !== 'default' && msg.includes(key)) {
        return response;
      }
    }
    
    return responses.default;
  };

  const handleSendMessage = async (e) => {
    // Prevent form submission and page navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setLoading(true);

    // Simulate bot response delay
    setTimeout(async () => {
      const botResponse = await getBotResponse(messageText);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 500);
  };

  const handleQuickQuestion = async (question) => {
    const userMessage = {
      id: messages.length + 1,
      text: question,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    setTimeout(async () => {
      const botResponse = await getBotResponse(question);
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col z-40 border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">School Assistant</h3>
              <p className="text-sm text-emerald-100">Ask me anything!</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user'
                      ? 'text-emerald-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">Quick Questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {commonQuestions.slice(0, 4).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-900 dark:text-white rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form 
            onSubmit={handleSendMessage}
            className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-2"
          >
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              type="submit"
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-39"
        title="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
};

export default ChatBot;
