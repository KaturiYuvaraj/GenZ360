/**
 * GenZ360 Curated Technical Assessment Question Banks
 * Real-world questions with code snippets, multi-choice options, and detailed technical rationale.
 */

export interface QuestionItem {
  id: string;
  prompt: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AssessmentQuestions {
  assessmentId: string;
  skillName: string;
  passingScore: number;
  questions: QuestionItem[];
}

export const ASSESSMENT_BANKS: Record<string, AssessmentQuestions> = {
  as_js: {
    assessmentId: 'as_js',
    skillName: 'JavaScript & React Foundations',
    passingScore: 70,
    questions: [
      {
        id: 'q_js_1',
        prompt: 'In React, what will happen when `setState(prev => prev + 1)` is called consecutively 3 times inside a single event handler?',
        options: [
          'The state will increment by 1 due to automatic batching',
          'The state will increment by 3 because updater functions chain the pending state transitions',
          'React will throw a Maximum Update Depth Exceeded error',
          'Only the last setState call will execute, ignoring the first two',
        ],
        correctIndex: 1,
        explanation: 'When passing an updater function `(prev => prev + 1)`, React queues the function transitions and evaluates them in order during the next render batch, producing a net increment of 3.',
      },
      {
        id: 'q_js_2',
        prompt: 'What is the output of the following JavaScript snippet?',
        codeSnippet: `console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);`,
        options: [
          '1, 4, 3, 2',
          '1, 2, 3, 4',
          '1, 4, 2, 3',
          '1, 3, 4, 2',
        ],
        correctIndex: 0,
        explanation: 'Synchronous code runs first (1, 4). Next, microtasks queued by Promise.resolve() drain before macrotasks (3). Finally, the timer macrotask callback executes (2).',
      },
      {
        id: 'q_js_3',
        prompt: 'Why should objects or arrays NOT be instantiated inline inside a `useEffect` dependency array?',
        options: [
          'React forbids objects in dependency arrays with a runtime TypeError',
          'Every render allocates a new object reference in memory, triggering the effect on every single cycle',
          'JavaScript objects are converted to strings in the dependency array',
          'Inline objects cause memory leaks in the V8 garbage collector',
        ],
        correctIndex: 1,
        explanation: 'React uses `Object.is()` shallow comparison. Inline objects (`{ id: 1 }`) have a new reference memory address on every render, causing an infinite or unnecessary effect trigger.',
      },
      {
        id: 'q_js_4',
        prompt: 'Which hook should be used to store a mutable value that does NOT trigger a re-render when changed?',
        options: [
          'useState',
          'useMemo',
          'useRef',
          'useCallback',
        ],
        correctIndex: 2,
        explanation: '`useRef` returns a persistent plain object with a `.current` property whose mutation does not cause React to trigger a component reconciliation re-render.',
      },
      {
        id: 'q_js_5',
        prompt: 'What is the purpose of the `key` prop when rendering a dynamic list in React?',
        options: [
          'It provides a unique CSS identifier for styling child elements',
          'It allows React Fiber to identify which items have changed, been added, or been removed across renders',
          'It passes an index integer automatically to event handlers',
          'It encrypts the component props in memory',
        ],
        correctIndex: 1,
        explanation: 'Keys give elements a stable identity so React Fiber can re-order or retain DOM nodes rather than unmounting and recreating the entire subtree.',
      },
    ],
  },

  as_sql: {
    assessmentId: 'as_sql',
    skillName: 'SQL for Product Engineering',
    passingScore: 70,
    questions: [
      {
        id: 'q_sql_1',
        prompt: 'Which query correctly returns the top 3 highest-rated box cricket grounds in each city using a window function?',
        codeSnippet: `SELECT name, city, rating,\n       RANK() OVER (PARTITION BY city ORDER BY rating DESC) as rk\nFROM grounds\nWHERE rk <= 3; -- Why does this WHERE clause fail?`,
        options: [
          'Window functions cannot be ordered by descending values',
          'Window functions are evaluated in the SELECT phase, which happens AFTER the WHERE clause; a CTE or subquery is required',
          'Postgres requires GROUP BY whenever a window function is used',
          'RANK() must be replaced with COUNT(*)',
        ],
        correctIndex: 1,
        explanation: 'In SQL execution order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT (Window Functions) -> ORDER BY. Because window functions calculate during SELECT, their alias is not visible in WHERE.',
      },
      {
        id: 'q_sql_2',
        prompt: 'What is the primary difference between `LEFT JOIN` and `INNER JOIN`?',
        options: [
          'INNER JOIN is faster because it sorts by primary key',
          'LEFT JOIN returns all rows from the left table even if there is no match in the right table (filling NULLs)',
          'INNER JOIN returns all rows from both tables regardless of matches',
          'LEFT JOIN only allows joining on indexed integer columns',
        ],
        correctIndex: 1,
        explanation: 'A LEFT JOIN preserves every row from the left relation, substituting NULL values for right relation attributes when the join predicate does not match.',
      },
      {
        id: 'q_sql_3',
        prompt: 'What type of index is most suitable in PostgreSQL for JSONB document containment queries (`WHERE data @> \'{"role": "admin"}\'`)?',
        options: [
          'B-Tree Index',
          'Hash Index',
          'GIN (Generalized Inverted Index)',
          'BRIN (Block Range Index)',
        ],
        correctIndex: 2,
        explanation: 'GIN indexes are designed for handling composite items where internal elements need to be searched, making them optimal for JSONB keys and array containment.',
      },
      {
        id: 'q_sql_4',
        prompt: 'How can you prevent race conditions when booking a sports turf slot simultaneously from two concurrent requests?',
        options: [
          'Run queries inside `TRANSACTION` with `SELECT ... FOR UPDATE` row locks',
          'Increase the database connection pool size to 100',
          'Set the column type to VARCHAR instead of TEXT',
          'Use a client-side setTimeout delay',
        ],
        correctIndex: 0,
        explanation: '`SELECT ... FOR UPDATE` acquires an exclusive row lock on the slot row during the transaction, forcing concurrent queries to block until the lock releases or fails.',
      },
    ],
  },

  as_ai: {
    assessmentId: 'as_ai',
    skillName: 'Applied AI & LLM Systems',
    passingScore: 70,
    questions: [
      {
        id: 'q_ai_1',
        prompt: 'What does a sampling temperature of `0.0` signify in LLM completion generation?',
        options: [
          'The model generates completely random creative responses',
          'The model performs greedy decoding, deterministically picking the token with the highest log probability at each step',
          'The model runs at 0ms latency by skipping attention matrices',
          'The model rejects all input prompts',
        ],
        correctIndex: 1,
        explanation: 'At temperature 0.0, the softmax distribution sharpens into an argmax selection, yielding reproducible, deterministic greedy token choices.',
      },
      {
        id: 'q_ai_2',
        prompt: 'In RAG architectures, what is the primary benefit of hybrid search over pure vector search?',
        options: [
          'Hybrid search reduces database storage by 80%',
          'Combining dense vector search with sparse keyword search (BM25) catches exact part numbers, acronyms, and proper nouns that embeddings sometimes dilute',
          'Hybrid search bypasses chunking entirely',
          'Vectors are incompatible with PostgreSQL',
        ],
        correctIndex: 1,
        explanation: 'Dense embeddings excel at conceptual semantic meaning, while sparse BM25 excels at exact keyword and alphanumeric identifier matching. Hybrid reciprocal rank fusion yields superior retrieval accuracy.',
      },
      {
        id: 'q_ai_3',
        prompt: 'How can prompt injection attacks be most reliably mitigated when ingesting untrusted candidate resumes?',
        options: [
          'Delete all exclamation marks from applicant resumes',
          'Strictly separate system instructions from user data using structured schema delimiters, tool calls, and post-generation evaluation classifiers',
          'Run the LLM in client-side WebAssembly',
          'Increase context window size to 1 Million tokens',
        ],
        correctIndex: 1,
        explanation: 'Isolating untrusted inputs into designated delimiter blocks and passing extraction through strict JSON schema function parameters prevents prompt text from being interpreted as instructions.',
      },
      {
        id: 'q_ai_4',
        prompt: 'What is "LLM-as-a-Judge" primarily used for in AI production pipelines?',
        options: [
          'To replace human HR recruiters permanently',
          'To run automated semantic evaluations comparing model outputs against predefined rubrics and reference standards',
          'To compute vector cosine distances faster than GPUs',
          'To minify JavaScript bundles',
        ],
        correctIndex: 1,
        explanation: 'LLM-as-a-Judge utilizes a strong judge model with detailed scoring rubrics to evaluate complex qualitative criteria (groundedness, relevance, hallucination rate) at scale.',
      },
    ],
  },

  as_ux: {
    assessmentId: 'as_ux',
    skillName: 'UI / UX Product Systems',
    passingScore: 70,
    questions: [
      {
        id: 'q_ux_1',
        prompt: 'According to Hick\'s Law, how does increasing the number of choices impact user decision time?',
        options: [
          'Decision time decreases exponentially',
          'Decision time increases logarithmically with the number and complexity of choices',
          'User decision time is completely unaffected by choices',
          'Users always pick the first option within 100ms',
        ],
        correctIndex: 1,
        explanation: 'Hick\'s Law states: T = b · log2(n + 1). The time it takes to make a decision increases logarithmically as the number of options increases. Simplifying forms and filtering reduces cognitive load.',
      },
      {
        id: 'q_ux_2',
        prompt: 'What is the recommended minimum touch target size for interactive elements on mobile devices according to WCAG and Apple HIG?',
        options: [
          '16 × 16 px',
          '24 × 24 px',
          '44 × 44 px (or 48 × 48 px)',
          '100 × 100 px',
        ],
        correctIndex: 2,
        explanation: 'Apple Human Interface Guidelines specify 44×44 pt and Google Material Design specifies 48×48 dp to ensure fingers can reliably tap without accidental neighboring clicks.',
      },
      {
        id: 'q_ux_3',
        prompt: 'What is the primary benefit of designing with Design Tokens (variables) instead of hardcoded hex values?',
        options: [
          'Design tokens make Figma files smaller in file size',
          'Design tokens create a single source of truth that synchronizes design files with CSS/Tailwind variables, making theming and audits effortless',
          'Design tokens prevent browser caching',
          'Tokens allow 3D rendering without WebGL',
        ],
        correctIndex: 1,
        explanation: 'Design tokens abstract decisions (color, spacing, elevation) into semantic variables (`--color-paper`, `--radius-lg`) that propagate instantly across web, mobile, and design platforms.',
      },
    ],
  },

  as_apt: {
    assessmentId: 'as_apt',
    skillName: 'Campus Placement Aptitude',
    passingScore: 70,
    questions: [
      {
        id: 'q_apt_1',
        prompt: 'A box cricket team scores 96 runs in 8 overs. What is their required run rate if the target is 120 runs in 8 overs?',
        options: [
          '12.0 runs per over',
          '15.0 runs per over',
          '10.5 runs per over',
          '14.0 runs per over',
        ],
        correctIndex: 1,
        explanation: 'Required run rate = Total Target / Total Overs = 120 / 8 = 15.0 runs per over.',
      },
      {
        id: 'q_apt_2',
        prompt: 'If 5 developers can complete 5 agile sprint tasks in 5 hours, how many hours will 10 developers take to complete 10 sprint tasks at the same pace?',
        options: [
          '10 hours',
          '5 hours',
          '2.5 hours',
          '1 hour',
        ],
        correctIndex: 1,
        explanation: '1 developer completes 1 task in 5 hours. Therefore, 10 developers working concurrently on 10 tasks will still take exactly 5 hours.',
      },
      {
        id: 'q_apt_3',
        prompt: 'Complete the pattern sequence: 2, 6, 12, 20, 30, ?',
        options: [
          '40',
          '42',
          '44',
          '48',
        ],
        correctIndex: 1,
        explanation: 'The differences between consecutive terms are +4, +6, +8, +10. The next difference is +12, so 30 + 12 = 42 (also n² + n: 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30, 6²+6=42).',
      },
    ],
  },
};
