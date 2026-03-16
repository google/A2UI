import kitchenSink from './kitchen-sink.json';
import restaurantBooking from './restaurant-booking.json';
import restaurantList from './restaurant-list.json';
import restaurantGrid from './restaurant-grid.json';
import restaurantConfirmation from './restaurant-confirmation.json';
import contactCard from './contact-card.json';
import contactList from './contact-list.json';
import orgChart from './org-chart.json';
import floorPlan from './floor-plan.json';
import northstarTour from './northstar-tour.json';
import componentGalleryStream from './component-gallery-stream.json';
import contactLookup from './contact-lookup.json';
import restaurantFinder from './restaurant-finder.json';
import flightStatus from './flight-status.json';
import weatherWidget from './weather-widget.json';
import bookingForm from './booking-form.json';
import rizzchartsChart from './rizzcharts-chart.json';

export const scenarios = {
  // Real v0.8 sample scenarios (from samples/agent/adk/) — these work with the renderer
  'restaurant-booking': restaurantBooking,
  'restaurant-list': restaurantList,
  'restaurant-grid': restaurantGrid,
  'restaurant-confirmation': restaurantConfirmation,
  'contact-card': contactCard,
  'contact-list': contactList,
  'org-chart': orgChart,
  'floor-plan': floorPlan,
  // Dojo-specific scenarios
  'northstar-tour': northstarTour,
  'kitchen-sink': kitchenSink,
  'component-gallery-stream': componentGalleryStream,
  'contact-lookup': contactLookup,
  'restaurant-finder': restaurantFinder,
  'flight-status': flightStatus,
  'weather-widget': weatherWidget,
  'booking-form': bookingForm,
  'rizzcharts-chart': rizzchartsChart,
};

export type ScenarioId = keyof typeof scenarios;
