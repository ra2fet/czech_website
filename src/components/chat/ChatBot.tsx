import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

const faqs = [
  {
    question: "What are your business hours?",
    answer: "We are open Monday to Friday from 9:00 AM to 6:00 PM EST, Saturday from 10:00 AM to 2:00 PM EST, and closed on Sundays."
  },
  {
    question: "How can I contact support?",
    answer: "You can reach our support team through email at support@company.com or call us at +1 (234) 567-890 during business hours."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Yes, we offer international shipping to most countries. Shipping rates and delivery times vary by location."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for business accounts."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for unused products in their original packaging. Please contact our support team to initiate a return."
  }
];

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);

    // Find matching FAQ
    const matchingFaq = faqs.find(faq => 
      faq.question.toLowerCase().includes(inputValue.toLowerCase()) ||
      inputValue.toLowerCase().includes(faq.question.toLowerCase())
    );

    setTimeout(() => {
      const botMessage = {
        text: matchingFaq 
          ? matchingFaq.answer
          : "I'm sorry, I couldn't find a specific answer to your question. Please contact our support team for more detailed assistance.",
        isUser: false
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-xl w-80 mb-4"
          >
            <div className="bg-primary-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold">Chat Support</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-96 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center">
                  <p>Welcome! How can I help you today?</p>
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Popular questions:</p>
                    {faqs.map((faq, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(faq.question)}
                        className="block w-full text-left text-sm text-primary-600 hover:text-primary-700 mb-2 p-2 rounded hover:bg-gray-50"
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.isUser
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.text} 
                      </div>
                    </div>
                  ))}

                  {!message.isUser && faqs.map((faq, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(faq.question)}
                        className="block w-full text-left text-sm text-primary-600 hover:text-primary-700 mb-2 p-2 rounded hover:bg-gray-50"
                      >
                        {faq.question}
                      </button>
                    )) }
                </div>
                
              
                
                
                
                </div>
              
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSend}
                  className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  );
};