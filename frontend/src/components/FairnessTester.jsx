import { useState, useRef, useCallback } from 'react';
import apiClient from '../api/client';
import CustomDropdown from './ui/CustomDropdown';

// ── Chi-squared critical values (95% confidence) ──────────────
const CRITICAL_VALUES = {
  4:   7.81,
  6:   11.07,
  8:   14.07,
  10:  16.92,
  12:  19.68,
  20:  30.14,
  100: 123.23,
};

const DICE      = [4, 6, 8, 10, 12, 20, 100];
const COUNT_OPTIONS = [100, 200, 500, 1000, 2000];
const SPEED_OPTIONS = [
  { label: '10 / s',  value: 10  },
  { label: '50 / s',  value: 50  },
  { label: 'Fast',    value: 0   },
];

// ── SSE calculation ───────────────────────────────────────────
function calcSSE(counts, sides, total) {
  if (total === 0) return 0;
  const expected = total / sides;
  let sse = 0;
  for (let face = 1; face <= sides; face++) {
    const observed = counts[face] || 0;
    sse += Math.pow(observed - expected, 2) / expected;
  }
  return Math.round(sse * 100) / 100;
}

export default function FairnessTester() {
  const [selectedDie,  setSelectedDie]  = useState(20);
  const [rollCount,    setRollCount]    = useState(500);
  const [speed,        setSpeed]        = useState(50);
  const [running,      setRunning]      = useState(false);
  const [progress,     setProgress]     = useState(0);    // 0-100
  const [counts,       setCounts]       = useState({});   // face → count
  const [totalRolled,  setTotalRolled]  = useState(0);
  const [sse,          setSse]          = useState(null);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState('');
  const abortRef = useRef(false);

  const criticalValue = CRITICAL_VALUES[selectedDie] || 0;
  const isPassing     = sse !== null && sse < criticalValue;

  const reset = () => {
    setCounts({});
    setTotalRolled(0);
    setSse(null);
    setProgress(0);
    setDone(false);
    setError('');
  };

  const handleStart = useCallback(async () => {
    reset();
    setRunning(true);
    abortRef.current = false;

    // Batch size = speed (rolls/s); 0 = fast (100 per call, no delay)
    const BATCH = speed > 0 ? speed : 100;
    const totalBatches = Math.ceil(rollCount / BATCH);
    const allCounts = {};
    let rolled = 0;

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        if (abortRef.current) break;

        const batchSize = Math.min(BATCH, rollCount - rolled);
        const res = await apiClient.post('/dice/test', {
          notation: '1d' + selectedDie,
          count:    batchSize,
        });

        // Tally results
        res.data.rolls.forEach(r => {
          allCounts[r] = (allCounts[r] || 0) + 1;
        });

        rolled += batchSize;
        const currentSse = calcSSE(allCounts, selectedDie, rolled);

        setCounts({ ...allCounts });
        setTotalRolled(rolled);
        setSse(currentSse);
        setProgress(Math.round((rolled / rollCount) * 100));

        if (speed > 0 && batch < totalBatches - 1 && !abortRef.current) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (err) {
      setError('Test failed. Is the backend running?');
    } finally {
      setRunning(false);
      setDone(true);
    }
  }, [selectedDie, rollCount, speed]);

  const handleStop = () => {
    abortRef.current = true;
  };

  // ── Bar chart ─────────────────────────────────────────────────
  // For d100 we group into buckets of 10 to keep it readable
  const BUCKET_SIZE = selectedDie <= 20 ? 1 : 10;
  const buckets     = buildBuckets(counts, selectedDie, BUCKET_SIZE);
  const maxCount    = Math.max(...buckets.map(b => b.count), 1);
  const expected    = totalRolled > 0
    ? totalRolled / (selectedDie / BUCKET_SIZE)
    : 0;

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Title */}
      <div style={{
        fontSize:      '11px',
        fontWeight:    '600',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color:         'var(--text-muted)',
        marginBottom:  '12px',
      }}>
        🎲 Dice Fairness Tester
      </div>

      {/* Die selector */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          fontSize: '10px', color: 'var(--text-faint)',
          marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Select Die
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {DICE.map(d => (
            <button
              key={d}
              onClick={() => { setSelectedDie(d); reset(); }}
              disabled={running}
              style={{
                padding:      '4px 8px',
                borderRadius: '6px',
                border:       '1px solid ' + (selectedDie === d
                  ? 'var(--color-primary)' : 'var(--border-main)'),
                background:   selectedDie === d
                  ? 'var(--accent-bg)' : 'transparent',
                color:        selectedDie === d
                  ? 'var(--color-primary)' : 'var(--text-muted)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '11px',
                fontWeight:   selectedDie === d ? '600' : '400',
                cursor:       running ? 'not-allowed' : 'pointer',
                transition:   'all 0.1s ease',
              }}
            >
              D{d}
            </button>
          ))}
        </div>
      </div>

      {/* Roll count */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '10px', color: 'var(--text-faint)',
          marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Number of Rolls
        </div>
        <CustomDropdown
          value={rollCount}
          onChange={v => { setRollCount(v); reset(); }}
          disabled={running}
          searchable={false}
          options={COUNT_OPTIONS.map(n => ({
            value: n,
            label: `${n} rolls${n < 5 * selectedDie ? ' (low accuracy)' : ''}`,
          }))}
        />
      </div>

      {/* Speed selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '10px', color: 'var(--text-faint)',
          marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Roll Speed
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {SPEED_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt.value)}
              disabled={running}
              style={{
                flex:         1,
                padding:      '4px 0',
                borderRadius: '6px',
                border:       '1px solid ' + (speed === opt.value
                  ? 'var(--color-primary)' : 'var(--border-main)'),
                background:   speed === opt.value
                  ? 'var(--accent-bg)' : 'transparent',
                color:        speed === opt.value
                  ? 'var(--color-primary)' : 'var(--text-muted)',
                fontFamily:   'var(--font-sans)',
                fontSize:     '11px',
                fontWeight:   speed === opt.value ? '600' : '400',
                cursor:       running ? 'not-allowed' : 'pointer',
                transition:   'all 0.1s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start / Stop */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <button
          onClick={handleStart}
          disabled={running}
          style={{
            flex:         1,
            padding:      '7px 0',
            borderRadius: '7px',
            border:       'none',
            background:   running
              ? 'var(--text-faint)' : 'var(--color-primary)',
            color:        '#ffffff',
            fontFamily:   'var(--font-sans)',
            fontSize:     '12px',
            fontWeight:   '500',
            cursor:       running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Running...' : done ? '↺ Run Again' : '▶ Start'}
        </button>
        {running && (
          <button
            onClick={handleStop}
            style={{
              padding:      '7px 12px',
              borderRadius: '7px',
              border:       '1px solid var(--danger)',
              background:   'transparent',
              color:        'var(--danger)',
              fontFamily:   'var(--font-sans)',
              fontSize:     '12px',
              cursor:       'pointer',
            }}
          >
            ■ Stop
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize: '12px', color: 'var(--danger)',
          marginBottom: '8px',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Progress bar */}
      {(running || done) && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '10px', color: 'var(--text-faint)',
            marginBottom: '4px',
          }}>
            <span>{totalRolled} / {rollCount} rolls</span>
            <span>{progress}%</span>
          </div>
          <div style={{
            height: '4px', background: 'var(--border-main)',
            borderRadius: '2px', overflow: 'hidden',
          }}>
            <div style={{
              height:     '100%',
              width:      progress + '%',
              background: 'var(--color-primary)',
              borderRadius: '2px',
              transition: 'width 0.2s ease',
            }} />
          </div>
        </div>
      )}

      {/* SSE result */}
      {sse !== null && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent:'space-between',
          padding:      '8px 10px',
          borderRadius: '8px',
          border:       '1px solid ' + (isPassing
            ? 'var(--accent)' : 'var(--danger)'),
          background:   isPassing
            ? 'var(--accent-bg)' : 'var(--danger-bg)',
          marginBottom: '10px',
        }}>
          <div>
            <div style={{
              fontSize:   '10px',
              color:      'var(--text-muted)',
              marginBottom:'2px',
            }}>
              SSE Score
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize:   '20px',
              fontWeight: '700',
              color:      isPassing ? 'var(--accent)' : 'var(--danger)',
            }}>
              {sse}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize:   '16px',
              marginBottom:'2px',
            }}>
              {isPassing ? '✅' : '❌'}
            </div>
            <div style={{
              fontSize: '10px',
              color:    'var(--text-muted)',
            }}>
              Critical: {criticalValue}
            </div>
            <div style={{
              fontSize:   '11px',
              fontWeight: '600',
              color:      isPassing ? 'var(--accent)' : 'var(--danger)',
            }}>
              {isPassing ? 'FAIR' : 'WEIGHTED'}
            </div>
          </div>
        </div>
      )}

      {/* Histogram */}
      {totalRolled > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '10px', color: 'var(--text-faint)',
            marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Distribution (D{selectedDie})
          </div>

          {/* Chart area */}
          <div style={{
            position:   'relative',
            height:     '80px',
            background: 'var(--bg-section-hd)',
            borderRadius:'6px',
            border:     '1px solid var(--border-main)',
            overflow:   'hidden',
            padding:    '6px 4px 0',
          }}>
            {/* Expected line */}
            {expected > 0 && (
              <div style={{
                position:   'absolute',
                left:       4, right: 4,
                top:        6 + (1 - Math.min(expected / maxCount, 1)) * 68,
                height:     '1.5px',
                background: '#3B82F6',
                opacity:    0.7,
                zIndex:     2,
              }} />
            )}

            {/* Bars */}
            <div style={{
              display:     'flex',
              alignItems:  'flex-end',
              height:      '68px',
              gap:         '1px',
              position:    'relative',
              zIndex:      1,
            }}>
              {buckets.map((b, i) => {
                const h = maxCount > 0
                  ? Math.round((b.count / maxCount) * 68)
                  : 0;
                const isHigh = b.count > expected * 1.3;
                const isLow  = b.count < expected * 0.7 && totalRolled > 50;
                return (
                  <div
                    key={i}
                    title={b.label + ': ' + b.count}
                    style={{
                      flex:         1,
                      height:       h + 'px',
                      minHeight:    b.count > 0 ? '2px' : '0',
                      background:   isHigh
                        ? 'var(--danger)'
                        : isLow
                          ? '#F59E0B'
                          : 'var(--color-primary)',
                      borderRadius: '2px 2px 0 0',
                      opacity:      0.85,
                      transition:   'height 0.15s ease',
                      cursor:       'default',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* X-axis labels — only show first, middle, last */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            fontSize:       '9px',
            color:          'var(--text-faint)',
            marginTop:      '3px',
            padding:        '0 2px',
          }}>
            <span>1</span>
            <span>{Math.round(selectedDie / 2)}</span>
            <span>{selectedDie}</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{
        borderTop:    '1px solid var(--border-main)',
        paddingTop:   '12px',
        marginTop:    '4px',
      }} />

      {/* How we roll — explainer */}
      <div style={{
        fontSize:      '11px',
        fontWeight:    '600',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color:         'var(--text-muted)',
        marginBottom:  '8px',
      }}>
        How We Roll
      </div>

      <div style={{
        fontSize:   '12px',
        color:      'var(--text-secondary)',
        lineHeight: '1.7',
        marginBottom:'10px',
      }}>
        Every roll in The Catoolu uses{' '}
        <code style={{
          fontFamily:   'monospace',
          fontSize:     '11px',
          background:   'var(--accent-bg)',
          color:        'var(--accent)',
          padding:      '1px 5px',
          borderRadius: '4px',
        }}>
          crypto.randomInt()
        </code>
        {' '}— Node.js's built-in cryptographic random number generator.
      </div>

      <div style={{
        fontSize:   '12px',
        color:      'var(--text-secondary)',
        lineHeight: '1.7',
        marginBottom:'10px',
      }}>
        Unlike <code style={{ fontFamily:'monospace', fontSize:'11px' }}>
          Math.random()
        </code> which uses a deterministic algorithm seeded by the clock,{' '}
        <code style={{ fontFamily:'monospace', fontSize:'11px',
          background:'var(--accent-bg)', color:'var(--accent)',
          padding:'1px 5px', borderRadius:'4px' }}>
          crypto.randomInt()
        </code>{' '}
        reads from the OS hardware entropy pool — the same source used
        to generate encryption keys and TLS certificates.
      </div>

      <div style={{
        fontSize:   '12px',
        color:      'var(--text-secondary)',
        lineHeight: '1.7',
        marginBottom:'10px',
      }}>
        Rolls happen on the{' '}
        <strong style={{ color: 'var(--text-primary)' }}>server</strong>,
        not your browser — so no player can manipulate results.
        Everyone at the table sees the same outcome from the same
        authoritative source.
      </div>

      {/* Chi-squared explainer */}
      <div style={{
        background:   'var(--bg-section-hd)',
        border:       '1px solid var(--border-main)',
        borderRadius: '8px',
        padding:      '10px 12px',
        fontSize:     '12px',
        color:        'var(--text-secondary)',
        lineHeight:   '1.6',
      }}>
        <div style={{
          fontWeight:   '600',
          color:        'var(--text-primary)',
          marginBottom: '4px',
          fontSize:     '12px',
        }}>
          About the SSE Score
        </div>
        The SSE (Sum of Squares Error) measures how far the distribution
        is from perfectly equal. Lower is better. The{' '}
        <strong style={{ color: 'var(--text-primary)' }}>
          critical value
        </strong>{' '}
        comes from the chi-squared test at 95% confidence — if SSE stays
        below it, the die is statistically fair. Run at least{' '}
        {5 * selectedDie} rolls on a D{selectedDie} for meaningful results.
      </div>
    </div>
  );
}

// ── Build histogram buckets ────────────────────────────────────
function buildBuckets(counts, sides, bucketSize) {
  const buckets = [];
  for (let start = 1; start <= sides; start += bucketSize) {
    const end   = Math.min(start + bucketSize - 1, sides);
    let   count = 0;
    for (let face = start; face <= end; face++) {
      count += counts[face] || 0;
    }
    const label = bucketSize === 1 ? String(start) : start + '–' + end;
    buckets.push({ label, count, start, end });
  }
  return buckets;
}