import { useState, useEffect, useRef, useCallback } from "react";

// ─── Viewport hook ────────────────────────────────────────────────────────────

function useViewport() {
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    window.addEventListener("resize", update);
    // Also listen to visualViewport for software-keyboard changes
    if (window.visualViewport) window.visualViewport.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", update);
    };
  }, []);
  return { narrow: vw < 700, vw };
}

// ─── Core Simulator ───────────────────────────────────────────────────────────

function createMachine(transitions, initialState, acceptStates, rejectStates) {
  return { transitions, initialState, acceptStates, rejectStates };
}

function runMachine(machine, inputStr, maxSteps = 1000) {
  const tape = inputStr === "" ? ["_"] : inputStr.split("");
  let head = 0;
  let state = machine.initialState;
  const history = [{ tape: [...tape], head, state }];

  for (let step = 0; step < maxSteps; step++) {
    if (machine.acceptStates.includes(state))
      return { accepted: true, tape, history, timedOut: false };
    if (machine.rejectStates.includes(state))
      return { accepted: false, tape, history, timedOut: false };

    const symbol = tape[head] ?? "_";
    const stateTransitions = machine.transitions[state];
    if (!stateTransitions)
      return { accepted: false, tape, history, timedOut: false, error: `No transitions for state: ${state}` };
    const transition = stateTransitions[symbol];
    if (!transition)
      return { accepted: false, tape, history, timedOut: false, error: `No transition for state: ${state}, symbol: ${symbol}` };

    const [nextState, writeSymbol, direction] = transition;
    tape[head] = writeSymbol;
    state = nextState;

    if (direction === "R") { head++; if (head >= tape.length) tape.push("_"); }
    else if (direction === "L") { head = Math.max(0, head - 1); }

    history.push({ tape: [...tape], head, state });
  }
  return { accepted: false, tape, history, timedOut: true };
}

function validateSolution(machine, testCases) {
  return testCases.map((tc) => {
    const result = runMachine(machine, tc.input);
    const actualTape = result.tape.join("").replace(/_+$/, "");
    const passed = result.accepted && actualTape === tc.expected;
    return { ...tc, passed, actual: actualTape, accepted: result.accepted, timedOut: result.timedOut, history: result.history };
  });
}

// ─── Levels ───────────────────────────────────────────────────────────────────

