// Curated v0.8 scenarios — verified working, distinct, showcase-worthy
import restaurantBooking from './restaurant-booking.json';
import restaurantConfirmation from './restaurant-confirmation.json';
import restaurantFinder from './restaurant-finder.json';
import contactCard from './contact-card.json';
import contactLookup from './contact-lookup.json';
import floorPlan from './floor-plan.json';

export const scenarios = {
  'restaurant-finder': restaurantFinder,
  'restaurant-booking': restaurantBooking,
  'restaurant-confirmation': restaurantConfirmation,
  'contact-lookup': contactLookup,
  // 'contact-card': contactCard,
  // 'floor-plan': floorPlan,
};

export type ScenarioId = keyof typeof scenarios;
