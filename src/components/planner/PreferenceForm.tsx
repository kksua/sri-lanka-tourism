import { ChevronDown, Plus, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  paceOptions,
  toggleArrayValue,
  travelMonths,
  validateTripContext,
} from "../../schemas/itinerary";
import type { Destination, DestinationTheme } from "../../types/destination";
import type { TripContext } from "../../types/itinerary";

interface PreferenceFormProps {
  context: TripContext;
  destinations: Destination[];
  themes: DestinationTheme[];
  isLoading: boolean;
  onChange: (context: TripContext) => void;
  onSubmit: (context: TripContext) => void;
}

export default function PreferenceForm({
  context,
  destinations,
  themes,
  isLoading,
  onChange,
  onSubmit,
}: PreferenceFormProps) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [destinationToAdd, setDestinationToAdd] = useState("");
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [destinationMenuOpen, setDestinationMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement | null>(null);
  const destinationMenuRef = useRef<HTMLDivElement | null>(null);
  const validation = validateTripContext(context);
  const destinationNames = useMemo(
    () => destinations.map((destination) => destination.name),
    [destinations],
  );

  const updateContext = (next: Partial<TripContext>) => {
    onChange({ ...context, ...next });
  };

  const availableRequiredDestinations = destinationNames.filter(
    (name) => !context.requiredDestinations.includes(name),
  );

  useEffect(() => {
    if (!destinationMenuOpen && !monthMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        monthMenuRef.current &&
        !monthMenuRef.current.contains(event.target as Node)
      ) {
        setMonthMenuOpen(false);
      }

      if (
        destinationMenuRef.current &&
        !destinationMenuRef.current.contains(event.target as Node)
      ) {
        setDestinationMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [destinationMenuOpen, monthMenuOpen]);

  const addRequiredDestination = () => {
    if (!destinationToAdd) return;

    updateContext({
      requiredDestinations: [
        ...context.requiredDestinations,
        destinationToAdd,
      ],
    });
    setDestinationToAdd("");
    setDestinationMenuOpen(false);
  };

  const removeRequiredDestination = (destinationName: string) => {
    updateContext({
      requiredDestinations: context.requiredDestinations.filter(
        (name) => name !== destinationName,
      ),
    });
  };

  return (
    <form
      className="planner-form"
      onSubmit={(event) => {
        event.preventDefault();
        setAttemptedSubmit(true);
        if (validation.valid) onSubmit(context);
      }}
    >
      <div className="planner-form-grid">
        <label>
          <span>Days</span>
          <input
            type="number"
            min={1}
            max={21}
            value={context.days}
            onChange={(event) =>
              updateContext({ days: Number(event.target.value) })
            }
          />
          {attemptedSubmit && validation.errors.days && (
            <small>{validation.errors.days}</small>
          )}
        </label>

        <label>
          <span>Month</span>
          <div className="planner-choice-menu" ref={monthMenuRef}>
            <button
              className="planner-choice-trigger"
              type="button"
              onClick={() => setMonthMenuOpen((isOpen) => !isOpen)}
              aria-haspopup="listbox"
              aria-expanded={monthMenuOpen}
            >
              {context.month}
              <ChevronDown size={18} />
            </button>

            {monthMenuOpen && (
              <div
                className="planner-choice-list"
                role="listbox"
                aria-label="Travel month options"
              >
                {travelMonths.map((month) => (
                  <button
                    className={context.month === month ? "active" : ""}
                    type="button"
                    role="option"
                    aria-selected={context.month === month}
                    key={month}
                    onClick={() => {
                      updateContext({ month });
                      setMonthMenuOpen(false);
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>

        <label>
          <span>Start</span>
          <input
            value={context.startingLocation}
            onChange={(event) =>
              updateContext({ startingLocation: event.target.value })
            }
            placeholder="Colombo"
          />
          {attemptedSubmit && validation.errors.startingLocation && (
            <small>{validation.errors.startingLocation}</small>
          )}
        </label>
      </div>

      <fieldset>
        <legend>Preferred themes</legend>
        <div className="planner-pill-row">
          {themes.map((theme) => (
            <button
              className={
                context.preferredThemes.includes(theme) ? "active" : ""
              }
              type="button"
              key={theme}
              onClick={() =>
                updateContext({
                  preferredThemes: toggleArrayValue(
                    context.preferredThemes,
                    theme,
                  ),
                })
              }
            >
              {theme}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Pace</legend>
        <div className="planner-segmented">
          {paceOptions.map((pace) => (
            <button
              className={context.pace === pace ? "active" : ""}
              type="button"
              key={pace}
              onClick={() => updateContext({ pace })}
            >
              {pace}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="planner-required-destinations">
        <label>
          <span>Required destinations</span>
          <div className="destination-select-row">
            <div className="planner-choice-menu" ref={destinationMenuRef}>
              <button
                className="planner-choice-trigger"
                type="button"
                onClick={() =>
                  setDestinationMenuOpen((isOpen) => !isOpen)
                }
                aria-haspopup="listbox"
                aria-expanded={destinationMenuOpen}
              >
                {destinationToAdd || "Choose destinations"}
                <ChevronDown size={18} />
              </button>

              {destinationMenuOpen && (
                <div
                  className="planner-choice-list"
                  role="listbox"
                  aria-label="Required destination options"
                >
                  {availableRequiredDestinations.map((name) => (
                    <button
                      className={destinationToAdd === name ? "active" : ""}
                      type="button"
                      role="option"
                      aria-selected={destinationToAdd === name}
                      key={name}
                      onClick={() => {
                        setDestinationToAdd(name);
                        setDestinationMenuOpen(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="destination-add-button"
              type="button"
              onClick={addRequiredDestination}
              disabled={!destinationToAdd}
              aria-label="Add required destination"
            >
              <Plus size={18} />
            </button>
          </div>
        </label>

        {context.requiredDestinations.length > 0 && (
          <div className="selected-destinations" aria-label="Selected destinations">
            {context.requiredDestinations.map((destinationName) => (
              <span key={destinationName}>
                {destinationName}
                <button
                  type="button"
                  onClick={() => removeRequiredDestination(destinationName)}
                  aria-label={`Remove ${destinationName}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button className="planner-submit" type="submit" disabled={isLoading}>
        Generate itinerary
        <Send size={18} />
      </button>
    </form>
  );
}
