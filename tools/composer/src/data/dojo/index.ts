import componentGalleryStream from './component-gallery-stream.json';
import kitchenSink from './kitchen-sink.json';
import contactLookup from './contact-lookup.json';
import restaurantFinder from './restaurant-finder.json';
import flightStatus from './flight-status.json';
import weatherWidget from './weather-widget.json';
import floorPlan from './floor-plan.json';
import orgChart from './org-chart.json';
import bookingForm from './booking-form.json';
import rizzchartsChart from './rizzcharts-chart.json';
import northstarTour from './northstar-tour.json';

export const scenarios = {
  'northstar-tour': northstarTour,
  'kitchen-sink': kitchenSink,
  'contact-lookup': contactLookup,
  'restaurant-finder': restaurantFinder,
  'flight-status': flightStatus,
  'weather-widget': weatherWidget,
  'floor-plan': floorPlan,
  'org-chart': orgChart,
  'booking-form': bookingForm,
  'rizzcharts-chart': rizzchartsChart,
  'component-gallery-stream': componentGalleryStream
};

export type ScenarioId = keyof typeof scenarios;
