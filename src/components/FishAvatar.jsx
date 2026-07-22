import { getTier } from '../lib/tiers'

const FISHES = {
  megalodon: (
    <>
      <path d='M -52 0 Q -28 -19 8 -19 Q 38 -19 48 -7 L 66 -17 L 60 0 L 66 17 L 48 7 Q 38 19 8 19 Q -28 19 -52 0 Z' fill='#334155' />
      <path d='M 4 -19 L 16 -37 L 26 -18 Z' fill='#334155' />
      <path d='M -6 17 L 4 31 L 16 17 Z' fill='#475569' />
      <path d='M -52 0 L -37 8 L -40 -5 Z' fill='#1e293b' />
      <path d='M -49 1 L -45 7 L -43 1 Z' fill='#ffffff' />
      <path d='M -44 1 L -40 7 L -38 1 Z' fill='#ffffff' />
      <path d='M -39 1 L -35 7 L -33 1 Z' fill='#ffffff' />
      <circle cx='-35' cy='-7' r='3' fill='#ffffff' />
      <circle cx='-35' cy='-7' r='1.4' fill='#0f172a' />
    </>
  ),
  greatwhite: (
    <>
      <path d='M -52 0 Q -28 -19 8 -19 Q 38 -19 48 -7 L 66 -17 L 60 0 L 66 17 L 48 7 Q 38 19 8 19 Q -28 19 -52 0 Z' fill='#64748b' />
      <path d='M -32 7 Q 0 21 42 11 Q 10 23 -32 13 Z' fill='#e2e8f0' />
      <path d='M 4 -19 L 16 -37 L 26 -18 Z' fill='#64748b' />
      <path d='M -6 17 L 4 30 L 16 17 Z' fill='#94a3b8' />
      <line x1='-30' y1='-4' x2='-26' y2='10' stroke='#475569' strokeWidth='1.5' />
      <line x1='-24' y1='-5' x2='-20' y2='11' stroke='#475569' strokeWidth='1.5' />
      <line x1='-18' y1='-6' x2='-14' y2='12' stroke='#475569' strokeWidth='1.5' />
      <path d='M -52 2 Q -40 6 -30 3' stroke='#334155' strokeWidth='1.5' fill='none' />
      <circle cx='-35' cy='-7' r='3' fill='#ffffff' />
      <circle cx='-35' cy='-7' r='1.4' fill='#0f172a' />
    </>
  ),
  swordfish: (
    <>
      <path d='M -40 0 L -94 -3 L -94 3 Z' fill='#378ADD' />
      <path d='M -40 0 Q -20 -14 0 -14 Q 34 -14 42 -5 L 62 -14 L 55 0 L 62 14 L 42 5 Q 34 14 0 14 Q -20 14 -40 0 Z' fill='#378ADD' />
      <path d='M -8 -14 L 4 -31 L 18 -13 Z' fill='#378ADD' />
      <path d='M -2 13 L 6 25 L 16 13 Z' fill='#5ba3e6' />
      <circle cx='-30' cy='-5' r='2.6' fill='#ffffff' />
      <circle cx='-30' cy='-5' r='1.3' fill='#0f172a' />
    </>
  ),
  seabass: (
    <>
      <path d='M -42 0 Q -20 -16 12 -15 Q 36 -14 44 -4 L 60 -12 L 54 0 L 60 12 L 44 4 Q 36 14 12 15 Q -20 16 -42 0 Z' fill='#639922' />
      <path d='M -4 -15 Q 6 -27 20 -14 Q 8 -12 -4 -15 Z' fill='#639922' />
      <path d='M -2 14 L 6 26 L 16 14 Z' fill='#7cb342' />
      <path d='M -18 -8 Q 4 -11 22 -7' stroke='#3f6212' strokeWidth='1' fill='none' />
      <circle cx='-30' cy='-5' r='2.6' fill='#ffffff' />
      <circle cx='-30' cy='-5' r='1.3' fill='#0f172a' />
    </>
  ),
  pufferfish: (
    <>
      <circle cx='0' cy='0' r='25' fill='#BA7517' />
      <path d='M 0 -25 L -5 -36 L 5 -36 Z' fill='#BA7517' />
      <path d='M 18 -18 L 27 -27 L 24 -13 Z' fill='#BA7517' />
      <path d='M 25 0 L 38 0 L 25 7 Z' fill='#BA7517' />
      <path d='M 18 18 L 27 27 L 13 24 Z' fill='#BA7517' />
      <path d='M 0 25 L -5 36 L 5 36 Z' fill='#BA7517' />
      <path d='M -18 18 L -27 27 L -24 13 Z' fill='#BA7517' />
      <path d='M -25 0 L -38 0 L -25 -7 Z' fill='#BA7517' />
      <path d='M -18 -18 L -27 -27 L -13 -24 Z' fill='#BA7517' />
      <circle cx='-9' cy='-4' r='3' fill='#ffffff' />
      <circle cx='-9' cy='-4' r='1.5' fill='#0f172a' />
      <path d='M 8 0 Q 12 3 16 0' stroke='#7c4a09' strokeWidth='1.5' fill='none' />
    </>
  ),
  clownfish: (
    <>
      <path d='M -42 0 Q -20 -16 12 -15 Q 36 -14 44 -4 L 60 -12 L 54 0 L 60 12 L 44 4 Q 36 14 12 15 Q -20 16 -42 0 Z' fill='#D85A30' />
      <path d='M -4 -15 Q 6 -27 20 -14 Q 8 -12 -4 -15 Z' fill='#D85A30' />
      <path d='M -2 14 L 6 26 L 16 14 Z' fill='#D85A30' />
      <path d='M -23 -12 Q -19 0 -23 12 L -15 12 Q -11 0 -15 -12 Z' fill='#ffffff' />
      <path d='M 1 -14 Q 5 0 1 14 L 9 14 Q 13 0 9 -14 Z' fill='#ffffff' />
      <path d='M 27 -10 Q 31 0 27 10 L 33 8 Q 37 0 33 -8 Z' fill='#ffffff' />
      <circle cx='-32' cy='-5' r='2.8' fill='#ffffff' />
      <circle cx='-32' cy='-5' r='1.4' fill='#0f172a' />
    </>
  ),
  sunfish: (
    <>
      <ellipse cx='0' cy='0' rx='23' ry='35' fill='#94a3b8' />
      <path d='M -18 -30 Q 0 -41 18 -30 Q 0 -35 -18 -30 Z' fill='#94a3b8' />
      <path d='M -18 30 Q 0 41 18 30 Q 0 35 -18 30 Z' fill='#94a3b8' />
      <path d='M 23 0 L 34 -6 L 34 6 Z' fill='#94a3b8' />
      <circle cx='-8' cy='-6' r='3' fill='#ffffff' />
      <circle cx='-8' cy='-6' r='1.5' fill='#0f172a' />
      <path d='M 6 4 Q 10 6 14 4' stroke='#475569' strokeWidth='1.5' fill='none' />
    </>
  ),
}

export default function FishAvatar({ tier, size = 36 }) {
  const t = getTier(tier)
  if (!tier) {
    return (
      <svg viewBox='-100 -42 206 84' width={size} height={size} role='img' aria-label='未定级'>
        <circle cx='0' cy='0' r='26' fill='#e2e8f0' />
        <text x='0' y='8' textAnchor='middle' fontSize='26' fill='#94a3b8' fontWeight='500'>?</text>
      </svg>
    )
  }
  return (
    <svg viewBox='-100 -42 206 84' width={size} height={size} role='img' aria-label={t.name}>
      {FISHES[tier]}
    </svg>
  )
}
