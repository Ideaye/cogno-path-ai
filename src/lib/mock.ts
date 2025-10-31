export const mock = {
  user: { id: 'mock-user' },
  activeExam: { exam_id: 'cat', name: 'CAT' },
  stats: { 
    totalPractice: 42, 
    accuracy: 67, 
    streak: 3, 
    ece: null, 
    anchorMean: null, 
    anchorStd: null 
  } as const,
  weaknesses: [
    { concept: 'Algebra', severity: 'high', acc: 54, attempts: 37 },
    { concept: 'Reading Comprehension', severity: 'med', acc: 61, attempts: 22 },
  ],
};
