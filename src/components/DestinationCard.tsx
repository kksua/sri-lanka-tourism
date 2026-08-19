import type { Destination } from "../types/destination";

interface DestinationCardProps {
  destination: Destination;
  onSelect?: (destination: Destination) => void;
}

export default function DestinationCard({
  destination,
  onSelect,
}: DestinationCardProps) {
  return (
    <article
      className="destination-card"
      onClick={() => onSelect?.(destination)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(destination);
        }
      }}
    >
      <img src={destination.image} alt={destination.name} />
      <div className="destination-content">
        <span>{destination.province}</span>
        <h3>{destination.name}</h3>
        <p>{destination.description}</p>
      </div>
    </article>
  );
}
