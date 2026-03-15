import kitchenSink from './kitchen-sink.json';
import contactLookup from './contact-lookup.json';
import restaurantFinder from './restaurant-finder.json';
import flightStatus from './flight-status.json';
import weatherWidget from './weather-widget.json';

export const scenarios = {
  'kitchen-sink': kitchenSink,
  'contact-lookup': contactLookup,
  'restaurant-finder': restaurantFinder,
  'flight-status': flightStatus,
  'weather-widget': weatherWidget
};

export type ScenarioId = keyof typeof scenarios;
