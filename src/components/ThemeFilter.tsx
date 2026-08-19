import type { DestinationTheme } from "../types/destination";

interface ThemeFilterProps {
  themes: DestinationTheme[];
  activeTheme: DestinationTheme | "all";
  onThemeChange: (theme: DestinationTheme | "all") => void;
}

const labels: Record<DestinationTheme | "all", string> = {
  all: "All",
  wildlife: "Wildlife",
  nature: "Nature",
  beach: "Beach",
  culture: "Culture",
  heritage: "Heritage",
  adventure: "Adventure"
};

export default function ThemeFilter({ themes, activeTheme, onThemeChange }: ThemeFilterProps) {
  return (
    <div className="theme-filter" aria-label="Filter destinations by theme">
      {(["all", ...themes] as Array<DestinationTheme | "all">).map((theme) => (
        <button
          type="button"
          key={theme}
          className={activeTheme === theme ? "active" : ""}
          onClick={() => onThemeChange(theme)}
        >
          {labels[theme]}
        </button>
      ))}
    </div>
  );
}
