import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import type { TechnologyTag } from "@/types/technology-tags";
import { TechIcon, getTechIconConfig } from "./tech-icons";

interface TechnologyTagInputProps {
  selectedTags: TechnologyTag[];
  allTags: TechnologyTag[];
  isEditing: boolean;
  disabled?: boolean;
  onTagAdded: (tag: TechnologyTag) => void;
  onTagRemoved: (tagId: number) => void;
}

export function TechnologyTagInput({
  selectedTags,
  allTags,
  isEditing,
  disabled = false,
  onTagAdded,
  onTagRemoved,
}: TechnologyTagInputProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const availableTags = allTags.filter(
    (tag) => !selectedTags.some((st) => st.id === tag.id)
  );

  const filteredTags = searchValue
    ? availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : availableTags;

  const handleAddTag = useCallback(
    (tag: TechnologyTag) => {
      onTagAdded(tag);
    },
    [onTagAdded]
  );

  const handleRemoveTag = useCallback(
    (tagId: number) => {
      onTagRemoved(tagId);
    },
    [onTagRemoved]
  );

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Technology Tags
      </label>

      <div className="flex flex-wrap gap-2">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => {
            const config = getTechIconConfig(tag.name);
            return (
              <Badge
                key={tag.id}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} border ${config.border} shadow-xs gap-1.5`}
                style={{ color: config.hex }}
              >
                <TechIcon name={tag.name} />
                {tag.name}
                {!disabled && isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${tag.name} tag`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            );
          })
        ) : (
          <p className="text-sm font-medium text-gray-400 italic py-1">
            No technology tags assigned
          </p>
        )}
      </div>

      {!disabled && isEditing && (
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 text-gray-600 border-dashed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Tag
              <ChevronsUpDown className="w-3 h-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-0 shadow-xl border-gray-200"
            align="start"
          >
            <Command className="border shadow-md">
              <CommandInput
                placeholder="Search tags..."
                className="h-10"
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList
                className="max-h-64 overflow-y-auto overscroll-contain touch-pan-y"
                onWheel={(event) => event.stopPropagation()}
              >
                <CommandEmpty className="py-4 text-center">
                  <span className="text-sm text-gray-500">No tags found</span>
                </CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        handleAddTag(tag);
                        setOpen(false);
                        setSearchValue("");
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 opacity-0" />
                      <TechIcon name={tag.name} />
                      <span className="text-sm font-semibold text-gray-900">
                        {tag.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
