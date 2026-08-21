import { useCallback, useState } from "react";
import { generateItinerary, refineItinerary } from "../services/plannerApi";
import type {
  ChatMessage,
  ItineraryResult,
  TripContext,
} from "../types/itinerary";

const OUT_OF_SCOPE_MESSAGE =
  "That request is outside my itinerary-planning scope. I can adjust your days, destinations, themes, pace or travel month instead.";

export function useItineraryPlanner() {
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeContext, setActiveContext] = useState<TripContext | null>(null);

  const generate = useCallback(async (context: TripContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateItinerary(context);
      setItinerary(result);
      setActiveContext(result.context ?? context);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.summary,
        },
      ]);
    } catch (plannerError) {
      setError(
        plannerError instanceof Error
          ? plannerError.message
          : "The planner could not generate an itinerary.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refine = useCallback(
    async (message: string) => {
      if (!itinerary || !message.trim()) return;

      setIsLoading(true);
      setError(null);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message.trim(),
      };
      setMessages((current) => [...current, userMessage]);

      try {
        const result = await refineItinerary(
          itinerary.sessionId,
          message,
          activeContext ?? undefined,
        );
        setItinerary(result);
        setActiveContext(result.context ?? activeContext);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.summary,
          },
        ]);
      } catch (plannerError) {
        const errorMessage =
          plannerError instanceof Error
            ? plannerError.message
            : "The planner could not refine the itinerary.";

        if (errorMessage === OUT_OF_SCOPE_MESSAGE) {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: OUT_OF_SCOPE_MESSAGE,
            },
          ]);
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activeContext, itinerary],
  );

  const reset = useCallback(() => {
    setItinerary(null);
    setMessages([]);
    setError(null);
    setActiveContext(null);
    setIsLoading(false);
  }, []);

  return { itinerary, messages, isLoading, error, generate, refine, reset };
}
