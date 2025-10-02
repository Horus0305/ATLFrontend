import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ComboboxWithAdd({
  value,
  onChange,
  options = [],
  placeholder = "Select or type...",
  emptyText = "No options found.",
  fieldName = "option",
  className,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Focus input when popover opens
  React.useEffect(() => {
    if (open) {
      // Use a longer timeout to ensure the popover is fully rendered
      const timer = setTimeout(() => {
        const input = document.querySelector('[cmdk-input]');
        if (input) {
          input.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSearchValue("");
    }
  }, [open]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleAddNew = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (searchValue && !options.some(opt => opt.toLowerCase() === searchValue.toLowerCase())) {
      onChange(searchValue);
      setOpen(false);
      setSearchValue("");
    }
  };

  // Check if search value is new (not in existing options)
  const isNewValue = searchValue && !options.some(opt => opt.toLowerCase() === searchValue.toLowerCase());

  const displayValue = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          type="button"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0" 
        align="start"
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <Command shouldFilter={false} className="pointer-events-auto">
            <div style={{ pointerEvents: 'auto' }} className="relative">
              <CommandInput
                placeholder={`Search ${fieldName}...`}
                value={searchValue}
                onValueChange={setSearchValue}
                autoFocus
                className="pointer-events-auto pr-8"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchValue("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity pointer-events-auto"
                  style={{ pointerEvents: 'auto' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          <CommandList>
            {filteredOptions.length === 0 && !isNewValue && (
              <CommandEmpty>
                <div className="flex flex-col gap-2 p-2">
                  <span className="text-sm text-muted-foreground">{emptyText}</span>
                </div>
              </CommandEmpty>
            )}
            {filteredOptions.length === 0 && isNewValue && (
              <CommandEmpty>
                <div 
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={handleAddNew}
                >
                  <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Add "{searchValue}" as new {fieldName}</span>
                </div>
              </CommandEmpty>
            )}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      handleSelect(option);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
                {isNewValue && (
                  <div 
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-t mt-1 pt-2"
                    onClick={handleAddNew}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddNew(e);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add "{searchValue}" as new {fieldName}
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
