import type { ItineraryResult } from "../../types/itinerary";

interface ItineraryViewProps {
  itinerary: ItineraryResult;
}

export default function ItineraryView({ itinerary }: ItineraryViewProps) {
  return (
    <article className="itinerary-view">
      <header>
        <h3>{itinerary.title}</h3>
        <p>{itinerary.summary}</p>
      </header>

      <div className="itinerary-sequence" aria-label="Destination sequence">
        {itinerary.destinationSequence.map((destination) => (
          <span key={destination}>{destination}</span>
        ))}
      </div>

      {itinerary.planningNote && (
        <p className="planning-note">{itinerary.planningNote}</p>
      )}

      <p className="route-note">{itinerary.routeNote}</p>

      <div className="itinerary-days">
        {itinerary.days.map((day) => (
          <section className="itinerary-day" key={day.day}>
            <div>
              <span>Day {day.day}</span>
              <h4>{day.base}</h4>
            </div>
            {day.route && <p className="transfer-label">{day.route.label}</p>}
            <dl>
              <dt>Morning</dt>
              <dd>{day.morning}</dd>
              <dt>Afternoon</dt>
              <dd>{day.afternoon}</dd>
              <dt>Evening</dt>
              <dd>{day.evening}</dd>
            </dl>
            {[...day.culturalNotes, ...day.seasonalNotes, ...day.warnings]
              .slice(0, 3)
              .map((note) => (
                <p className="day-note" key={note}>
                  {note}
                </p>
              ))}
          </section>
        ))}
      </div>

      {itinerary.warnings.length > 0 && (
        <div className="itinerary-warnings">
          <span>Travel notes</span>
          {itinerary.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </article>
  );
}
