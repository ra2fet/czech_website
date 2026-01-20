import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import config from '../../config'; // Import config

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [localConversations, setLocalConversations] = useState([
    {
      question: "Hello",
      answer: "Hi there! How can I help you today?"
    },
    {
      question: "Hi",
      answer: "Hi there! How can I help you today?"
    },
    {
      question: "Contact",
      answer: "You can reach us at +31-640887984, email us at info@babobamboo.com, or message us on WhatsApp at +31 6 24330577. We're here to help!"
    },
    {
      question: "How are you?",
      answer: "I'm a bot, so I don't have feelings, but I'm ready to assist you!"
    },
    {
      question: "What is your name?",
      answer: "I am a chatbot designed to help you with your questions."
    },
    {
      question: "Thank you",
      answer: "You're welcome! Is there anything else I can help you with?"
    },
    {
      question: "Bye",
      answer: "Goodbye! Have a great day!"
    },
    {
      question: "What can you do?",
      answer: "I can answer frequently asked questions and provide information about our products and services."
    },
    {
      question: "Help",
      answer: "I'm here to help! What do you need assistance with?"
    },
    {
      question: "Can I track my order?",
      answer: "Yes, once your order is shipped, you will receive a tracking number via email."
    },
    {
      question: "Do you have a physical store?",
      answer: "We primarily operate online, but we do have pop-up events. Check our 'Locations' page for updates!"
    },
    {
      question: "What is your privacy policy?",
      answer: "Our privacy policy can be found on our website's footer. It details how we handle your data."
    },
    {
      question: "What is the weather like today?",
      answer: "I am a chatbot and do not have access to real-time weather information. Please check a weather app or website."
    },
    {
      question: "Tell me a joke.",
      answer: "Why don't scientists trust atoms? Because they make up everything!"
    },
    {
      question: "What is the capital of France?",
      answer: "The capital of France is Paris."
    },
    {
      question: "Who created you?",
      answer: "I am a large language model, trained by Rafat Haroub."
    },
    {
      question: "What is the meaning of life?",
      answer: "The meaning of life is a philosophical question that has been debated for centuries. There is no single answer."
    },
    {
      question: "Can you tell me about your company?",
      answer: "We are a company dedicated to providing high-quality products and excellent customer service. You can find more information on our 'About Us' page."
    },
    {
      question: "How do I place an order?",
      answer: "You can place an order by browsing our products, adding them to your cart, and proceeding to checkout."
    },
    {
      question: "What are your shipping options?",
      answer: "We offer standard and express shipping options. Details on rates and delivery times are available during checkout."
    },
    {
      question: "Do you offer discounts?",
      answer: "We occasionally offer promotions and discounts. Please keep an eye on our website and social media for updates!"
    },
    {
      question: "What is your favorite color?",
      answer: "As an AI, I don't have a favorite color, but I find all colors fascinating!"
    },
    {
      question: "How old are you?",
      answer: "I don't have an age in the human sense. I was created recently."
    },
    {
      question: "Are you a robot?",
      answer: "I am an AI, a computer program, not a physical robot."
    },
    {
      question: "Can you learn?",
      answer: "Yes, I am constantly learning and improving based on the data I am trained on."
    },
    {
      question: "What is your purpose?",
      answer: "My purpose is to assist users by providing information and completing tasks."
    },
    {
      question: "What is your favorite food?",
      answer: "As an AI, I don't eat food, but I can help you find recipes!"
    },
    {
      question: "Can you tell me a fun fact?",
      answer: "Did you know that a group of owls is called a parliament?"
    },
    {
      question: "What is the time now?",
      answer: "I don't have real-time clock access, but you can check your device's time."
    },
    {
      question: "How do I give feedback?",
      answer: "You can give feedback by reporting an issue using the /reportbug slash command in the chat."
    },
    {
      question: "What is your favorite animal?",
      answer: "I don't have personal preferences, but I find all animals fascinating!"
    },
    {
      question: "Can you help me with coding?",
      answer: "I can provide information and examples related to coding, but I cannot write or debug code directly."
    },
    {
      question: "What is the weather forecast?",
      answer: "I cannot provide real-time weather forecasts. Please check a dedicated weather service."
    }
  ]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await config.axios.get(config.apiEndpoints.faqs);
        setFaqs(response.data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        // Fallback to local FAQs if API fails
        setFaqs([]); // Clear API FAQs if there's an error
      }
    };
    fetchFaqs();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);

    let botResponse = "I'm sorry, I couldn't find a specific answer to your question. Please contact our support team at +31-640887984, email us at info@babobamboo.com, or reach out via WhatsApp at +31 6 24330577 for more detailed assistance.";

    // Check local conversations first
    const matchingLocal = localConversations.find(conv =>
      conv.question.toLowerCase().includes(inputValue.toLowerCase()) ||
      inputValue.toLowerCase().includes(conv.question.toLowerCase())
    );

    if (matchingLocal) {
      botResponse = matchingLocal.answer;
    } else {
      // Then check API fetched FAQs
      const matchingFaq = faqs.find(faq =>
        faq.question.toLowerCase().includes(inputValue.toLowerCase()) ||
        inputValue.toLowerCase().includes(faq.question.toLowerCase())
      );

      if (matchingFaq) {
        botResponse = matchingFaq.answer;
      }
    }

    setTimeout(() => {
      const botMessage = {
        text: botResponse,
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
            <div className="bg-primary-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm md:text-base">Chat Support</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/60 px-2 py-0.5 text-xs md:text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                  <span className="capitalize">online</span>
                </span>
              </div>
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
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.isUser
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
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
