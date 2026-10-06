import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Member } from '@/types';

const SIZES = { sm: 'size-5 text-[10px]', md: 'size-6 text-[11px]', lg: 'size-8 text-xs' } as const;

export function MemberAvatar({
  member,
  size = 'md',
  className,
}: {
  member: Member | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initials = member
    ? member.name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';
  return (
    <Avatar className={cn(SIZES[size], className)} title={member?.name}>
      <AvatarFallback
        className={cn('font-semibold', member ? 'text-white' : 'border border-dashed text-muted-foreground')}
        style={member ? { background: member.color } : undefined}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
