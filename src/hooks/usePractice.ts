import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import type { PracticeItem, Explanation, Option } from '@/types/practice';
import { 
  invokeAdaptiveSelectNext, 
  insertAttempt, 
  invokeRecordReward,
  invokeFetchExplanation
} from '@/lib/functions';

type PracticeState = 'loading' | 'presenting' | 'submitting' | 'verdict' | 'error';

export function usePractice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [state, setState] = useState<PracticeState>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [examName, setExamName] = useState<string>('');
  const [currentItem, setCurrentItem] = useState<PracticeItem | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [freeResponse, setFreeResponse] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Timers
  const startTs = useRef<number>(0);
  const firstActionTs = useRef<number | null>(null);

  // Session stats
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState(0);

  const avgTimeMs = questionCount > 0 ? Math.round(totalTimeMs / questionCount) : 0;
  const accuracy = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0;

  // Initialize
  const init = useCallback(async () => {
    setState('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      // Get active exam
      const { data: enrollment } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, exams(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!enrollment) {
        toast({
          title: 'No Active Course',
          description: 'Please select an active course to start practice.',
          variant: 'destructive'
        });
        setState('error');
        return;
      }

      setExamId(enrollment.exam_id);
      setExamName((enrollment.exams as any)?.name || 'Course');

      await loadNext(user.id, enrollment.exam_id);
    } catch (error) {
      console.error('Init error:', error);
      toast({
        title: 'Initialization Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setState('error');
    }
  }, [navigate, toast]);

  // Load next question
  const loadNext = useCallback(async (uid?: string, eid?: string) => {
    const targetUserId = uid || userId;
    const targetExamId = eid || examId;

    if (!targetUserId || !targetExamId) return;

    setState('loading');
    try {
      const response = await invokeAdaptiveSelectNext({ 
        user_id: targetUserId, 
        mode: 'practice' 
      });

      const q = response.question;
      if (!q) throw new Error('No question returned');

      // Transform to PracticeItem
      const optionsArray: Option[] = [];
      if (q.options && typeof q.options === 'object') {
        Object.entries(q.options).forEach(([key, text]) => {
          optionsArray.push({ key, text: text as string });
        });
      }

      const item: PracticeItem = {
        item_id: q.id,
        exam_id: targetExamId,
        type: optionsArray.length > 0 ? 'MCQ' : 'FREE_RESPONSE',
        stem_md: q.text || q.stem || 'Question text',
        options: optionsArray.length > 0 ? optionsArray : null,
        correct_key: q.correct_option || q.correct_key || null,
        concept_tags: q.concept_tag ? [q.concept_tag] : []
      };

      setCurrentItem(item);
      setSelectedKey('');
      setFreeResponse('');
      setConfidence(null);
      setExplanation(null);
      setIsCorrect(null);
      startTs.current = Date.now();
      firstActionTs.current = null;
      setState('presenting');

      track('practice_item_loaded', { 
        item_id: item.item_id, 
        exam_id: targetExamId,
        type: item.type
      });
    } catch (error) {
      console.error('Load next error:', error);
      toast({
        title: 'Failed to Load Question',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setState('error');
    }
  }, [userId, examId, toast]);

  // Track first action
  const onFirstAction = useCallback(() => {
    if (!firstActionTs.current) {
      firstActionTs.current = Date.now();
      track('first_action', { 
        item_id: currentItem?.item_id,
        time_to_first_ms: firstActionTs.current - startTs.current
      });
    }
  }, [currentItem]);

  // Submit answer
  const submit = useCallback(async () => {
    if (!currentItem || !userId || !examId) return;
    if (state !== 'presenting') return;

    setState('submitting');

    try {
      const endTs = Date.now();
      const timeTakenMs = endTs - startTs.current;
      const timeToFirstActionMs = firstActionTs.current ? firstActionTs.current - startTs.current : null;

      // Determine correctness
      let correct: boolean | null = null;
      if (currentItem.type === 'MCQ' && currentItem.correct_key) {
        correct = selectedKey === currentItem.correct_key;
      } else {
        correct = null; // FREE_RESPONSE - no auto-check
      }

      // Insert attempt
      const attemptRow = await insertAttempt({
        user_id: userId,
        question_id: currentItem.item_id,
        exam_id: examId,
        final_answer: currentItem.type === 'MCQ' ? selectedKey : freeResponse,
        correct,
        time_taken_ms: timeTakenMs,
        time_taken: timeTakenMs / 1000,
        latency_ms: timeToFirstActionMs,
        confidence_0_1: confidence,
        mode: 'practice'
      });

      track('practice_submitted', {
        item_id: currentItem.item_id,
        exam_id: examId,
        correct,
        time_taken_ms: timeTakenMs,
        time_to_first_ms: timeToFirstActionMs
      });

      // Record reward (async, don't block)
      invokeRecordReward({ attempt_id: attemptRow.id }).then(() => {
        track('practice_reward_recorded', { attempt_id: attemptRow.id });
      });

      // Fetch explanation
      const exp = await invokeFetchExplanation({
        item_id: currentItem.item_id,
        choice_key: currentItem.type === 'MCQ' ? selectedKey : null
      });

      setExplanation(exp);
      setIsCorrect(correct);

      // Update session stats
      setQuestionCount(prev => prev + 1);
      if (correct === true) {
        setCorrectCount(prev => prev + 1);
      }
      setTotalTimeMs(prev => prev + timeTakenMs);

      setState('verdict');
      track('explanation_shown', { item_id: currentItem.item_id, correct });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setState('presenting');
    }
  }, [currentItem, userId, examId, state, selectedKey, freeResponse, confidence, toast]);

  // Skip question
  const skip = useCallback(async () => {
    if (!currentItem || !userId || !examId) return;
    if (state !== 'presenting') return;

    setState('submitting');

    try {
      const endTs = Date.now();
      const timeTakenMs = endTs - startTs.current;
      const timeToFirstActionMs = firstActionTs.current ? firstActionTs.current - startTs.current : null;

      // Insert attempt as skipped
      const attemptRow = await insertAttempt({
        user_id: userId,
        question_id: currentItem.item_id,
        exam_id: examId,
        final_answer: null,
        correct: null,
        time_taken_ms: timeTakenMs,
        time_taken: timeTakenMs / 1000,
        latency_ms: timeToFirstActionMs,
        mode: 'practice'
      });

      track('practice_skipped', {
        item_id: currentItem.item_id,
        exam_id: examId,
        time_taken_ms: timeTakenMs
      });

      // Record reward
      invokeRecordReward({ attempt_id: attemptRow.id });

      // Fetch explanation
      const exp = await invokeFetchExplanation({
        item_id: currentItem.item_id,
        choice_key: null
      });

      setExplanation(exp);
      setIsCorrect(null);
      setQuestionCount(prev => prev + 1);
      setTotalTimeMs(prev => prev + timeTakenMs);

      setState('verdict');
      track('explanation_shown', { item_id: currentItem.item_id, skipped: true });
    } catch (error) {
      console.error('Skip error:', error);
      toast({
        title: 'Skip Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setState('presenting');
    }
  }, [currentItem, userId, examId, state, toast]);

  // Next question
  const next = useCallback(() => {
    track('next_question_clicked', { item_id: currentItem?.item_id });
    loadNext();
  }, [currentItem, loadNext]);

  return {
    state,
    userId,
    examId,
    examName,
    currentItem,
    selectedKey,
    setSelectedKey: (key: string) => {
      onFirstAction();
      setSelectedKey(key);
    },
    freeResponse,
    setFreeResponse: (text: string) => {
      onFirstAction();
      setFreeResponse(text);
    },
    confidence,
    setConfidence: (val: number | null) => {
      onFirstAction();
      setConfidence(val);
    },
    explanation,
    isCorrect,
    questionCount,
    correctCount,
    accuracy,
    avgTimeMs,
    init,
    submit,
    skip,
    next
  };
}
