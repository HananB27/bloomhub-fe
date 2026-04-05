import { useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Badge } from "./badge";
import { cn } from "./utils";

interface EditableInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  isEditing?: boolean;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}

export function EditableInput({
  label,
  value,
  onChange,
  disabled = false,
  isEditing = false,
  placeholder,
  type = "text",
  maxLength,
}: EditableInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {!disabled && isEditing ? (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={!isEditing}
          className="bg-white border-zinc-200 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all rounded-xl h-11"
        />
      ) : (
        <div className="py-1">
          <p
            className={cn(
              "text-base font-medium transition-colors",
              value ? "text-gray-900" : "text-gray-400 italic"
            )}
          >
            {value || "Not provided"}
          </p>
        </div>
      )}
    </div>
  );
}

interface EditableSelectProps<T> {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: T[];
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  disabled?: boolean;
  isEditing?: boolean;
  placeholder?: string;
  noDataMessage?: string;
  triggerClassName?: string;
}

export function EditableSelect<T>({
  label,
  value,
  onChange,
  options,
  getOptionValue,
  getOptionLabel,
  disabled = false,
  isEditing = false,
  placeholder = "Select an option",
  noDataMessage = `No ${label}s`,
  triggerClassName,
}: EditableSelectProps<T>) {
  // Get the label for the currently selected value
  const selectedLabel = value
    ? (() => {
        const found = options.find((opt) => getOptionValue(opt) === value);
        return found ? getOptionLabel(found) : placeholder;
      })()
    : placeholder;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {!disabled && isEditing ? (
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={!isEditing}
        >
          <SelectTrigger
            className={cn(
              "bg-white border-zinc-200 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all rounded-xl h-14 shadow-sm",
              triggerClassName
            )}
          >
            <SelectValue placeholder={selectedLabel} />
          </SelectTrigger>
          <SelectContent>
            {options.length > 0 ? (
              options.map((option) => (
                <SelectItem
                  key={getOptionValue(option)}
                  value={getOptionValue(option)}
                >
                  {getOptionLabel(option)}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-gray-500">
                {noDataMessage}
              </div>
            )}
          </SelectContent>
        </Select>
      ) : (
        <div className="py-1">
          <p
            className={cn(
              "text-base font-medium transition-colors",
              value ? "text-gray-900" : "text-gray-400 italic"
            )}
          >
            {value
              ? (() => {
                  const found = options.find(
                    (opt) => getOptionValue(opt) === value
                  );
                  return found ? getOptionLabel(found) : value;
                })()
              : "Not selected"}
          </p>
        </div>
      )}
    </div>
  );
}

interface EditableMultiSelectProps<T> {
  label: string;
  selectedValues: T[];
  onChange: (values: T[]) => void;
  allOptions: T[];
  getOptionValue: (option: T) => string | number;
  getOptionLabel: (option: T) => string;
  disabled?: boolean;
  isEditing?: boolean;
  colSpan?: string;
  noDataMessage?: string;
}

export function EditableMultiSelect<T>({
  label,
  selectedValues,
  onChange,
  allOptions,
  getOptionValue,
  getOptionLabel,
  disabled = false,
  isEditing = false,
  colSpan = "",
  noDataMessage = `No ${label}s`,
}: EditableMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const handleToggle = (option: T) => {
    const value = getOptionValue(option);
    const isSelected = selectedValues.some((v) => getOptionValue(v) === value);

    if (isSelected) {
      onChange(selectedValues.filter((v) => getOptionValue(v) !== value));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className={cn("space-y-1.5", colSpan)}>
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {!disabled && isEditing ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-expanded={open}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm hover:border-zinc-300 transition-all focus:outline-hidden focus:ring-4 focus:ring-zinc-500/5 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex flex-wrap gap-1.5">
                {selectedValues.length > 0 ? (
                  selectedValues.map((val) => (
                    <Badge
                      key={getOptionValue(val)}
                      variant="secondary"
                      className="rounded-md px-2 py-0.5 font-medium bg-gray-100 text-gray-800 border-none"
                    >
                      {getOptionLabel(val)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400">
                    Select {label.toLowerCase()}...
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-40" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 shadow-xl border-gray-200"
            align="start"
          >
            <Command className="border shadow-md">
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-11"
              />
              <CommandList>
                <CommandEmpty className="py-6 text-sm text-gray-500">
                  {noDataMessage}
                </CommandEmpty>
                <CommandGroup>
                  {allOptions.map((option) => {
                    const isSelected = selectedValues.some(
                      (v) => getOptionValue(v) === getOptionValue(option)
                    );
                    return (
                      <CommandItem
                        key={getOptionValue(option)}
                        onSelect={() => handleToggle(option)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-zinc-100 transition-colors"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-all",
                            isSelected
                              ? "bg-zinc-800 border-zinc-800 shadow-sm"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-2 w-2 stroke-[3px] text-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium transition-colors",
                            isSelected ? "text-zinc-900" : "text-gray-700"
                          )}
                        >
                          {getOptionLabel(option)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="py-1">
          <div className="flex flex-wrap gap-2">
            {selectedValues.length > 0 ? (
              selectedValues.map((v) => (
                <Badge
                  key={getOptionValue(v)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 shadow-xs"
                >
                  {getOptionLabel(v)}
                </Badge>
              ))
            ) : (
              <p className="text-sm font-medium text-gray-400 italic py-1">
                No {label.toLowerCase()} assigned
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
