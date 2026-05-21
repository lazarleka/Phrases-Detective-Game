import { User, Users, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ModeSelectionProps {
  onModeSelect: (players: 1 | 2) => void;
}

export function ModeSelection({ onModeSelect }: ModeSelectionProps) {
  return (
    /* Promenjeno u min-h-screen i w-full kako bi garantovano išlo preko celog ekrana */
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/30"
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {/* Lupa ikonica unutar animiranog diva */}
            <Search className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-3">
            Phrases Detective
          </h1>
          <p className="text-base text-slate-600 font-medium px-2">
            Istražite značenja engleskih fraza i idioma
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="space-y-5">
          {/* Solo Mode */}
          <motion.button
            onClick={() => onModeSelect(1)}
            className="w-full group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 active:border-blue-500 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

            <div className="relative z-10 flex items-center gap-5">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                transition={{ duration: 0.6 }}
              >
                <User className="w-8 h-8 text-white" />
              </motion.div>

              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Solo Igra</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Testirajte svoje znanje samostalno
                </p>
              </div>

              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>

          {/* Versus Mode */}
          <motion.button
            onClick={() => onModeSelect(2)}
            className="w-full group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 active:border-purple-500 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>

            <div className="relative z-10 flex items-center gap-5">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                transition={{ duration: 0.6 }}
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>

              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Protiv Prijatelja</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Takmičite se sa prijateljem
                </p>
              </div>

              <svg className="w-6 h-6 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        </div>

        {/* Footer Info */}
        <motion.div
          className="text-center mt-8 text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs leading-relaxed"> Odgovorite tačno i osvojite poene<br/> 30 sekundi po pitanju</p>
        </motion.div>
      </div>
    </div>
  );
}