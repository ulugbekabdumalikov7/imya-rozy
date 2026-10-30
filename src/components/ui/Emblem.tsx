import {
  BookOpen,
  Castle,
  Cross,
  Crown,
  Eye,
  Feather,
  Flame,
  Flower2,
  Gem,
  Glasses,
  Hammer,
  KeyRound,
  Leaf,
  Scale,
  Soup,
  Stamp,
} from 'lucide-react';

import type { Character } from '../../data/types';

const EMBLEMS = {
  lens: Glasses,
  quill: Feather,
  key: KeyRound,
  eye: Eye,
  book: BookOpen,
  herb: Leaf,
  scale: Scale,
  cross: Cross,
  flame: Flame,
  tower: Castle,
  bowl: Soup,
  seal: Stamp,
  crown: Crown,
  rose: Flower2,
  hammer: Hammer,
  glass: Gem,
} as const;

export function Emblem({ c, size = 40 }: { c: Character; size?: number }) {
  const Icon = EMBLEMS[c.emblem];
  return (
    <span className={`emblem emblem-${c.group}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.6} />
    </span>
  );
}
