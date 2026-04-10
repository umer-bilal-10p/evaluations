import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const displayValue = date && isValid(date) ? format(date, "MM/dd/yyyy") : "";

  const parsedMin = minDate ? parse(minDate, "yyyy-MM-dd", new Date()) : undefined;
  const parsedMax = maxDate ? parse(maxDate, "yyyy-MM-dd", new Date()) : undefined;
  const disabled = [
    ...(parsedMin && isValid(parsedMin) ? [{ before: parsedMin }] : []),
    ...(parsedMax && isValid(parsedMax) ? [{ after: parsedMax }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[36px] w-full min-w-0 flex-1 items-center justify-between rounded-[7px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-[13px] leading-[36px] outline-none"
        >
          <span
            className="text-[hsl(var(--muted-foreground))]"
          >
            {displayValue || placeholder}
          </span>
          <CalendarIcon className="size-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          className="!bg-[hsl(var(--card))]"
          mode="single"
          captionLayout="dropdown"
          selected={date}
          defaultMonth={date}
          disabled={disabled.length ? disabled : undefined}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "");
            if (d) setOpen(false);
          }}
        />
        {value && (
          <div className="bg-[hsl(var(--card))] px-3 pb-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-[6px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1 text-[12px] font-medium text-[hsl(var(--foreground))] hover:border-[#0047BB] hover:bg-[#0047BB] hover:text-white"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
