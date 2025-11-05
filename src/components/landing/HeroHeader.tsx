
'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const MotionButton = motion(Button);

const HeroVisual = () => {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  const parallaxStyle = shouldReduceMotion ? {} : { y };

  return (
    <motion.div
      style={parallaxStyle}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
      className="relative flex items-center justify-center"
    >
      {/* Background slab with gradient */}
      <div className="absolute inset-0 bg-white dark:bg-gray-900/50 rounded-full blur-3xl" />
      <div className="absolute inset-10 bg-gradient-to-br from-cyan-200/20 via-purple-200/20 to-blue-200/20 rounded-full blur-2xl" />

      {/* Main Image */}
      <Image
        src="/hero/brain.svg"
        alt="Abstract illustration of a glowing brain representing AI-powered learning"
        width={640}
        height={640}
        className="relative object-contain w-full max-w-[520px] lg:max-w-[640px]"
        priority
      />

      {/* Decorative Particles - aria-hidden */}
      <motion.div aria-hidden className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-300/50 rounded-full" animate={{ y: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.div aria-hidden className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-cyan-300/50 rounded-full" animate={{ x: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />
    </motion.div>
  );
};

export default function HeroHeader() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const ringsBg = `url('data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3e%3ccircle cx="50" cy="50" r="40" stroke="%23B995FF" stroke-width="0.1" fill="none"/%3e%3c/svg%3e')`;

  return (
    <header className="relative overflow-hidden bg-white dark:bg-gray-950">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/30 via-white to-blue-100/30 dark:from-cyan-900/10 dark:via-gray-950 dark:to-blue-900/10" />
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.03]" 
          style={{ backgroundImage: ringsBg }}
        />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="lg:col-span-6 text-center lg:text-left">
            <motion.p variants={itemVariants} className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
              CognoPath AI
            </motion.p>
            <motion.h1
              variants={itemVariants}
              className="text-black dark:text-white text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[0.95] tracking-tight"
            >
              QUALITY LEARNING<br />WITH COGNOPATH
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-6 text-lg sm:text-xl text-neutral-700 dark:text-neutral-300 max-w-lg mx-auto lg:mx-0">
              Fast, accurate and adaptive exam prep with confidence calibration, strategy tracking and personalized practice.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <MotionButton asChild size="lg" className="bg-accent hover:bg-accent/90 text-black font-bold">
                <Link to="/auth">Get Started</Link>
              </MotionButton>
              <MotionButton asChild size="lg" variant="ghost">
                <Link to="/demo">Watch Demo</Link>
              </MotionButton>
            </motion.div>
            <motion.p variants={itemVariants} className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 text-center lg:text-left">
              HIPAA & GDPR aligned. Privacy-first by design.
            </p>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center">
            <HeroVisual />
          </div>
        </motion.div>
      </div>
    </header>
  );
}
