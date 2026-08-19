<p align="center">
  <img
    src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=36&pause=1500&color=223C35&center=true&vCenter=true&width=950&lines=Sri+Lanka+Travel+Explorer"
    alt="Sri Lanka Travel Explorer"
  />
</p>

<p align="center">
  A responsive travel-discovery website that helps visitors explore Sri Lanka through curated destinations, tourism themes and interactive tourism insights.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-223C35?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-31554B?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6F8F82?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Power%20BI-D5E878?style=for-the-badge&logo=powerbi&logoColor=223C35" />
</p>

---

**Live website:** [Sri Lanka Travel Explorer]

**Website demo:**

**Power BI demo:**

> The website demo presents the theme-based destination experience. The Power BI demo shows the complementary tourism-arrival analysis and interactive filtering workflow.

---

## About the Project

Sri Lanka Travel Explorer is a frontend project designed to introduce travellers to the island through a visual and easy-to-navigate experience.

Visitors can browse destinations such as Yala National Park, Sigiriya, Ella, Galle Fort, Mirissa and Kandy, then filter the recommendations by themes including wildlife, nature, heritage, culture, adventure and beaches.

The project also includes a separate Power BI dashboard that analyses tourist arrivals to Sri Lanka. Together, the website and dashboard demonstrate two complementary perspectives: an engaging visitor experience and a data-driven view of tourism trends.

---

## Main Features

- Responsive travel interface for desktop and mobile
- Theme-based destination filtering
- Curated destination cards with images, provinces and descriptions
- JSON-based content management without a database
- Interactive experiences carousel
- Accessible navigation and semantic page structure
- Complementary Power BI tourism dashboard

---

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/Frontend-223C35?style=for-the-badge&logoColor=white" />
  &nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp; React · TypeScript · Vite · CSS
</p>

<p>
  <img src="https://img.shields.io/badge/Data-31554B?style=for-the-badge&logoColor=white" />
  &nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp; JSON · Power BI · Power Query
</p>

<p>
  <img src="https://img.shields.io/badge/Analytics-6F8F82?style=for-the-badge&logoColor=white" />
  &nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp; Data Cleaning · Data Transformation · Data Modelling · Interactive Visualisation
</p>

<p>
  <img src="https://img.shields.io/badge/Tools-D5E878?style=for-the-badge&logoColor=223C35" />
  &nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp; Git · GitHub · Vercel
</p>

---

## Power BI Tourism Analysis

The Power BI component examines tourist arrivals to Sri Lanka across 2024, 2025 and 2026.

### Data preparation

- Imported tourist-arrival datasets from multiple Excel files
- Cleaned missing, blank and invalid records with Power Query
- Promoted headers and standardised column names and data types
- Unpivoted monthly columns into a reusable tabular structure
- Added `Year` and `MonthNumber` fields
- Appended the three annual datasets into one consolidated table
- Ordered month names chronologically using `MonthNumber`

### Dashboard features

- Monthly tourist-arrival trends
- Top five tourist markets by arrival volume
- Total-arrivals KPI card
- Interactive country filter
- Single-select year slicer for 2024, 2025 and 2026
- Dynamic reporting period based on the selected year

### Power BI demo

> Public Power BI embedding is unavailable because the organisation-managed Power BI tenant disables Publish to web. The dashboard workflow is therefore presented through the demo above.

### Data source

Tourist-arrival data: [Sri Lanka Tourism Development Authority]

---

## Project Structure

```text
src/
├── assets/          # Images and visual assets
├── components/      # Reusable interface components
├── data/            # Destination JSON data
├── App.tsx          # Main application layout
├── index.css        # Global styles
└── main.tsx         # Application entry point
```

---

## Installation

### Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_NAME
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The application runs at `http://localhost:5173`.

### Production checks

```bash
npm run build
npm run lint
```

---