const LEVELS = [
  {
    id: 1, name: "Echo",
    description: "Copy the input tape exactly. Read each symbol and move right until you reach a blank.",
    hint: "One state that moves right on any symbol, accepts at blank.",
    test_cases: [
      { input: "a", expected: "a", description: "Single char" },
      { input: "ab", expected: "ab", description: "Two chars" },
      { input: "aaa", expected: "aaa", description: "Repeated chars" },
    ],
    starter: `{\n  "q0": {\n    "a": ["q0", "a", "R"],\n    "b": ["q0", "b", "R"],\n    "_": ["accept", "_", "N"]\n  },\n  "accept": {}\n}`,
    initial_state: "q0", accept_states: ["accept"], reject_states: ["reject"],
  },
  {
    id: 2, name: "Unary Increment",
    description: "Add one to a unary number (string of 1s).",
    hint: "Scan right past all 1s, write one more 1 at the blank, then accept.",
    test_cases: [
      { input: "1", expected: "11", description: "One 1" },
      { input: "11", expected: "111", description: "Two 1s" },
      { input: "111", expected: "1111", description: "Three 1s" },
    ],
    starter: `{\n  "q0": {\n    "1": ["q0", "1", "R"],\n    "_": ["q1", "1", "N"]\n  },\n  "q1": {\n    "1": ["accept", "1", "N"]\n  },\n  "accept": {}\n}`,
    initial_state: "q0", accept_states: ["accept"], reject_states: ["reject"],
  },
  {
    id: 3, name: "Strip Trailing Blanks",
    description: "Remove trailing blanks from the tape.",
    hint: "Scan right to the end, walk back erasing blanks until you hit a non-blank.",
    test_cases: [
      { input: "a___", expected: "a", description: "Single char + blanks" },
      { input: "ab___", expected: "ab", description: "Two chars + blanks" },
      { input: "abc___", expected: "abc", description: "Three chars + blanks" },
    ],
    starter: `{\n  "q0": {\n    "a": ["q0", "a", "R"],\n    "b": ["q0", "b", "R"],\n    "c": ["q0", "c", "R"],\n    "_": ["q1", "_", "L"]\n  },\n  "q1": {\n    "_": ["q1", "_", "L"],\n    "a": ["accept", "a", "N"],\n    "b": ["accept", "b", "N"],\n    "c": ["accept", "c", "N"]\n  },\n  "accept": {}\n}`,
    initial_state: "q0", accept_states: ["accept"], reject_states: ["reject"],
  },
  {
    id: 4, name: "Palindrome Check",
    description: "Accept if the input reads the same forwards and backwards.",
    hint: "Mark leftmost symbol, scan right to compare with rightmost, repeat.",
    test_cases: [
      { input: "a", expected: "a", description: "Single char" },
      { input: "aa", expected: "aa", description: "Two same" },
      { input: "aba", expected: "aba", description: "Classic palindrome" },
    ],
    starter: `{\n  "q0": {\n    "a": ["q1a", "X", "R"],\n    "b": ["q1b", "X", "R"],\n    "X": ["accept", "X", "N"],\n    "_": ["accept", "_", "N"]\n  },\n  "q1a": {},\n  "q1b": {},\n  "accept": {}\n}`,
    initial_state: "q0", accept_states: ["accept"], reject_states: ["reject"],
  },
  {
    id: 5, name: "Mark Evens",
    description: "Convert even-indexed symbols (0-based) to uppercase.",
    hint: "Alternate between two states: one uppercases, one leaves as-is.",
    test_cases: [
      { input: "abab", expected: "AbAb", description: "Alternating" },
      { input: "aaaa", expected: "AaAa", description: "All same" },
      { input: "abc", expected: "AbC", description: "Three chars" },
    ],
    starter: `{\n  "q_even": {\n    "a": ["q_odd", "A", "R"],\n    "b": ["q_odd", "B", "R"],\n    "c": ["q_odd", "C", "R"],\n    "_": ["accept", "_", "N"]\n  },\n  "q_odd": {\n    "a": ["q_even", "a", "R"],\n    "b": ["q_even", "b", "R"],\n    "c": ["q_even", "c", "R"],\n    "_": ["accept", "_", "N"]\n  },\n  "accept": {}\n}`,
    initial_state: "q_even", accept_states: ["accept"], reject_states: ["reject"],
  },
];

// ─── Touch-swipe hook ─────────────────────────────────────────────────────────

function useSwipe(onLeft, onRight) {
  const startX = useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? onLeft() : onRight(); }
    startX.current = null;
  };
  return { onTouchStart, onTouchEnd };
}

// ─── SVG Tape Visualizer ──────────────────────────────────────────────────────

