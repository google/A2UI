import kitchenSink from './kitchen-sink.json';
import contactLookup from './contact-lookup.json';
import restaurantFinder from './restaurant-finder.json';

export const scenarios = {
  'kitchen-sink': kitchenSink,
  'contact-lookup': contactLookup,
  'restaurant-finder': restaurantFinder,
};

export type ScenarioId = keyof typeof scenarios;
