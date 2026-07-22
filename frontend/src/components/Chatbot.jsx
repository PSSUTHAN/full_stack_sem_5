import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    useEffect(() => {
        // Initial welcome message
        if (messages.length === 0) {
            setMessages([
                {
                    type: 'bot',
                    content: "👋 Welcome to Engineers Veedu! I'm here to help you with information about our construction services, projects, and more.",
                    suggestions: [
                        "What services do you offer?",
                        "How can I get a quote?",
                        "What areas do you serve?",
                        "Tell me about your recent projects"
                    ]
                }
            ]);
        }
    }, [messages.length]);

    const getApiUrl = () => {
        return import.meta.env.VITE_API_URL || 'http://localhost:5000';
    };

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = { type: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            // Artificial delay for better UX
            setTimeout(() => {
                setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
                setIsTyping(false);
            }, 500);

        } catch (error) {
            console.error(error);
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: "I apologize, but I'm having trouble connecting to the server. Please call us at +1 (555) 123-4567."
                }]);
                setIsTyping(false);
            }, 500);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSendMessage(inputValue);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg text-white flex items-center justify-center transition-transform hover:scale-110 z-50 animate-pulse-slow ${isOpen ? 'rotate-90' : 'rotate-0'}`}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-8 w-[350px] md:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-slide-up border border-gray-100 font-sans">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-accent p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <h3 className="font-semibold">Engineers Veedu Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col max-w-[85%] ${msg.type === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                                {msg.suggestions && (
                                    <div className="mt-2 flex flex-col gap-2 w-full">
                                        {msg.suggestions.map((suggestion, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => handleSendMessage(suggestion)}
                                                className="text-xs text-primary border border-primary bg-white px-3 py-2 rounded-full hover:bg-primary hover:text-white transition-colors text-left"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="self-start bg-gray-200 p-3 rounded-2xl rounded-bl-none flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:border-primary px-4 text-sm"
                        />
                        <button
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isTyping}
                            className="bg-primary text-white p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
