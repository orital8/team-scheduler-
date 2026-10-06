import { useState } from 'react';
import { CalendarIcon, XIcon } from 'lucide-react';
import { he, enGB } from 'react-day-picker/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { DateStr } from '@/types';

const toDate = (d: DateStr) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
};
const toStr = (d: Date): DateStr =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DatePicker({
  value,
  onChange,
  className,
}: {
  value: DateStr | null;
  onChange: (v: DateStr | null) => void;
  className?: string;
}) {
  const { t, lang, dir, formatDate } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('flex-1 justify-start font-normal', !value && 'text-muted-foreground')}
          >
            <CalendarIcon />
            {value ? formatDate(value) : t('date.pick')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            dir={dir}
            locale={lang === 'he' ? he : enGB}
            selected={value ? toDate(value) : undefined}
            defaultMonth={value ? toDate(value) : undefined}
            onSelect={(d) => {
              onChange(d ? toStr(d) : null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" onClick={() => onChange(null)} aria-label={t('date.clear')}>
          <XIcon />
        </Button>
      )}
    </div>
  );
}
