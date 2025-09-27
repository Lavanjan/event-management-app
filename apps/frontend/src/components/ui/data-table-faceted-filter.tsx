import * as React from "react";
import { Check, PlusCircle } from "lucide-react";

import { cn } from "../../utils/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Separator } from "./separator";

interface DataTableFacetedFilterProps {
  title?: string;
  options: {
    label: string | React.ReactNode;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  disabled?: boolean;
  multiSelect?: boolean;
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
}

export function DataTableFacetedFilter({
  title,
  options,
  selectedValues = [],
  disabled,
  multiSelect = true,
  onFilterChange,
}: DataTableFacetedFilterProps) {
  const selectedValueSet = new Set(selectedValues);
  const [open, setOpen] = React.useState(false);

  const onClose = () => {
    setOpen(false);
  };

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="h-8 border-dashed w-full lg:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValueSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValueSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValueSet.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValueSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValueSet.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {typeof option.label === 'string' ? option.label : option.value}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title?.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValueSet.has(option.value);
                return (
                  <CommandItem
                    className="cursor-pointer"
                    key={option.value}
                    onSelect={() => {
                      if (multiSelect) {
                        const updatedValues = isSelected
                          ? selectedValues.filter((val) => val !== option.value)
                          : [...selectedValues, option.value];
                        onFilterChange(updatedValues);
                      } else {
                        onFilterChange(isSelected ? [] : [option.value]);
                        onClose();
                      }
                    }}
                  >
                    {multiSelect && (
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValueSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onFilterChange([])}
                    className="justify-center text-center cursor-pointer"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
