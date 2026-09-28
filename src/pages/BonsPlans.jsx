import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, Users } from 'lucide-react';

export default function BonsPlans({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // fetch all messages, order by newest
  useEffect(() => {
    const q = query(collection(db, 'bonsplans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    });
    return () => unsubscribe();
  }, []);

  // send a new message to the squad
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'bonsplans'), {
        text: newMessage,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'ajout", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Bons Plans</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
        {/* Liste des messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.userId === user.uid ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.userId === user.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="text-sm font-semibold mb-1 opacity-80">
                  {msg.userId === user.uid ? 'Moi' : msg.userEmail?.split('@')[0]}
                </p>
                <p>{msg.text}</p>
              </div>
              {msg.createdAt && (
                <span className="text-xs text-gray-400 mt-1 mx-2">
                  {msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'À l\'instant'}
                </span>
              )}
            </div>
          ))}
          {messages.length === 0 && <p className="text-center text-gray-500 mt-10">Rien à afficher pour le moment.</p>}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ex: L'entreprise X cherche 3 stagiaires à Angers..."
              className="flex-1 border border-gray-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
