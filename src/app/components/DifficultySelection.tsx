import { ArrowLeft, Zap, Brain, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface DifficultySelectionProps {
  players: 1 | 2;
  onDifficultySelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onBack: () => void;
}

export function DifficultySelection({ players, onDifficultySelect, onBack }: DifficultySelectionProps) {
  return (
    <div className="size-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl w-full">
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 sm:mb-12 transition-colors font-medium group px-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Nazad na izbor moda</span>
          <span className="sm:hidden">Nazad</span>
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12 px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4">
            Izaberite Težinu
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 font-medium">
            {players === 1 ? 'Odaberite nivo izazova za svoju igru' : 'Izaberite težinu za vaš meč'}
          </p>
        </motion.div>

        {/* Difficulty Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-4">
          {/* Easy */}
          <motion.button
            onClick={() => onDifficultySelect('easy')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 text-center hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-400 overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">Lako</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                Jednostavne fraze i direktna pitanja za početnike
              </p>
              <div className="flex gap-2 justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </motion.button>

          {/* Medium */}
          <motion.button
            onClick={() => onDifficultySelect('medium')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 text-center hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-amber-400 overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                whileHover={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">Srednje</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                Umereni izazov sa složenijim frazama
              </p>
              <div className="flex gap-2 justify-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </motion.button>

          {/* Hard */}
          <motion.button
            onClick={() => onDifficultySelect('hard')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 text-center hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-rose-400 overflow-hidden sm:col-span-2 md:col-span-1"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">Teško</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                Složene fraze za iskusne detektive
              </p>
              <div className="flex gap-2 justify-center">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