function TapeViz({ tape, head, state, stepIdx, totalSteps, narrow }) {
  const cellW = narrow ? 36 : 44;
  const cellH = narrow ? 36 : 44;
  const padding = 4;
  const visibleCount = narrow ? 9 : 13;
  const startIdx = Math.max(0, head - Math.floor(visibleCount / 2));
  const cells = Array.from({ length: visibleCount }, (_, i) => ({
    symbol: tape[startIdx + i] ?? "_",
    isHead: startIdx + i === head,
  }));
  const svgW = visibleCount * (cellW + padding) + padding;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={svgW} height={narrow ? 80 : 100} style={{ overflow: "visible", maxWidth: "100%" }}>
        {cells.map((cell, i) => {
          const x = i * (cellW + padding) + padding;
          const y = narrow ? 20 : 28;
          return (
            <g key={i}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={5}
                fill={cell.isHead ? "#6366f1" : cell.symbol === "_" ? "#1e1e2e" : "#2d2d44"}
                stroke={cell.isHead ? "#a5b4fc" : "#3d3d5e"}
                strokeWidth={cell.isHead ? 2 : 1}
              />
              <text x={x + cellW / 2} y={y + cellH / 2 + 5}
                textAnchor="middle" fontSize={narrow ? 14 : 18} fontFamily="monospace"
                fill={cell.isHead ? "#fff" : cell.symbol === "_" ? "#444" : "#c4c4d4"}>
                {cell.symbol}
              </text>
              {cell.isHead && (
                <text x={x + cellW / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#a5b4fc">▼</text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
        <span>State: <span style={{ color: "#a5b4fc", fontFamily: "monospace" }}>{state}</span></span>
        <span>Head: <span style={{ color: "#a5b4fc" }}>{head}</span></span>
        {totalSteps > 0 && <span>Step: <span style={{ color: "#a5b4fc" }}>{stepIdx + 1}/{totalSteps}</span></span>}
      </div>
    </div>
  );
}

// ─── State Diagram ────────────────────────────────────────────────────────────

function StateDiagram({ transitions, currentState }) {
  const states = Object.keys(transitions || {});
  if (states.length === 0) return null;

  const r = 26, svgW = 500, svgH = 180;
  const maxPerRow = Math.min(states.length, 5);
  const positions = {};
  states.forEach((s, i) => {
    const col = i % maxPerRow;
    const row = Math.floor(i / maxPerRow);
    positions[s] = {
      x: 55 + col * ((svgW - 110) / Math.max(maxPerRow - 1, 1)),
      y: 55 + row * 95,
    };
  });

  const edges = [];
  states.forEach((fromState) => {
    const trans = transitions[fromState] || {};
    const targetMap = {};
    Object.entries(trans).forEach(([sym, [nextState, write, dir]]) => {
      const key = `${fromState}->${nextState}`;
      if (!targetMap[key]) targetMap[key] = [];
      targetMap[key].push(`${sym}:${write},${dir}`);
    });
    Object.entries(targetMap).forEach(([key, labels]) => {
      const [from, to] = key.split("->");
      if (positions[from] && positions[to]) edges.push({ from, to, label: labels.join(" | ") });
    });
  });

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ background: "#0f0f1a", borderRadius: 10, border: "1px solid #2d2d44" }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#555" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const fp = positions[e.from], tp = positions[e.to];
        if (!fp || !tp) return null;
        if (e.from === e.to) {
          return (
            <g key={i}>
              <path d={`M${fp.x-10},${fp.y-r} C${fp.x-36},${fp.y-64} ${fp.x+36},${fp.y-64} ${fp.x+10},${fp.y-r}`}
                fill="none" stroke="#3d3d5e" strokeWidth={1.5} markerEnd="url(#arr)" />
              <text x={fp.x} y={fp.y - 62} textAnchor="middle" fontSize={8} fill="#666" fontFamily="monospace">{e.label}</text>
            </g>
          );
        }
        const dx = tp.x - fp.x, dy = tp.y - fp.y, len = Math.sqrt(dx*dx+dy*dy);
        const ux = dx/len, uy = dy/len;
        const x1 = fp.x+ux*r, y1 = fp.y+uy*r, x2 = tp.x-ux*(r+8), y2 = tp.y-uy*(r+8);
        const mx = (x1+x2)/2 - uy*18, my = (y1+y2)/2 + ux*18;
        return (
          <g key={i}>
            <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
              fill="none" stroke="#3d3d5e" strokeWidth={1.5} markerEnd="url(#arr)" />
            <text x={mx} y={my-3} textAnchor="middle" fontSize={8} fill="#666" fontFamily="monospace">{e.label}</text>
          </g>
        );
      })}
      {states.map((s) => {
        const p = positions[s]; if (!p) return null;
        const isAccept = s === "accept", isReject = s === "reject", isActive = s === currentState;
        return (
          <g key={s}>
            <circle cx={p.x} cy={p.y} r={r}
              fill={isActive ? "#6366f1" : isAccept ? "#1a3a2a" : isReject ? "#3a1a1a" : "#1e1e2e"}
              stroke={isActive ? "#a5b4fc" : isAccept ? "#4ade80" : isReject ? "#f87171" : "#3d3d5e"}
              strokeWidth={isActive ? 2.5 : 1.5} />
            {isAccept && <circle cx={p.x} cy={p.y} r={r-4} fill="none" stroke="#4ade80" strokeWidth={1} />}
            <text x={p.x} y={p.y+4} textAnchor="middle" fontSize={9} fontFamily="monospace"
              fill={isActive ? "#fff" : isAccept ? "#4ade80" : isReject ? "#f87171" : "#aaa"}>
              {s.length > 7 ? s.slice(0,6)+"…" : s}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Test Results ─────────────────────────────────────────────────────────────

function TestResults({ results, onStepThrough }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {results.map((r, i) => (
        <div key={i} style={{
          background: r.passed ? "#0d2a1a" : "#2a0d0d",
          border: `1px solid ${r.passed ? "#4ade80" : "#f87171"}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, lineHeight: 1.4 }}>{r.passed ? "✓" : "✗"}</span>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{r.description}</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#ccc" }}>
                  <span style={{ color: "#888" }}>in:</span> "{r.input}"&nbsp;
                  <span style={{ color: "#888" }}>exp:</span> "{r.expected}"
                </div>
                {!r.passed && (
                  <div style={{ fontFamily: "monospace", fontSize: 13, color: "#f87171", marginTop: 2 }}>
                    got: "{r.actual}"
                  </div>
                )}
              </div>
            </div>
            {!r.passed && r.history && (
              // Large touch target: min 44px tall
              <button onClick={() => onStepThrough(r)} style={{
                background: "#2d2d44", border: "1px solid #4d4d70", borderRadius: 8,
                color: "#a5b4fc", fontSize: 13, padding: "10px 14px",
                cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, flexShrink: 0,
              }}>
                Step →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step-through Modal ───────────────────────────────────────────────────────

function touchBtnStyle(disabled) {
  return {
    background: disabled ? "#1a1a2e" : "#2d2d44",
    border: "1px solid #3d3d5e", borderRadius: 8,
    color: disabled ? "#333" : "#a5b4fc",
    // min 44×44 touch target
    minWidth: 64, minHeight: 44, padding: "10px 14px",
    cursor: disabled ? "default" : "pointer", fontSize: 15, fontWeight: 600,
  };
}

function StepModal({ result, transitions, onClose, narrow }) {
  const [stepIdx, setStepIdx] = useState(0);
  const total = result.history.length;
  const frame = result.history[Math.min(stepIdx, total - 1)];

  const goNext = useCallback(() => setStepIdx((s) => Math.min(s + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setStepIdx((s) => Math.max(s - 1, 0)), []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Swipe nav
  const swipe = useSwipe(goNext, goPrev);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div
        style={{
          background: "#13131f", border: "1px solid #3d3d5e", borderRadius: 16,
          padding: narrow ? 16 : 28,
          width: narrow ? "100%" : "90%", maxWidth: 680,
          // On narrow (portrait iPad), take most of the screen height
          maxHeight: narrow ? "92dvh" : "90dvh",
          overflowY: "auto", display: "flex", flexDirection: "column", gap: 16,
          // On narrow, attach to bottom
          ...(narrow ? { position: "fixed", bottom: 0, left: 0, right: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
        {...swipe}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>"{result.input}"</div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>Swipe or tap to step</div>
          </div>
          {/* Large close button */}
          <button onClick={onClose} style={{
            background: "#2d2d44", border: "none", borderRadius: 8,
            color: "#aaa", fontSize: 18, width: 44, height: 44, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <TapeViz tape={frame.tape} head={frame.head} state={frame.state}
          stepIdx={stepIdx} totalSteps={total} narrow={narrow} />

        <StateDiagram transitions={transitions} currentState={frame.state} />

        {/* Nav row — full-width tap targets on iPad */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => setStepIdx(0)} disabled={stepIdx === 0} style={touchBtnStyle(stepIdx === 0)}>⟪</button>
          <button onClick={goPrev} disabled={stepIdx === 0} style={touchBtnStyle(stepIdx === 0)}>←</button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#555", fontSize: 13 }}>
            {stepIdx + 1} / {total}
          </div>
          <button onClick={goNext} disabled={stepIdx === total - 1} style={touchBtnStyle(stepIdx === total - 1)}>→</button>
          <button onClick={() => setStepIdx(total - 1)} disabled={stepIdx === total - 1} style={touchBtnStyle(stepIdx === total - 1)}>⟫</button>
        </div>
      </div>
    </div>
  );
}

// ─── Editor Screen ────────────────────────────────────────────────────────────

const SAVE_DEBOUNCE_MS = 800;

function EditorScreen({ level, onBack, onComplete, savedCode, onSave }) {
  const [code, setCode] = useState(savedCode || level.starter);
  const [results, setResults] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [stepTarget, setStepTarget] = useState(null);
  const [transitions, setTransitions] = useState(null);
  // portrait: show "tests" tab vs "editor" tab on narrow
  const [tab, setTab] = useState("editor");
  const { narrow } = useViewport();
  const saveTimer = useRef(null);

  // Debounced autosave on every edit
  const handleCodeChange = (val) => {
    setCode(val);
    setResults(null);
    setParseError(null);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave(level.id, val), SAVE_DEBOUNCE_MS);
  };

  const handleTest = useCallback(() => {
    let parsed;
    try { parsed = JSON.parse(code); }
    catch (e) { setParseError(e.message); setResults(null); return; }
    setParseError(null);
    setTransitions(parsed);
    const machine = createMachine(parsed, level.initial_state, level.accept_states, level.reject_states);
    const res = validateSolution(machine, level.test_cases);
    setResults(res);
    onSave(level.id, code);
    if (narrow) setTab("tests");
  }, [code, level, onSave, narrow]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleTest(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleTest]);

  const allPassed = results && results.every((r) => r.passed);

  // ── Narrow (portrait iPad): tabbed layout ──
  if (narrow) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          borderBottom: "1px solid #2d2d44", flexShrink: 0 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#888",
            cursor: "pointer", fontSize: 22, minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Level {level.id}</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{level.name}</div>
          </div>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#1a1a2e", borderRadius: 8, padding: 3, gap: 2 }}>
            {["editor","tests"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? "#2d2d44" : "transparent",
                border: "none", borderRadius: 6, color: tab === t ? "#fff" : "#555",
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                minHeight: 36,
              }}>{t === "editor" ? "Editor" : `Tests${results ? ` (${results.filter(r=>r.passed).length}/${results.length})` : ""}`}</button>
            ))}
          </div>
        </div>

        {/* Hint bar */}
        <div style={{ padding: "8px 16px", background: "#0d0d1a", borderBottom: "1px solid #1e1e2e",
          fontSize: 12, color: "#6366f1", flexShrink: 0 }}>
          💡 {level.hint}
        </div>

        {/* Editor tab */}
        {tab === "editor" && (
          <>
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              autoCorrect="off" autoCapitalize="none"
              style={{
                flex: 1, background: "#0a0a15", color: "#e2e2f2",
                fontFamily: "monospace", fontSize: 14, lineHeight: 1.7,
                border: "none", outline: "none", padding: 16, resize: "none",
              }}
            />
            {parseError && (
              <div style={{ padding: "8px 16px", background: "#2a0d0d",
                color: "#f87171", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>
                ✗ {parseError}
              </div>
            )}
            {/* Bottom toolbar — big touch targets */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #2d2d44",
              display: "flex", gap: 10, flexShrink: 0 }}>
              <button onClick={() => { setCode(level.starter); setResults(null); setParseError(null); }}
                style={{ background: "#1e1e2e", border: "1px solid #3d3d5e", borderRadius: 8,
                  color: "#888", fontSize: 14, padding: "10px 16px", cursor: "pointer", minHeight: 44 }}>
                Reset
              </button>
              <button onClick={handleTest} style={{
                flex: 1, background: "#4f46e5", border: "none", borderRadius: 8,
                color: "#fff", padding: "10px", cursor: "pointer", fontWeight: 700,
                fontSize: 15, minHeight: 44,
              }}>
                Run Tests
              </button>
            </div>
          </>
        )}

        {/* Tests tab */}
        {tab === "tests" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {results ? (
              <>
                <TestResults results={results} onStepThrough={setStepTarget} />
                {transitions && <StateDiagram transitions={transitions} currentState={level.initial_state} />}
                {allPassed && (
                  <button onClick={onComplete} style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    border: "none", borderRadius: 12, color: "#fff",
                    padding: 16, cursor: "pointer", fontWeight: 700, fontSize: 16,
                    minHeight: 54, boxShadow: "0 0 24px rgba(99,102,241,0.4)",
                  }}>
                    🎉 Complete Level →
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Test Cases</div>
                {level.test_cases.map((tc, i) => (
                  <div key={i} style={{ background: "#1a1a2e", border: "1px solid #2d2d44",
                    borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                    <span style={{ fontFamily: "monospace", color: "#aaa" }}>"{tc.input}"</span>
                    <span style={{ color: "#555", margin: "0 8px" }}>→</span>
                    <span style={{ fontFamily: "monospace", color: "#aaa" }}>"{tc.expected}"</span>
                    <div style={{ color: "#555", fontSize: 12, marginTop: 3 }}>{tc.description}</div>
                  </div>
                ))}
                <button onClick={() => setTab("editor")} style={{
                  background: "#1e1e2e", border: "1px solid #3d3d5e", borderRadius: 8,
                  color: "#a5b4fc", fontSize: 14, padding: "12px", cursor: "pointer", minHeight: 44,
                }}>
                  ← Back to Editor
                </button>
              </>
            )}
          </div>
        )}

        {stepTarget && (
          <StepModal result={stepTarget} transitions={transitions}
            onClose={() => setStepTarget(null)} narrow={true} />
        )}
      </div>
    );
  }

  // ── Wide (landscape iPad / desktop): side-by-side ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        borderBottom: "1px solid #2d2d44", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#888",
          cursor: "pointer", fontSize: 22, minWidth: 44, minHeight: 44,
          display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Level {level.id}</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{level.name}</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #2d2d44", minWidth: 0 }}>
          <div style={{ padding: "10px 16px", background: "#0d0d1a", borderBottom: "1px solid #1e1e2e", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: "#888" }}>{level.description}</div>
            <div style={{ fontSize: 11, color: "#6366f1", marginTop: 4 }}>💡 {level.hint}</div>
          </div>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off" autoCapitalize="none"
            style={{
              flex: 1, background: "#0a0a15", color: "#e2e2f2",
              fontFamily: "monospace", fontSize: 13, lineHeight: 1.6,
              border: "none", outline: "none", padding: 16, resize: "none",
            }}
          />
          {parseError && (
            <div style={{ padding: "8px 16px", background: "#2a0d0d",
              color: "#f87171", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>
              ✗ {parseError}
            </div>
          )}
          <div style={{ padding: "10px 16px", borderTop: "1px solid #2d2d44",
            display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={() => { setCode(level.starter); setResults(null); setParseError(null); }}
              style={{ background: "#1e1e2e", border: "1px solid #3d3d5e", borderRadius: 8,
                color: "#888", fontSize: 13, padding: "8px 16px", cursor: "pointer", minHeight: 44 }}>
              Reset
            </button>
            <button onClick={handleTest} style={{
              background: "#4f46e5", border: "none", borderRadius: 8, color: "#fff",
              padding: "8px 24px", cursor: "pointer", fontWeight: 700,
              fontSize: 14, marginLeft: "auto", minHeight: 44,
            }}>
              Run Tests (⌘↵)
            </button>
          </div>
        </div>

        {/* Right: tests + diagram */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", overflow: "auto", padding: 16, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: 1,
              textTransform: "uppercase", marginBottom: 8 }}>Test Cases</div>
            {results ? (
              <TestResults results={results} onStepThrough={setStepTarget} />
            ) : (
              level.test_cases.map((tc, i) => (
                <div key={i} style={{ background: "#1a1a2e", border: "1px solid #2d2d44",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontFamily: "monospace", color: "#aaa" }}>"{tc.input}"</span>
                  <span style={{ color: "#555", margin: "0 6px" }}>→</span>
                  <span style={{ fontFamily: "monospace", color: "#aaa" }}>"{tc.expected}"</span>
                  <span style={{ color: "#555", marginLeft: 8, fontSize: 11 }}>{tc.description}</span>
                </div>
              ))
            )}
          </div>
          {transitions && (
            <div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 8 }}>State Diagram</div>
              <StateDiagram transitions={transitions} currentState={level.initial_state} />
            </div>
          )}
          {allPassed && (
            <button onClick={onComplete} style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none", borderRadius: 10, color: "#fff",
              padding: 14, cursor: "pointer", fontWeight: 700, fontSize: 15,
              minHeight: 50, boxShadow: "0 0 24px rgba(99,102,241,0.4)", marginTop: "auto",
            }}>
              🎉 Complete Level →
            </button>
          )}
        </div>
      </div>

      {stepTarget && (
        <StepModal result={stepTarget} transitions={transitions}
          onClose={() => setStepTarget(null)} narrow={false} />
      )}
    </div>
  );
}

// ─── Level Select ─────────────────────────────────────────────────────────────

function LevelSelect({ completed, onSelect, onBack }) {
  return (
    <div style={{ padding: "24px 20px", maxWidth: 600, margin: "0 auto",
      overflowY: "auto", height: "100dvh" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#888",
        cursor: "pointer", fontSize: 15, marginBottom: 20, minHeight: 44,
        display: "flex", alignItems: "center", gap: 6 }}>← Menu</button>
      <h2 style={{ color: "#fff", marginBottom: 4, fontSize: 22 }}>Select a Level</h2>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>{completed.length}/{LEVELS.length} completed</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LEVELS.map((lvl) => {
          const done = completed.includes(lvl.id);
          return (
            <button key={lvl.id} onClick={() => onSelect(lvl)} style={{
              background: done ? "#0d2a1a" : "#13131f",
              border: `1px solid ${done ? "#4ade80" : "#2d2d44"}`,
              borderRadius: 12, padding: "18px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16, textAlign: "left", width: "100%",
              minHeight: 72, // generous touch target
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: done ? "#4ade80" : "#1e1e2e",
                border: `2px solid ${done ? "#4ade80" : "#3d3d5e"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done ? "#0a0a15" : "#555", fontWeight: 700, fontSize: 15,
              }}>
                {done ? "✓" : lvl.id}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{lvl.name}</div>
                <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>{lvl.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── How To Play ──────────────────────────────────────────────────────────────

function HowToPlay({ onBack }) {
  const sections = [
    ["What is a Turing Machine?",
      "A Turing machine reads a tape symbol-by-symbol, using states and transition rules to decide what to write and where to move. Your job is to define those rules."],
    ["Transition Format",
      '{\n  "state": {\n    "symbol": ["next", "write", "dir"]\n  }\n}\n\nDirections:  R right  L left  N stay\nSpecial:     _ blank cell'],
    ["Controls",
      "Run Tests button — run all test cases\nStep → button — walk a failed test frame-by-frame\nSwipe left/right in step-through to navigate\nReset — restore the starter template"],
    ["Tips",
      "• Start with Level 1 to learn the format\n• Switch to the Tests tab after running\n• Use Step → on failed tests to find the bug\n• The state diagram updates after each run"],
  ];
  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto",
      overflowY: "auto", height: "100dvh" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#888",
        cursor: "pointer", fontSize: 15, marginBottom: 20, minHeight: 44 }}>← Back</button>
      <h2 style={{ color: "#fff", marginBottom: 24 }}>How to Play</h2>
      {sections.map(([title, body]) => (
        <div key={title} style={{ marginBottom: 24 }}>
          <div style={{ color: "#a5b4fc", fontWeight: 700, marginBottom: 8 }}>{title}</div>
          <pre style={{ color: "#aaa", fontSize: 13, lineHeight: 1.8, margin: 0,
            fontFamily: body.includes('"') ? "monospace" : "inherit", whiteSpace: "pre-wrap" }}>{body}</pre>
        </div>
      ))}
      <div style={{ background: "#0a0a15", border: "1px solid #2d2d44", borderRadius: 10, padding: 16 }}>
        <div style={{ color: "#555", fontSize: 11, marginBottom: 8 }}>Example — Echo (Level 1)</div>
        <pre style={{ color: "#e2e2f2", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{`{
  "q0": {
    "a": ["q0", "a", "R"],
    "b": ["q0", "b", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {}
}`}</pre>
      </div>
    </div>
  );
}

// ─── Main Menu ────────────────────────────────────────────────────────────────

function MainMenu({ onPlay, onHowTo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100dvh" }}>
      <svg width={72} height={72} viewBox="0 0 72 72" style={{ marginBottom: 20 }}>
        {[0,1,2,3,4].map((i) => (
          <rect key={i} x={6 + i * 13} y={20} width={11} height={32} rx={3}
            fill={i === 2 ? "#6366f1" : "#1e1e2e"} stroke={i === 2 ? "#a5b4fc" : "#3d3d5e"} strokeWidth={1.5} />
        ))}
        {["_","a","q0","b","_"].map((s, i) => (
          <text key={i} x={11.5 + i * 13} y={41} textAnchor="middle" fontSize={9}
            fontFamily="monospace" fill={i === 2 ? "#fff" : "#444"}>{s}</text>
        ))}
        <text x={36} y={64} textAnchor="middle" fontSize={11} fill="#6366f1">▲</text>
      </svg>
      <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5 }}>
        Turing Machine
      </h1>
      <p style={{ color: "#6366f1", fontSize: 13, marginBottom: 44, letterSpacing: 3, textTransform: "uppercase" }}>
        Puzzle Game
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
        <button onClick={onPlay} style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          border: "none", borderRadius: 12, color: "#fff",
          padding: 16, cursor: "pointer", fontWeight: 700, fontSize: 17, minHeight: 54,
        }}>Play</button>
        <button onClick={onHowTo} style={{
          background: "#1e1e2e", border: "1px solid #3d3d5e", borderRadius: 12,
          color: "#a5b4fc", padding: 14, cursor: "pointer", fontWeight: 600,
          fontSize: 15, minHeight: 50,
        }}>How to Play</button>
      </div>
      <p style={{ color: "#2d2d44", fontSize: 12, marginTop: 44 }}>5 levels · automata theory · browser-native</p>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tmg_v1";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function writeSave(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [activeLevel, setActiveLevel] = useState(null);
  const [save, setSave] = useState(loadSave);

  const completed = save.completed || [];
  const savedCode = save.code || {};

  const handleSaveCode = (id, code) => {
    const next = { ...save, code: { ...savedCode, [id]: code } };
    setSave(next); writeSave(next);
  };

  const handleComplete = () => {
    const next = { ...save, completed: [...new Set([...completed, activeLevel.id])] };
    setSave(next); writeSave(next);
    const nextIdx = LEVELS.findIndex((l) => l.id === activeLevel.id) + 1;
    if (nextIdx < LEVELS.length) setActiveLevel(LEVELS[nextIdx]);
    else setScreen("levels");
  };

  return (
    <div style={{ background: "#0a0a15", color: "#e2e2f2", minHeight: "100dvh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {screen === "menu" && <MainMenu onPlay={() => setScreen("levels")} onHowTo={() => setScreen("howto")} />}
      {screen === "howto" && <HowToPlay onBack={() => setScreen("menu")} />}
      {screen === "levels" && (
        <LevelSelect completed={completed}
          onSelect={(lvl) => { setActiveLevel(lvl); setScreen("editor"); }}
          onBack={() => setScreen("menu")} />
      )}
      {screen === "editor" && activeLevel && (
        <EditorScreen level={activeLevel} onBack={() => setScreen("levels")}
          onComplete={handleComplete} savedCode={savedCode[activeLevel.id]} onSave={handleSaveCode} />
      )}
    </div>
  );
}
